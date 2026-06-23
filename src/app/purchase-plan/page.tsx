'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
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
  schoolName?: string | { _id?: string; name?: string }
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

const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

const countryOptions = [
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'BD', label: '🇧🇩 Bangladesh' },
  { value: 'GH', label: '🇬🇭 Ghana' },
  { value: 'AE', label: '🇦🇪 United Arab Emirates' },
  { value: 'AU', label: '🇦🇺 Australia' },
  { value: 'CA', label: '🇨🇦 Canada' },
  { value: 'IN', label: '🇮🇳 India' },
  { value: 'SG', label: '🇸🇬 Singapore' },
]

const paymentSteps = [
  'Secure school billing powered by Stripe',
  'School access activates automatically after payment confirmation',
]

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount || 0)

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
        reject(new Error('Unable to load Stripe.js')),
      )
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.async = true
    script.dataset.stripeJs = 'true'
    script.onload = () => resolve(window.Stripe ?? null)
    script.onerror = () => reject(new Error('Unable to load Stripe.js'))
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
  const [billingEmail, setBillingEmail] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [country, setCountry] = useState('GB')
  const [billingAddress, setBillingAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
  })
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
        if (profile && stored) setUser({ ...stored, ...profile })

        const { school, isActive } = await getAssignedSchoolAccess(profile)
        if (isActive) {
          router.replace('/profile')
          return
        }

        if (!school?._id) {
          toast.error('No assigned school found for this account.')
          setPlans([])
          return
        }

        const price = Number(school.subscribePrice || 0)
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
      } catch {
        const stored = getUser<UserData>()
        if (stored?.email) setBillingEmail(stored.email)
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
          placeholder: 'MM / YY',
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
            'Stripe checkout could not be initialized. Check the publishable key setup and reload the page.',
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
      toast.error('This school does not have a valid subscription price yet.')
      return
    }

    if (!stripeRef.current || !cardNumberElementRef.current) {
      toast.error('Stripe checkout is still loading.')
      return
    }

    if (!billingEmail.trim()) {
      toast.error('Please enter a billing email.')
      return
    }

    if (!cardholderName.trim()) {
      toast.error('Please enter the name on card.')
      return
    }

    setSubmitting(true)
    setCardErrors({ number: '', expiry: '', cvc: '' })
    setStatus({
      type: 'loading',
      message: 'Creating your secure payment session...',
    })

    try {
      const paymentRes = await axiosInstance.post(
        `/payment/school/${selectedPlan._id}`,
      )
      const paymentData = paymentRes.data?.data as {
        clientSecret: string
        amount: number
      }

      setStatus({
        type: 'loading',
        message: 'Confirming card payment with Stripe...',
      })

      const { error, paymentIntent } =
        await stripeRef.current.confirmCardPayment(paymentData.clientSecret, {
          payment_method: {
            card: cardNumberElementRef.current,
            billing_details: {
              name: cardholderName.trim(),
              email: billingEmail.trim(),
              address: {
                country,
                line1: billingAddress.line1.trim() || undefined,
                line2: billingAddress.line2.trim() || undefined,
                city: billingAddress.city.trim() || undefined,
                state: billingAddress.state.trim() || undefined,
                postal_code: billingAddress.postalCode.trim() || undefined,
              },
            },
          },
        })

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

  return (
    <AuthShell maxWidth="max-w-[1120px]">
      <AuthLogo />

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        {/* ─── LEFT: School Subscription ─── */}
        <section className="rounded-[24px] border border-[#D8E4EC] bg-[linear-gradient(180deg,#F7FBFD_0%,#FFFFFF_100%)] p-5 shadow-[0_18px_48px_rgba(6,61,91,0.08)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#E8F4EA] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4D7C0F]">
                <Sparkles className="size-3.5" />
                School Subscription
              </span>
              <h1 className="mt-3 text-[28px] font-bold leading-[1.12] text-[#0F172A] sm:text-[34px]">
                Activate your iLearnReady school workspace
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[#475569]">
                Your school subscription is assigned by the admin dashboard.
                Complete checkout to unlock your dashboard, learner progress
                tools, live classes, and reporting access.
              </p>
            </div>

            <div className="min-w-[220px] rounded-2xl bg-[#063D5B] px-4 py-3 text-white shadow-[0_14px_34px_rgba(6,61,91,0.18)]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/70">
                Payment notes
              </p>
              <ul className="mt-2 space-y-2">
                {paymentSteps.map(step => (
                  <li
                    key={step}
                    className="flex items-start gap-2 text-[13px] leading-5"
                  >
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#A3E635]" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[20px] font-bold text-[#0F172A]">
                Assigned school subscription
              </h2>
              {!loadingPlans && plans.length > 0 ? (
                <p className="text-[14px] font-medium text-[#64748B]">
                  Ready for checkout
                </p>
              ) : null}
            </div>

            {loadingPlans ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[0, 1].map(index => (
                  <div
                    key={index}
                    className="h-[190px] animate-pulse rounded-[22px] border border-[#E2E8F0] bg-[#F8FAFC]"
                  />
                ))}
              </div>
            ) : plans.length ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {plans.map(plan => {
                  const isSelected = plan._id === selectedPlanId

                  return (
                    <button
                      key={plan._id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan._id)}
                      className={`rounded-[22px] border p-5 text-left transition ${
                        isSelected
                          ? 'border-[#063D5B] bg-[#063D5B] text-white shadow-[0_24px_60px_rgba(6,61,91,0.2)]'
                          : 'border-[#D8E4EC] bg-white text-[#0F172A] hover:border-[#8AA9BD] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            className={`text-[13px] font-semibold uppercase tracking-[0.18em] ${
                              isSelected ? 'text-[#BFE7FF]' : 'text-[#6A9D23]'
                            }`}
                          >
                            School access
                          </p>
                          <h3 className="mt-2 text-[24px] font-bold">
                            {plan.name}
                          </h3>
                        </div>
                        {isSelected ? (
                          <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold">
                            Selected ✓
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 flex items-end gap-2">
                        <span className="text-[30px] font-bold">
                          {formatCurrency(plan.price)}
                        </span>
                        <span
                          className={
                            isSelected
                              ? 'pb-1 text-white/70'
                              : 'pb-1 text-[#64748B]'
                          }
                        >
                          one-time payment
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-[22px] border border-dashed border-[#CBD5E1] bg-white px-6 py-8 text-center">
                <p className="text-[18px] font-semibold text-[#0F172A]">
                  No assigned school subscription found
                </p>
                <p className="mt-2 text-[15px] text-[#64748B]">
                  Please ask the admin to assign your account to a school with a
                  valid subscription price.
                </p>
              </div>
            )}
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
                {formatCurrency(selectedPlan?.price || 0)}
              </p>
            </div>

            <div className="mt-4 space-y-1.5 border-t border-[#E2E8F0] pt-3">
              <div className="flex items-center justify-between text-[13px] text-[#64748B]">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedPlan?.price || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px] text-[#64748B]">
                <span>Tax</span>
                <span>Included</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-2 text-[15px] font-bold text-[#0F172A]">
                <span>Total due today</span>
                <span>{formatCurrency(selectedPlan?.price || 0)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── RIGHT: Checkout ─── */}
        <aside className="rounded-[24px] border border-[#D8E4EC] bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-6">
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

            {/* Country - shadcn Select */}
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                Country
              </label>
              <Select
                value={country}
                onValueChange={val => {
                  if (val) setCountry(val)
                }}
              >
                <SelectTrigger className="mt-1.5 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 text-[14px] text-[#0F172A] outline-none transition focus:border-[#063D5B] focus:ring-2 focus:ring-[#063D5B]/10 focus:ring-offset-0">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-[#E2E8F0] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
                  {countryOptions.map(option => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer rounded-lg px-3 py-2.5 text-[15px] text-[#0F172A] hover:bg-[#F0F7FF] focus:bg-[#F0F7FF]"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {/* Billing Address */}
            <div>
              <label
                htmlFor="billingAddressLine1"
                className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#64748B]"
              >
                Billing address
              </label>
              <div className="mt-1.5 space-y-2">
                <input
                  id="billingAddressLine1"
                  type="text"
                  value={billingAddress.line1}
                  onChange={event =>
                    setBillingAddress(current => ({
                      ...current,
                      line1: event.target.value,
                    }))
                  }
                  placeholder="Address line 1"
                  autoComplete="billing address-line1"
                  className="h-10 w-full rounded-lg border border-[#CBD5E1] px-3.5 text-[14px] text-[#0F172A] outline-none transition focus:border-[#063D5B] focus:ring-2 focus:ring-[#063D5B]/10"
                />
                <input
                  type="text"
                  value={billingAddress.line2}
                  onChange={event =>
                    setBillingAddress(current => ({
                      ...current,
                      line2: event.target.value,
                    }))
                  }
                  placeholder="Apartment, suite, etc. (optional)"
                  autoComplete="billing address-line2"
                  className="h-10 w-full rounded-lg border border-[#CBD5E1] px-3.5 text-[14px] text-[#0F172A] outline-none transition focus:border-[#063D5B] focus:ring-2 focus:ring-[#063D5B]/10"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={billingAddress.city}
                    onChange={event =>
                      setBillingAddress(current => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    placeholder="City"
                    autoComplete="billing address-level2"
                    className="h-10 w-full rounded-lg border border-[#CBD5E1] px-3.5 text-[14px] text-[#0F172A] outline-none transition focus:border-[#063D5B] focus:ring-2 focus:ring-[#063D5B]/10"
                  />
                  <input
                    type="text"
                    value={billingAddress.state}
                    onChange={event =>
                      setBillingAddress(current => ({
                        ...current,
                        state: event.target.value,
                      }))
                    }
                    placeholder="State / county"
                    autoComplete="billing address-level1"
                    className="h-10 w-full rounded-lg border border-[#CBD5E1] px-3.5 text-[14px] text-[#0F172A] outline-none transition focus:border-[#063D5B] focus:ring-2 focus:ring-[#063D5B]/10"
                  />
                </div>
                <input
                  type="text"
                  value={billingAddress.postalCode}
                  onChange={event =>
                    setBillingAddress(current => ({
                      ...current,
                      postalCode: event.target.value,
                    }))
                  }
                  placeholder="Postal code"
                  autoComplete="billing postal-code"
                  className="h-10 w-full rounded-lg border border-[#CBD5E1] px-3.5 text-[14px] text-[#0F172A] outline-none transition focus:border-[#063D5B] focus:ring-2 focus:ring-[#063D5B]/10"
                />
              </div>
            </div>
          </div>

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
              !stripeReady ||
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
              ? 'Processing payment...'
              : selectedPlan
                ? `Pay ${formatCurrency(selectedPlan.price)} securely`
                : 'Assigned school required'}
          </button>

          <p className="mt-4 text-center text-[13px] leading-6 text-[#64748B]">
            🔒 Payments are confirmed through Stripe. Your school subscription
            updates automatically once the payment webhook is received.
          </p>
        </aside>
      </div>
    </AuthShell>
  )
}
