'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import AuthLogo from '@/components/auth/AuthLogo'
import AuthShell from '@/components/auth/AuthShell'
import { axiosInstance } from '@/lib/axios'
import { getToken, getUser, setUser } from '@/lib/auth-helpers'
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

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

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
  'Plan access activates automatically after payment confirmation',
  'Use test card 4242 4242 4242 4242 for demo checkout',
]

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount || 0)


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
    const init = async () => {
      const token = getToken()

      if (!token) {
        router.replace('/login')
        return
      }

      // Check subscription from API — not localStorage (which can be stale)
      try {
        const res = await axiosInstance.get('/user/profile')
        const profile = res.data?.data as UserData
        // Update localStorage with fresh data
        const stored = getUser<UserData>()
        if (profile && stored) setUser({ ...stored, ...profile })
        if (profile?.subscription) {
          router.replace('/profile')
          return
        }
      } catch {
        // If API fails, fall through and show the plans page
      }

      setLoadingPlans(true)
      try {
        const res = await axiosInstance.get('/subscribe?limit=20&sortBy=months&sortOrder=asc')
        const activePlans = ((res.data?.data as SubscribePlan[]) || []).filter(
          plan => (plan.status || 'active') === 'active',
        )
        setPlans(activePlans)
        if (activePlans[0]) setSelectedPlanId(activePlans[0]._id)
      } catch {
        toast.error('Unable to load subscription plans right now.')
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
        message: `Payment successful! Activating your plan... Reference: ${paymentIntent.id}`,
      })

      setStatus({ type: 'loading', message: 'Finalising your subscription...' })

      // Update localStorage with fresh profile data now that payment succeeded
      try {
        const res = await axiosInstance.get('/user/profile')
        const profile = res.data?.data
        const stored = getUser<UserData>()
        if (profile && stored) setUser({ ...stored, ...profile })
      } catch {
        // Non-fatal — profile page will refetch anyway
      }

      toast.success('Plan activated! Redirecting to your profile...')
      router.push('/profile')
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
        {/* ─── LEFT: Plan Selection ─── */}
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
                      className={`rounded-[24px] border p-6 text-left transition ${isSelected
                        ? 'border-[#063D5B] bg-[#063D5B] text-white shadow-[0_24px_60px_rgba(6,61,91,0.2)]'
                        : 'border-[#D8E4EC] bg-white text-[#0F172A] hover:border-[#8AA9BD] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            className={`text-[13px] font-semibold uppercase tracking-[0.18em] ${isSelected ? 'text-[#BFE7FF]' : 'text-[#6A9D23]'
                              }`}
                          >
                            {plan.months}-month access
                          </p>
                          <h3 className="mt-3 text-[28px] font-bold">{plan.name}</h3>
                        </div>
                        {isSelected ? (
                          <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold">
                            Selected ✓
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
                                className={`mt-0.5 size-5 shrink-0 ${isSelected ? 'text-[#A3E635]' : 'text-[#14B88A]'
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

        {/* ─── RIGHT: Checkout ─── */}
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

          {/* Order Summary */}
          <div className="mt-8 rounded-[24px] bg-[#F8FAFC] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">Order Summary</p>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-[18px] font-bold text-[#0F172A]">
                  {selectedPlan?.name || 'Choose a plan'}
                </p>
                <p className="mt-1 text-[14px] text-[#64748B]">
                  {selectedPlan
                    ? `${selectedPlan.months} month${selectedPlan.months > 1 ? 's' : ''} of school access`
                    : 'Your plan summary will appear here'}
                </p>
              </div>
              <p className="text-[28px] font-bold text-[#063D5B]">
                {formatCurrency(selectedPlan?.price || 0)}
              </p>
            </div>

            <div className="mt-5 border-t border-[#E2E8F0] pt-4 space-y-2">
              <div className="flex items-center justify-between text-[14px] text-[#64748B]">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedPlan?.price || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-[14px] text-[#64748B]">
                <span>Tax</span>
                <span>Included</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] text-[16px] font-bold text-[#0F172A]">
                <span>Total due today</span>
                <span>{formatCurrency(selectedPlan?.price || 0)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            {/* Cardholder Name */}
            <div>
              <label className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                Name on card
              </label>
              <input
                type="text"
                value={cardholderName}
                onChange={event => setCardholderName(event.target.value)}
                placeholder="School finance contact"
                className="mt-2 h-12 w-full rounded-xl border border-[#CBD5E1] px-4 text-[15px] text-[#0F172A] outline-none transition focus:border-[#063D5B] focus:ring-2 focus:ring-[#063D5B]/10"
              />
            </div>

            {/* Country - shadcn Select */}
            <div>
              <label className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                Country
              </label>
              <Select value={country} onValueChange={(val) => { if (val) setCountry(val) }}>
                <SelectTrigger className="mt-2 h-12 w-full rounded-xl border border-[#CBD5E1] bg-white px-4 text-[15px] text-[#0F172A] outline-none transition focus:border-[#063D5B] focus:ring-2 focus:ring-[#063D5B]/10 focus:ring-offset-0">
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
                <label className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                  Card information
                </label>
                <span className="rounded-full bg-[#F0FDF4] px-2.5 py-1 text-[11px] font-semibold text-[#16A34A]">
                  Test: 4242 4242 4242 4242
                </span>
              </div>
              <div className="mt-2 rounded-xl border border-[#CBD5E1] bg-white px-4 py-3.5 transition focus-within:border-[#063D5B] focus-within:ring-2 focus-within:ring-[#063D5B]/10">
                <div id={cardContainerId} />
              </div>
              {cardError ? <p className="mt-2 text-[13px] text-[#DC2626]">{cardError}</p> : null}
            </div>
          </div>

          {/* Status Banner */}
          {status.type !== 'idle' ? (
            <div
              className={`mt-6 rounded-2xl border px-4 py-3.5 text-[14px] leading-6 ${status.type === 'success'
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
            disabled={!selectedPlan || !stripeReady || submitting || loadingPlans}
            className="mt-8 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#063D5B] text-[16px] font-semibold text-white transition hover:bg-[#0A557D] disabled:cursor-not-allowed disabled:bg-[#94A3B8] active:scale-[0.98]"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            {submitting
              ? 'Processing payment...'
              : selectedPlan
                ? `Pay ${formatCurrency(selectedPlan.price)} securely`
                : 'Select a plan to continue'}
          </button>

          <p className="mt-4 text-center text-[13px] leading-6 text-[#64748B]">
            🔒 Payments are confirmed through Stripe. Your school subscription updates automatically once the payment
            webhook is received.
          </p>
        </aside>
      </div>
    </AuthShell>
  )
}
