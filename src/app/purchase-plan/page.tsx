'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import AuthLogo from '@/components/auth/AuthLogo'
import AuthShell from '@/components/auth/AuthShell'
import { axiosInstance } from '@/lib/axios'
import { getToken, getUser, setUser } from '@/lib/auth-helpers'
import { toast } from 'sonner'

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeInstance
  }
}

interface SubscribePlan {
  _id: string
  name: string
  price: number
  months: number
  features?: string[]
  status?: string
}

interface UserData {
  _id?: string
  email?: string
  subscription?: string
}

interface StripeElementsInstance {
  create: (
    type: 'card',
    options?: Record<string, unknown>,
  ) => StripeCardElementInstance
}

interface StripeCardElementInstance {
  mount: (selector: string) => void
  destroy: () => void
  on: (event: 'change', handler: (event: { error?: { message?: string } }) => void) => void
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

const FALLBACK_STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  'pk_test_51SSE8YGcSUcKVQJqhrlXPBNVNfDgmhYSMKnGs0kMKeO5CETW0MAiAnU2pGZUv47E9J77jzFptmhg6z7ksJrQ9ihG002z1tUgMm'

const countryOptions = [
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'BD', label: 'Bangladesh' },
  { value: 'GH', label: 'Ghana' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'AU', label: 'Australia' },
  { value: 'CA', label: 'Canada' },
  { value: 'IN', label: 'India' },
  { value: 'SG', label: 'Singapore' },
]

const paymentSteps = [
  'Secure school billing powered by Stripe',
  'Plan access activates automatically after payment confirmation',
  'Use test card 4242 4242 4242 4242 for demo checkout',
]

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount || 0)

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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

async function syncUserAfterPayment() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const res = await axiosInstance.get('/user/profile')
      const profile = res.data?.data
      const storedUser = getUser<UserData>()

      if (profile && storedUser) {
        setUser({ ...storedUser, ...profile })
      }

      if (profile?.subscription) return true
    } catch {
      // Keep polling briefly to allow the Stripe webhook to sync subscription state.
    }

    await sleep(1500)
  }

  return false
}

