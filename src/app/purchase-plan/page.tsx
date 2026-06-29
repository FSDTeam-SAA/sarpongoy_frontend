'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  CreditCard,
  Landmark,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import AuthLogo from '@/components/auth/AuthLogo'
import AuthShell from '@/components/auth/AuthShell'
import { axiosInstance } from '@/lib/axios'
import { getToken, getUser, setUser } from '@/lib/auth-helpers'
import { getAssignedSchoolAccess } from '@/lib/school-access'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeInstance
  }
}

interface CheckoutPlan {
  _id: string
  name: string
  price: number
  months: number
  features?: string[]
}

interface UserData {
  _id?: string
  email?: string
  totalStudent?: number
  schoolName?: string | { _id?: string; name?: string }
}

interface SchoolPaymentOverview {
  totalAmountDue?: number
  totalCollected?: number
  balanceDue?: number
  payments?: Array<{
    id: string
    amount?: number
    status?: 'pending' | 'offline_pending' | 'completed' | 'failed' | 'refunded'
    paymentPlan?: PaymentPlan
    paymentMethod?: string
    createdAt?: string
  }>
}

interface StripeElementsInstance {
  create: (
    type: 'cardNumber' | 'cardExpiry' | 'cardCvc',
    options?: Record<string, unknown>,
  ) => StripeCardElementInstance
}

interface StripeCardElementInstance {
  mount: (selector: string) => void
  destroy: () => void
  on: (
    event: 'change',
    handler: (event: { error?: { message?: string } }) => void,
  ) => void
}

interface StripeInstance {
  elements: (options?: Record<string, unknown>) => StripeElementsInstance
  confirmCardPayment: (
    clientSecret: string,
    data: Record<string, unknown>,
  ) => Promise<{
    error?: { message?: string }
    paymentIntent?: { id: string; status: string }
  }>
}

type StripeFactory = (publishableKey: string) => StripeInstance

type PaymentPlan = 'first_term' | 'second_term' | 'third_term' | 'full_year'
type PaymentMethod = 'card' | 'offline'

const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

const paymentPlanOptions: Array<{
  value: PaymentPlan
  label: string
  helper: string
}> = [
  {
    value: 'first_term',
    label: 'First Term',
    helper: 'Pay one third of the school year total.',
  },
  {
    value: 'second_term',
    label: 'Second Term',
    helper: 'Pay one third of the school year total.',
  },
  {
    value: 'third_term',
    label: 'Third Term',
    helper: 'Pay one third of the school year total.',
  },
  {
    value: 'full_year',
    label: 'Full Term',
    helper: 'Pay the full calculated school year total.',
  },
]

const termDueDateFields: Array<{
  key: 'firstTerm' | 'secondTerm' | 'thirdTerm'
  label: string
  plan: Exclude<PaymentPlan, 'full_year'>
}> = [
  { key: 'firstTerm', label: 'First Term Due Date', plan: 'first_term' },
  { key: 'secondTerm', label: 'Second Term Due Date', plan: 'second_term' },
  { key: 'thirdTerm', label: 'Third Term Due Date', plan: 'third_term' },
]

const paymentSteps = ['Offline payments activate after admin approval']

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount || 0)

const formatDate = (value?: string) => {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const delay = (ms: number) =>
  new Promise(resolve => window.setTimeout(resolve, ms))

function loadStripeScript() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.Stripe) return Promise.resolve(window.Stripe)

  return new Promise<StripeFactory | null>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-stripe-js="true"]',
    )

    if (existing) {
      existing.addEventListener('load', () => resolve(window.Stripe ?? null))
      existing.addEventListener('error', () =>
        reject(new Error('Unable to load card checkout assets')),
      )
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.async = true
    script.dataset.stripeJs = 'true'
    script.onload = () => resolve(window.Stripe ?? null)
    script.onerror = () => reject(new Error('Unable to load card checkout assets'))
    document.body.appendChild(script)
  })
}

export default function PurchasePlanPage() {
  const router = useRouter()
  const cardNumberContainerId = 'purchase-plan-card-number-element'
  const cardExpiryContainerId = 'purchase-plan-card-expiry-element'
  const cardCvcContainerId = 'purchase-plan-card-cvc-element'
  const cardNumberElementRef = useRef<StripeCardElementInstance | null>(null)
  const cardExpiryElementRef = useRef<StripeCardElementInstance | null>(null)
  const cardCvcElementRef = useRef<StripeCardElementInstance | null>(null)
  const stripeRef = useRef<StripeInstance | null>(null)

  const [plans, setPlans] = useState<CheckoutPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [stripeReady, setStripeReady] = useState(false)
  const [accessNotice, setAccessNotice] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'checkout'>('details')
  const [billingEmail, setBillingEmail] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [totalStudents, setTotalStudents] = useState(0)
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>('full_year')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [paymentOverview, setPaymentOverview] =
    useState<SchoolPaymentOverview | null>(null)
  const [termDueDates, setTermDueDates] = useState({
    firstTerm: '',
    secondTerm: '',
    thirdTerm: '',
  })
  const [offlinePaymentNote, setOfflinePaymentNote] = useState('')
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error'
    message: string
  }>({ type: 'idle', message: '' })
  const [cardErrors, setCardErrors] = useState({
    number: '',
    expiry: '',
    cvc: '',
  })

  const selectedPlan = useMemo(
    () => plans.find(plan => plan._id === selectedPlanId) || null,
    [plans, selectedPlanId],
  )

  const perStudentCharge = selectedPlan?.price || 0
  const calculatedTotalAmount = Number(
    (totalStudents * perStudentCharge).toFixed(2),
  )
  const completedPayments =
    paymentOverview?.payments?.filter(
      payment => payment.status === 'completed',
    ) || []
  const paidPlans = new Set(
    completedPayments.map(payment => payment.paymentPlan),
  )
  const hasPaidFullTerm = paidPlans.has('full_year')
  const hasOfflinePending = Boolean(
    paymentOverview?.payments?.some(
      payment => payment.status === 'offline_pending',
    ),
  )
  const paidAmount = Number(paymentOverview?.totalCollected || 0)
  const balanceDue = Math.max(
    0,
    Number(
      (
        (paymentOverview?.balanceDue ?? calculatedTotalAmount - paidAmount) ||
        0
      ).toFixed(2),
    ),
  )
  const termAmount = Number((calculatedTotalAmount / 3).toFixed(2))
  const isSelectedPlanPaid =
    hasPaidFullTerm ||
    (paymentPlan !== 'full_year' && paidPlans.has(paymentPlan)) ||
    (paymentPlan === 'full_year' &&
      balanceDue <= 0 &&
      calculatedTotalAmount > 0)
  const selectedPaymentAmount = isSelectedPlanPaid
    ? 0
    : paymentPlan === 'full_year'
      ? paymentOverview
        ? balanceDue
        : calculatedTotalAmount
      : Math.min(termAmount, balanceDue || termAmount)
  const selectedPaymentPlanLabel =
    paymentPlanOptions.find(option => option.value === paymentPlan)?.label ||
    'Full Term'
  const paymentProgress = calculatedTotalAmount
    ? Math.min(100, Math.round((paidAmount / calculatedTotalAmount) * 100))
    : 0

  useEffect(() => {
    const init = async () => {
      const token = getToken()

      if (!token) {
        router.replace('/login')
        return
      }

      try {
        const res = await axiosInstance.get('/user/profile')
        const profile = res.data?.data as UserData
        const stored = getUser<UserData>()
        const checkoutEmail = profile?.email || stored?.email || ''
        if (checkoutEmail) setBillingEmail(checkoutEmail)
        setTotalStudents(Number(profile?.totalStudent || 0))
        if (profile && stored) setUser({ ...stored, ...profile })

        const { school, isActive } = await getAssignedSchoolAccess(profile)
        setAccessNotice(
          isActive
            ? 'Your school access is active. You can still review subscription details or renew early.'
            : 'Your school access is restricted until payment is completed or approved.',
        )

        if (!school?._id) {
          toast.error('No assigned school found for this account.')
          setPlans([])
          setPaymentOverview(null)
          return
        }

        const price = Number(school.subscribePrice || 0)
        setTermDueDates({
          firstTerm: school.termConfig?.firstTermDueDate || '',
          secondTerm: school.termConfig?.secondTermDueDate || '',
          thirdTerm: school.termConfig?.thirdTermDueDate || '',
        })
        setPlans([
          {
            _id: school._id,
            name: school.name || 'School Subscription',
            price,
            months: 0,
            features: [
              'Assigned school workspace',
              'Student progress tools',
              'Live classes',
              'Reporting dashboard',
            ],
          },
        ])
        setSelectedPlanId(school._id)

        try {
          const overviewRes = await axiosInstance.get(
            `/payment/school/${school._id}/overview`,
          )
          setPaymentOverview(overviewRes.data?.data || null)
        } catch {
          setPaymentOverview(null)
        }
      } catch {
        const stored = getUser<UserData>()
        if (stored?.email) setBillingEmail(stored.email)
        setTotalStudents(Number(stored?.totalStudent || 0))
        setPaymentOverview(null)
        toast.error('Unable to load your assigned school subscription.')
      } finally {
        setLoadingPlans(false)
      }
    }

    init()
  }, [router])

  useEffect(() => {
    let cancelled = false

    const setupStripe = async () => {
      try {
        const stripeFactory = await loadStripeScript()
        if (cancelled || !stripeFactory) return

        const stripe = stripeFactory(STRIPE_PUBLISHABLE_KEY)
        const elements = stripe.elements({ locale: 'en' })
        const elementStyle = {
          style: {
            base: {
              fontSize: '15px',
              color: '#0f172a',
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              '::placeholder': { color: '#94a3b8' },
            },
            invalid: { color: '#dc2626' },
          },
        }

        const cardNumberElement = elements.create('cardNumber', {
          ...elementStyle,
          placeholder: '1234 1234 1234 1234',
          showIcon: true,
        })
        const cardExpiryElement = elements.create('cardExpiry', {
          ...elementStyle,
          placeholder: 'MM / YYYY',
        })
        const cardCvcElement = elements.create('cardCvc', {
          ...elementStyle,
          placeholder: 'CVC',
        })

        cardNumberElement.mount(`#${cardNumberContainerId}`)
        cardExpiryElement.mount(`#${cardExpiryContainerId}`)
        cardCvcElement.mount(`#${cardCvcContainerId}`)

        cardNumberElement.on('change', event => {
          setCardErrors(current => ({
            ...current,
            number: event.error?.message || '',
          }))
        })
        cardExpiryElement.on('change', event => {
          setCardErrors(current => ({
            ...current,
            expiry: event.error?.message || '',
          }))
        })
        cardCvcElement.on('change', event => {
          setCardErrors(current => ({
            ...current,
            cvc: event.error?.message || '',
          }))
        })

        stripeRef.current = stripe
        cardNumberElementRef.current = cardNumberElement
        cardExpiryElementRef.current = cardExpiryElement
        cardCvcElementRef.current = cardCvcElement
        setStripeReady(true)
      } catch {
        setStripeReady(false)
        setStatus({
          type: 'error',
          message:
            'Card checkout could not be initialized. Check the payment setup and reload the page.',
        })
      }
    }

    setupStripe()

    return () => {
      cancelled = true
      cardNumberElementRef.current?.destroy()
      cardExpiryElementRef.current?.destroy()
      cardCvcElementRef.current?.destroy()
      cardNumberElementRef.current = null
      cardExpiryElementRef.current = null
      cardCvcElementRef.current = null
      stripeRef.current = null
    }
  }, [])

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast.error('No assigned school subscription found.')
      return
    }

    if (selectedPlan.price <= 0) {
      toast.error('This school does not have a valid per-student charge yet.')
      return
    }

    if (totalStudents <= 0) {
      toast.error('This school does not have total students set yet.')
      return
    }

    if (isSelectedPlanPaid || selectedPaymentAmount <= 0) {
      toast.error('This payment option is already paid.')
      return
    }

    if (hasOfflinePending) {
      toast.error(
        'An offline payment request is already waiting for admin approval.',
      )
      return
    }

    if (
      paymentMethod === 'card' &&
      (!stripeRef.current || !cardNumberElementRef.current)
    ) {
      toast.error('Card checkout is still loading.')
      return
    }

    if (!billingEmail.trim()) {
      toast.error('Please enter a billing email.')
      return
    }

    if (paymentMethod === 'card' && !cardholderName.trim()) {
      toast.error('Please enter the name on card.')
      return
    }

    setSubmitting(true)
    setCardErrors({ number: '', expiry: '', cvc: '' })
    setStatus({
      type: 'loading',
      message:
        paymentMethod === 'offline'
          ? 'Submitting offline payment request...'
          : 'Creating your secure payment session...',
    })

    try {
      const paymentPayload = { paymentPlan }

      if (paymentMethod === 'offline') {
        await axiosInstance.post(
          `/payment/school/${selectedPlan._id}/offline`,
          {
            ...paymentPayload,
            offlinePaymentNote,
          },
        )

        setStatus({
          type: 'success',
          message:
            'Offline payment request submitted. Your school access will activate automatically after admin approval.',
        })
        toast.success('Offline payment request submitted for admin approval.')
        return
      }

      const stripe = stripeRef.current
      const cardNumberElement = cardNumberElementRef.current

      if (!stripe || !cardNumberElement) {
        throw new Error('Card checkout is still loading.')
      }

      setStatus({
        type: 'loading',
        message: 'Confirming card payment...',
      })

      const createPaymentIntent = async (forceNew = false) => {
        const paymentRes = await axiosInstance.post(
          `/payment/school/${selectedPlan._id}`,
          { ...paymentPayload, forceNew },
        )
        return paymentRes.data?.data as {
          clientSecret: string
          amount: number
        }
      }

      const confirmPayment = async (clientSecret: string) =>
        stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardNumberElement,
            billing_details: {
              name: cardholderName.trim(),
              email: billingEmail.trim(),
            },
          },
        })

      const paymentData = await createPaymentIntent()
      let { error, paymentIntent } = await confirmPayment(
        paymentData.clientSecret,
      )

      if (error?.message?.includes('No such payment_intent')) {
        setStatus({
          type: 'loading',
          message: 'Refreshing checkout session and retrying payment...',
        })
        const refreshedPaymentData = await createPaymentIntent(true)
        const retried = await confirmPayment(refreshedPaymentData.clientSecret)
        error = retried.error
        paymentIntent = retried.paymentIntent
      }

      if (error) {
        throw new Error(error.message || 'Payment confirmation failed.')
      }

      if (paymentIntent?.status !== 'succeeded') {
        throw new Error(
          `Payment status returned as ${paymentIntent?.status || 'unknown'}.`,
        )
      }

      setStatus({
        type: 'success',
        message: `Payment successful! Activating your school access... Reference: ${paymentIntent.id}`,
      })

      setStatus({
        type: 'loading',
        message: 'Finalising your school access...',
      })

      // Update localStorage with fresh profile data now that payment succeeded
      let accessActivated = false
      try {
        for (let attempt = 0; attempt < 8; attempt += 1) {
          const res = await axiosInstance.get('/user/profile')
          const profile = res.data?.data as UserData
          const stored = getUser<UserData>()
          if (profile && stored) setUser({ ...stored, ...profile })

          const { isActive } = await getAssignedSchoolAccess(profile)
          if (isActive) {
            accessActivated = true
            break
          }

          await delay(1200)
        }
      } catch {
        // Non-fatal — profile page will refetch anyway
      }

      if (!accessActivated) {
        setStatus({
          type: 'loading',
          message:
            'Payment confirmed. Waiting for the payment webhook to activate your school access...',
        })
        return
      }

      toast.success('School access activated! Redirecting to your profile...')
      router.push('/profile')
    } catch (error: unknown) {
      const message =
        (
          error as {
            response?: { data?: { message?: string } }
            message?: string
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Payment could not be completed.'

      setStatus({ type: 'error', message })
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const getPlanStatus = (plan: PaymentPlan) => {
    if (plan === 'full_year' && balanceDue <= 0 && calculatedTotalAmount > 0) {
      return 'Paid'
    }
    if (hasPaidFullTerm || paidPlans.has(plan)) return 'Paid'
    if (
      paymentOverview?.payments?.some(
        payment =>
          payment.paymentPlan === plan &&
          (payment.status === 'pending' ||
            payment.status === 'offline_pending'),
      )
    ) {
      return 'Pending'
    }
    return 'Due'
  }

  const getPlanAmount = (plan: PaymentPlan) => {
    if (hasPaidFullTerm || paidPlans.has(plan)) return 0
    if (plan === 'full_year')
      return paymentOverview ? balanceDue : calculatedTotalAmount
    return Math.min(termAmount, balanceDue || termAmount)
  }

  return (
    <AuthShell maxWidth="max-w-[1120px]">
      <AuthLogo />

      <div className="sticky top-3 z-40 mt-4 flex items-center gap-2 rounded-2xl border border-[#D8E4EC] bg-white/95 p-1 shadow-[0_10px_24px_rgba(15,23,42,0.05)] backdrop-blur lg:static lg:mt-4 lg:bg-white lg:backdrop-blur-0">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex-1 rounded-xl px-3 py-2 text-[14px] font-semibold transition ${
            activeTab === 'details'
              ? 'bg-[#063D5B] text-white'
              : 'text-[#475569]'
          }`}
        >
          Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('checkout')}
          className={`flex-1 rounded-xl px-3 py-2 text-[14px] font-semibold transition ${
            activeTab === 'checkout'
              ? 'bg-[#063D5B] text-white'
              : 'text-[#475569]'
          }`}
        >
          Check Out
        </button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        {/* ─── LEFT: School Subscription ─── */}
        <section
          className={`rounded-[24px] border border-[#D8E4EC] bg-[linear-gradient(180deg,#F7FBFD_0%,#FFFFFF_100%)] p-4 shadow-[0_18px_48px_rgba(6,61,91,0.08)] sm:p-5 ${
            activeTab === 'checkout' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#E8F4EA] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4D7C0F]">
              <Sparkles className="size-3.5" />
              School Subscription
            </span>
            <h1 className="mt-3 max-w-2xl text-[24px] font-bold leading-[1.15] text-[#0F172A] sm:text-[30px]">
              Activate your iLearnReady workspace
            </h1>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-[#475569]">
              Complete payment for the admin-assigned school plan.
            </p>
            {accessNotice ? (
              <div className="mt-4 rounded-2xl border border-[#CFE4D4] bg-[#F0FDF4] px-4 py-3 text-[13px] leading-5 text-[#166534]">
                {accessNotice}
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              {paymentSteps.map(step => (
                <span
                  key={step}
                  className="inline-flex items-center gap-2 rounded-full border border-[#CFE4D4] bg-white px-3 py-1.5 text-[12px] font-medium text-[#315B1A]"
                >
                  <ShieldCheck className="size-3.5 shrink-0 text-[#6A9D23]" />
                  {step}
                </span>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-[#D8E4EC] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                    Payment progress
                  </p>
                  <p className="mt-1 text-[22px] font-bold text-[#063D5B]">
                    {formatCurrency(paidAmount)} paid
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-[#64748B]">
                    Remaining balance
                  </p>
                  <p className="mt-1 text-[18px] font-bold text-[#0F172A]">
                    {formatCurrency(balanceDue)}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                <div
                  className="h-full rounded-full bg-[#6A9D23] transition-all"
                  style={{ width: `${paymentProgress}%` }}
                />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                {paymentPlanOptions.map(option => (
                  <div
                    key={option.value}
                    className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold text-[#0F172A]">
                        {option.label}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          getPlanStatus(option.value) === 'Paid'
                            ? 'bg-[#DCFCE7] text-[#166534]'
                            : getPlanStatus(option.value) === 'Pending'
                              ? 'bg-[#FEF3C7] text-[#92400E]'
                              : 'bg-[#E0F2FE] text-[#075985]'
                        }`}
                      >
                        {getPlanStatus(option.value)}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-[#64748B]">
                      {formatCurrency(getPlanAmount(option.value))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[18px] font-bold text-[#0F172A]">
                Assigned school
              </h2>
              {!loadingPlans && plans.length > 0 ? (
                <p className="text-[13px] font-medium text-[#64748B]">
                  Ready for checkout
                </p>
              ) : null}
            </div>

            {loadingPlans ? (
              <div className="mt-3 grid gap-3">
                {[0].map(index => (
                  <div
                    key={index}
                    className="h-[120px] animate-pulse rounded-[20px] border border-[#E2E8F0] bg-[#F8FAFC]"
                  />
                ))}
              </div>
            ) : plans.length ? (
              <div className="mt-3 grid gap-3">
                {plans.map(plan => {
                  const isSelected = plan._id === selectedPlanId

                  return (
                    <button
                      key={plan._id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan._id)}
                      aria-pressed={isSelected}
                      className={`flex flex-col justify-between gap-4 rounded-[20px] border p-4 text-left transition sm:flex-row sm:items-center ${
                        isSelected
                          ? 'border-[#063D5B] bg-[#063D5B] text-white shadow-[0_18px_42px_rgba(6,61,91,0.18)] ring-2 ring-[#063D5B]/15'
                          : 'border-[#D8E4EC] bg-white text-[#0F172A] hover:border-[#8AA9BD] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p
                          className={`text-[12px] font-semibold uppercase tracking-[0.16em] ${
                            isSelected ? 'text-[#BFE7FF]' : 'text-[#6A9D23]'
                          }`}
                        >
                          School access
                        </p>
                        <h3 className="mt-2 text-[21px] font-bold leading-tight sm:text-[24px]">
                          {plan.name}
                        </h3>
                      </div>

                      <div className="flex shrink-0 items-end justify-between gap-4 sm:flex-col sm:items-end">
                        {isSelected ? (
                          <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold">
                            Selected
                          </span>
                        ) : null}
                        <div className="flex items-end gap-2">
                          <span className="text-[28px] font-bold">
                            {formatCurrency(plan.price)}
                          </span>
                          <span
                            className={
                              isSelected
                                ? 'pb-1 text-white/70'
                                : 'pb-1 text-[#64748B]'
                            }
                          >
                            per student
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="mt-3 rounded-[20px] border border-dashed border-[#CBD5E1] bg-white px-5 py-6 text-center">
                <p className="text-[17px] font-semibold text-[#0F172A]">
                  No assigned school subscription found
                </p>
                <p className="mt-2 text-[14px] text-[#64748B]">
                  Please ask the admin to assign a school with a valid
                  per-student charge.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-[20px] bg-white p-4 ring-1 ring-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-[#EEF6FB] text-[#063D5B]">
                <CalendarDays className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                  Payment Schedule
                </p>
                <h2 className="text-[18px] font-bold text-[#0F172A]">
                  Choose term payment option
                </h2>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                Payment option
              </label>
              <Select
                value={paymentPlan}
                onValueChange={value => setPaymentPlan(value as PaymentPlan)}
              >
                <SelectTrigger className="mt-1.5 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 text-[14px] text-[#0F172A] outline-none transition focus:border-[#063D5B] focus:ring-2 focus:ring-[#063D5B]/10 focus:ring-offset-0">
                  <SelectValue placeholder="Select payment option">
                    {selectedPaymentPlanLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-[#E2E8F0] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
                  {paymentPlanOptions.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={getPlanStatus(option.value) === 'Paid'}
                      className="cursor-pointer rounded-lg px-3 py-2.5 text-[15px] text-[#0F172A] hover:bg-[#F0F7FF] focus:bg-[#F0F7FF]"
                    >
                      {option.label} · {getPlanStatus(option.value)} ·{' '}
                      {formatCurrency(getPlanAmount(option.value))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-[13px] text-[#64748B]">
                {
                  paymentPlanOptions.find(
                    option => option.value === paymentPlan,
                  )?.helper
                }
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {termDueDateFields.map(field => (
                <div
                  key={field.key}
                  className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5"
                >
                  <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">
                    {field.label}
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-[#0F172A]">
                    {formatDate(termDueDates[field.key])}
                  </p>
                  <p className="mt-1 text-[12px] font-semibold text-[#063D5B]">
                    {getPlanStatus(field.plan)} ·{' '}
                    {formatCurrency(getPlanAmount(field.plan))}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[20px] bg-white p-4 ring-1 ring-[#E2E8F0]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
              Order Summary
            </p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <div>
                <p className="text-[16px] font-bold text-[#0F172A]">
                  {selectedPlan?.name || 'Assigned school'}
                </p>
                <p className="mt-1 text-[13px] text-[#64748B]">
                  {selectedPlan
                    ? 'School subscription access'
                    : 'Your school subscription summary will appear here'}
                </p>
              </div>
              <p className="text-[24px] font-bold text-[#063D5B]">
                {formatCurrency(selectedPaymentAmount)}
              </p>
            </div>

            <div className="mt-4 space-y-1.5 border-t border-[#E2E8F0] pt-3">
              <div className="flex items-center justify-between text-[13px] text-[#64748B]">
                <span>Total students</span>
                <span>{totalStudents.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[13px] text-[#64748B]">
                <span>Per-student charge</span>
                <span>{formatCurrency(perStudentCharge)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px] text-[#64748B]">
                <span>Calculated school year total</span>
                <span>{formatCurrency(calculatedTotalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px] text-[#64748B]">
                <span>Already paid</span>
                <span>{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px] text-[#64748B]">
                <span>Remaining balance</span>
                <span>{formatCurrency(balanceDue)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px] text-[#64748B]">
                <span>Selected payment option</span>
                <span>
                  {selectedPaymentPlanLabel} · {getPlanStatus(paymentPlan)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-2 text-[15px] font-bold text-[#0F172A]">
                <span>
                  {paymentMethod === 'offline'
                    ? 'Amount to approve'
                    : 'Total due today'}
                </span>
                <span>{formatCurrency(selectedPaymentAmount)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── RIGHT: Checkout ─── */}
        <aside
          className={`rounded-[24px] border border-[#D8E4EC] bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-6 ${
            activeTab === 'details' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#EEF6FB] text-[#063D5B]">
              <CreditCard className="size-5" />
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6A9D23]">
                Secure Checkout
              </p>
              <h2 className="text-[21px] font-bold text-[#0F172A]">
                Complete your school payment
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                Payment method
              </label>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  aria-pressed={paymentMethod === 'card'}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    paymentMethod === 'card'
                      ? 'border-[#063D5B] bg-[#EEF6FB] text-[#063D5B] ring-2 ring-[#063D5B]/15'
                      : 'border-[#CBD5E1] bg-white text-[#475569] hover:border-[#8AA9BD]'
                  }`}
                >
                  <CreditCard className="size-4" />
                  <span className="mt-2 block text-[14px] font-semibold">
                    Pay by card
                  </span>
                  <span className="mt-1 block text-[12px] leading-5">
                    Activates after card confirmation.
                  </span>
                  {paymentMethod === 'card' ? (
                    <span className="mt-2 inline-flex rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#063D5B]">
                      Selected
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('offline')}
                  aria-pressed={paymentMethod === 'offline'}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    paymentMethod === 'offline'
                      ? 'border-[#063D5B] bg-[#EEF6FB] text-[#063D5B] ring-2 ring-[#063D5B]/15'
                      : 'border-[#CBD5E1] bg-white text-[#475569] hover:border-[#8AA9BD]'
                  }`}
                >
                  <Landmark className="size-4" />
                  <span className="mt-2 block text-[14px] font-semibold">
                    Wire or offline
                  </span>
                  <span className="mt-1 block text-[12px] leading-5">
                    Admin approval activates access.
                  </span>
                  {paymentMethod === 'offline' ? (
                    <span className="mt-2 inline-flex rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#063D5B]">
                      Selected
                    </span>
                  ) : null}
                </button>
              </div>
            </div>

            {/* Billing Email */}
            <div>
              <label
                htmlFor="billingEmail"
                className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#64748B]"
              >
                Email
              </label>
              <input
                id="billingEmail"
                type="email"
                value={billingEmail}
                onChange={event => setBillingEmail(event.target.value)}
                placeholder="finance@school.com"
                autoComplete="email"
                className="mt-1.5 h-10 w-full rounded-lg border border-[#CBD5E1] px-3.5 text-[14px] text-[#0F172A] outline-none transition focus:border-[#063D5B] focus:ring-2 focus:ring-[#063D5B]/10"
              />
            </div>

            <div className={paymentMethod === 'card' ? 'space-y-3' : 'hidden'}>
              {/* Cardholder Name */}
              <div>
                <label
                  htmlFor="cardholderName"
                  className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#64748B]"
                >
                  Name on card
                </label>
                <input
                  id="cardholderName"
                  type="text"
                  value={cardholderName}
                  onChange={event => setCardholderName(event.target.value)}
                  placeholder="School finance contact"
                  autoComplete="cc-name"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#CBD5E1] px-3.5 text-[14px] text-[#0F172A] outline-none transition focus:border-[#063D5B] focus:ring-2 focus:ring-[#063D5B]/10"
                />
              </div>

              {/* Card Information */}
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                    Debit/Credit card information
                  </label>
                  <span className="rounded-full bg-[#F0FDF4] px-2.5 py-1 text-[11px] font-semibold text-[#16A34A]">
                    Secure
                  </span>
                </div>
                <div className="mt-1.5 overflow-hidden rounded-lg border border-[#CBD5E1] bg-white transition focus-within:border-[#063D5B] focus-within:ring-2 focus-within:ring-[#063D5B]/10">
                  <div className="px-3.5 py-2.5">
                    <div id={cardNumberContainerId} />
                  </div>
                  <div className="grid grid-cols-2 border-t border-[#E2E8F0]">
                    <div className="border-r border-[#E2E8F0] px-3.5 py-2.5">
                      <div id={cardExpiryContainerId} />
                    </div>
                    <div className="px-3.5 py-2.5">
                      <div id={cardCvcContainerId} />
                    </div>
                  </div>
                </div>
                {Object.values(cardErrors).some(Boolean) ? (
                  <div className="mt-2 space-y-1">
                    {cardErrors.number ? (
                      <p className="text-[13px] text-[#DC2626]">
                        {cardErrors.number}
                      </p>
                    ) : null}
                    {cardErrors.expiry ? (
                      <p className="text-[13px] text-[#DC2626]">
                        {cardErrors.expiry}
                      </p>
                    ) : null}
                    {cardErrors.cvc ? (
                      <p className="text-[13px] text-[#DC2626]">
                        {cardErrors.cvc}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {paymentMethod === 'offline' ? (
              <div>
                <label
                  htmlFor="offlinePaymentNote"
                  className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#64748B]"
                >
                  Offline payment note
                </label>
                <textarea
                  id="offlinePaymentNote"
                  value={offlinePaymentNote}
                  onChange={event => setOfflinePaymentNote(event.target.value)}
                  placeholder="Wire transfer reference, finance contact, or internal note"
                  className="mt-1.5 min-h-[96px] w-full resize-none rounded-lg border border-[#CBD5E1] px-3.5 py-3 text-[14px] text-[#0F172A] outline-none transition focus:border-[#063D5B] focus:ring-2 focus:ring-[#063D5B]/10"
                />
                <div className="mt-2 rounded-lg border border-[#FEF3C7] bg-[#FFFBEB] px-3 py-2 text-[12px] leading-5 text-[#92400E]">
                  Submit this only after the school has arranged payment by wire
                  transfer or another offline method. Admin approval will
                  activate the subscription.
                </div>
              </div>
            ) : null}
          </div>

          {isSelectedPlanPaid || hasOfflinePending ? (
            <div className="mt-4 rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] px-4 py-3 text-[13px] leading-5 text-[#92400E]">
              {hasOfflinePending
                ? 'An offline payment request is already pending. Admin approval will update the paid amount and balance.'
                : 'This payment option is already paid. Choose another due term if a balance remains.'}
            </div>
          ) : null}

          {/* Status Banner */}
          {status.type !== 'idle' ? (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-[13px] leading-5 ${
                status.type === 'success'
                  ? 'border-[#86EFAC] bg-[#F0FDF4] text-[#166534]'
                  : status.type === 'error'
                    ? 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'
                    : 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
              }`}
            >
              {status.type === 'loading' && (
                <span className="mr-2 inline-block animate-spin">⏳</span>
              )}
              {status.message}
            </div>
          ) : null}

          {/* Pay Button */}
          <button
            type="button"
            onClick={handlePayment}
            disabled={
              !selectedPlan ||
              selectedPlan.price <= 0 ||
              totalStudents <= 0 ||
              (paymentMethod === 'card' && !stripeReady) ||
              isSelectedPlanPaid ||
              selectedPaymentAmount <= 0 ||
              hasOfflinePending ||
              submitting ||
              loadingPlans
            }
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#063D5B] py-2.5 text-[15px] font-semibold text-white transition hover:bg-[#0A557D] disabled:cursor-not-allowed disabled:bg-[#94A3B8] active:scale-[0.98]"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            {submitting
              ? paymentMethod === 'offline'
                ? 'Submitting request...'
                : 'Processing payment...'
              : selectedPlan
                ? paymentMethod === 'offline'
                  ? selectedPaymentAmount > 0
                    ? `Request approval for ${formatCurrency(selectedPaymentAmount)}`
                    : 'No payment due'
                  : selectedPaymentAmount > 0
                    ? `Pay ${formatCurrency(selectedPaymentAmount)} securely`
                    : 'No payment due'
                : 'Assigned school required'}
          </button>

          <p className="mt-4 text-center text-[13px] leading-6 text-[#64748B]">
            Card payments are confirmed securely. Offline payments stay pending
            until an admin approves the request.
          </p>
        </aside>
      </div>
    </AuthShell>
  )
}