export default function PurchasePlanPage() {
  const router = useRouter()
  const cardContainerId = 'purchase-plan-card-element'
  const cardElementRef = useRef<StripeCardElementInstance | null>(null)
  const stripeRef = useRef<StripeInstance | null>(null)

  const [plans, setPlans] = useState<SubscribePlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [stripeReady, setStripeReady] = useState(false)
  const [cardholderName, setCardholderName] = useState('')
  const [country, setCountry] = useState('GB')
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error'
    message: string
  }>({ type: 'idle', message: '' })
  const [cardError, setCardError] = useState('')

  const selectedPlan = useMemo(
    () => plans.find(plan => plan._id === selectedPlanId) || null,
    [plans, selectedPlanId],
  )

  useEffect(() => {
    const token = getToken()
    const user = getUser<UserData>()

    if (!token) {
      router.replace('/login')
      return
    }

    if (user?.subscription) {
      router.replace('/profile')
      return
    }

    const loadPlans = async () => {
      setLoadingPlans(true)
      try {
        const res = await axiosInstance.get('/subscribe?limit=20&sortBy=months&sortOrder=asc')
        const activePlans = ((res.data?.data as SubscribePlan[]) || []).filter(
          plan => (plan.status || 'active') === 'active',
        )

        setPlans(activePlans)
        if (activePlans[0]) {
          setSelectedPlanId(activePlans[0]._id)
        }
      } catch {
        toast.error('Unable to load subscription plans right now.')
      } finally {
        setLoadingPlans(false)
      }
    }

    loadPlans()
  }, [router])

  useEffect(() => {
    let cancelled = false

    const setupStripe = async () => {
      try {
        const stripeFactory = await loadStripeScript()
        if (cancelled || !stripeFactory) return

        const stripe = stripeFactory(FALLBACK_STRIPE_PUBLISHABLE_KEY)
        const elements = stripe.elements({ locale: 'en' })
        const cardElement = elements.create('card', {
          hidePostalCode: true,
          style: {
            base: {
              fontSize: '15px',
              color: '#0f172a',
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              '::placeholder': { color: '#94a3b8' },
            },
            invalid: { color: '#dc2626' },
          },
        })

        cardElement.mount(`#${cardContainerId}`)
        cardElement.on('change', event => {
          setCardError(event.error?.message || '')
        })

        stripeRef.current = stripe
        cardElementRef.current = cardElement
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
      cardElementRef.current?.destroy()
      cardElementRef.current = null
      stripeRef.current = null
    }
  }, [])

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast.error('Please choose a plan first.')
      return
    }

    if (!stripeRef.current || !cardElementRef.current) {
      toast.error('Stripe checkout is still loading.')
      return
    }

    setSubmitting(true)
    setCardError('')
    setStatus({ type: 'loading', message: 'Creating your secure payment session...' })

    try {
      const paymentRes = await axiosInstance.post(`/payment/${selectedPlan._id}`)
      const paymentData = paymentRes.data?.data as {
        clientSecret: string
        amount: number
      }

      setStatus({ type: 'loading', message: 'Confirming card payment with Stripe...' })

      const { error, paymentIntent } = await stripeRef.current.confirmCardPayment(
        paymentData.clientSecret,
        {
          payment_method: {
            card: cardElementRef.current,
            billing_details: {
              name: cardholderName || undefined,
              address: { country },
            },
          },
        },
      )

      if (error) {
        throw new Error(error.message || 'Payment confirmation failed.')
      }

      if (paymentIntent?.status !== 'succeeded') {
        throw new Error(`Payment status returned as ${paymentIntent?.status || 'unknown'}.`)
      }

      setStatus({
        type: 'success',
        message: `Payment successful. Reference: ${paymentIntent.id}`,
      })

      const synced = await syncUserAfterPayment()

      if (synced) {
        toast.success('Plan activated successfully.')
        router.push('/profile')
        return
      }

      toast.success('Payment completed. Your plan should appear shortly.')
      router.push('/dashboard/overview')
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
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

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[28px] border border-[#D8E4EC] bg-[linear-gradient(180deg,#F7FBFD_0%,#FFFFFF_100%)] p-6 shadow-[0_24px_60px_rgba(6,61,91,0.08)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#E8F4EA] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#4D7C0F]">
                <Sparkles className="size-3.5" />
                School Subscription
              </span>
              <h1 className="mt-4 text-[30px] font-bold leading-[1.15] text-[#0F172A] sm:text-[38px]">
                Activate your iLearnReady school workspace
              </h1>
              <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[#475569]">
                Choose the plan that fits your school calendar, then complete checkout to unlock your dashboard,
                learner progress tools, live classes, and reporting access.
              </p>
            </div>

            <div className="min-w-[220px] rounded-2xl bg-[#063D5B] px-5 py-4 text-white shadow-[0_18px_45px_rgba(6,61,91,0.2)]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/70">
                Payment notes
              </p>
              <ul className="mt-3 space-y-3">
                {paymentSteps.map(step => (
                  <li key={step} className="flex items-start gap-2 text-[14px] leading-5">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#A3E635]" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[20px] font-bold text-[#0F172A]">Available plans</h2>
              {!loadingPlans && plans.length > 0 ? (
                <p className="text-[14px] font-medium text-[#64748B]">
                  {plans.length} option{plans.length > 1 ? 's' : ''} ready for checkout
                </p>
              ) : null}
            </div>

            {loadingPlans ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[0, 1].map(index => (
                  <div
                    key={index}
                    className="h-[250px] animate-pulse rounded-[24px] border border-[#E2E8F0] bg-[#F8FAFC]"
                  />
                ))}
              </div>
            ) : plans.length ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {plans.map(plan => {
                  const isSelected = plan._id === selectedPlanId

                  return (
                    <button
                      key={plan._id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan._id)}
                      className={`rounded-[24px] border p-6 text-left transition ${
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
                            {plan.months}-month access
                          </p>
                          <h3 className="mt-3 text-[28px] font-bold">{plan.name}</h3>
                        </div>
                        {isSelected ? (
                          <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold">
                            Selected
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-6 flex items-end gap-2">
                        <span className="text-[34px] font-bold">{formatCurrency(plan.price)}</span>
                        <span className={isSelected ? 'pb-1 text-white/70' : 'pb-1 text-[#64748B]'}>
                          one-time payment
                        </span>
                      </div>

                      <ul className="mt-6 space-y-3">
                        {(plan.features?.length ? plan.features : ['Dashboard access', 'Student progress tracking']).map(
                          feature => (
                            <li key={feature} className="flex items-start gap-3 text-[15px] leading-6">
                              <CheckCircle2
                                className={`mt-0.5 size-5 shrink-0 ${
                                  isSelected ? 'text-[#A3E635]' : 'text-[#14B88A]'
                                }`}
                              />
                              <span>{feature}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-[#CBD5E1] bg-white px-6 py-10 text-center">
                <p className="text-[18px] font-semibold text-[#0F172A]">No active plans available right now</p>
                <p className="mt-2 text-[15px] text-[#64748B]">
                  Please add an active subscription package from the admin panel and try again.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-[28px] border border-[#D8E4EC] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EEF6FB] text-[#063D5B]">
              <CreditCard className="size-6" />
            </div>
            <div>
              <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-[#6A9D23]">
                Secure Checkout
              </p>
              <h2 className="text-[24px] font-bold text-[#0F172A]">Complete your plan purchase</h2>
            </div>
          </div>

          <div className="mt-8 rounded-[24px] bg-[#F8FAFC] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[14px] font-medium text-[#64748B]">Selected plan</p>
                <p className="mt-1 text-[24px] font-bold text-[#0F172A]">
                  {selectedPlan?.name || 'Choose a plan'}
                </p>
                <p className="mt-1 text-[14px] text-[#64748B]">
                  {selectedPlan ? `${selectedPlan.months} months of school access` : 'Your plan summary will appear here'}
                </p>
              </div>
              <p className="text-[28px] font-bold text-[#063D5B]">
                {formatCurrency(selectedPlan?.price || 0)}
              </p>
            </div>

            <div className="mt-5 border-t border-[#E2E8F0] pt-5">
              <div className="flex items-center justify-between text-[14px] text-[#64748B]">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedPlan?.price || 0)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[16px] font-bold text-[#0F172A]">
                <span>Total due today</span>
                <span>{formatCurrency(selectedPlan?.price || 0)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <div>
              <label className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                Name on card
              </label>
              <input
                type="text"
                value={cardholderName}
                onChange={event => setCardholderName(event.target.value)}
                placeholder="School finance contact"
                className="mt-2 h-12 w-full rounded-xl border border-[#CBD5E1] px-4 text-[15px] text-[#0F172A] outline-none transition focus:border-[#063D5B]"
              />
            </div>

            <div>
              <label className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                Country
              </label>
              <select
                value={country}
                onChange={event => setCountry(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-[#CBD5E1] bg-white px-4 text-[15px] text-[#0F172A] outline-none transition focus:border-[#063D5B]"
              >
                {countryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                  Card information
                </label>
                <span className="text-[12px] font-medium text-[#64748B]">Test card: 4242 4242 4242 4242</span>
              </div>
              <div className="mt-2 rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 focus-within:border-[#063D5B]">
                <div id={cardContainerId} />
              </div>
              {cardError ? <p className="mt-2 text-[13px] text-[#DC2626]">{cardError}</p> : null}
            </div>
          </div>

          {status.type !== 'idle' ? (
            <div
              className={`mt-6 rounded-2xl border px-4 py-3 text-[14px] ${
                status.type === 'success'
                  ? 'border-[#86EFAC] bg-[#F0FDF4] text-[#166534]'
                  : status.type === 'error'
                    ? 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'
                    : 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
              }`}
            >
              {status.message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handlePayment}
            disabled={!selectedPlan || !stripeReady || submitting || loadingPlans}
            className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#063D5B] text-[16px] font-semibold text-white transition hover:bg-[#0A557D] disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitting
              ? 'Processing payment...'
              : selectedPlan
                ? `Pay ${formatCurrency(selectedPlan.price)}`
                : 'Select a plan to continue'}
          </button>

          <p className="mt-4 text-center text-[13px] leading-6 text-[#64748B]">
            Payments are confirmed through Stripe. Your school subscription updates automatically once the payment
            webhook is received.
          </p>
        </aside>
      </div>
    </AuthShell>
  )
}
