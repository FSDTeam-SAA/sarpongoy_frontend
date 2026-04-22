'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthShell from '@/components/auth/AuthShell'
import { axiosInstance } from '@/lib/axios'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      await axiosInstance.post('/auth/forgot-password', { email })
      // Store email for use in subsequent steps
      sessionStorage.setItem('reset_email', email)
      toast.success('OTP sent to your email!')
      router.push('/verify-email')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Failed to send OTP. Check your email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-7 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:px-8">
        <h1 className="text-[32px] font-bold leading-[40px] tracking-[0] text-[var(--color-primary)]">
          Forgot Password
        </h1>
        <p className="mt-3 text-[17px] font-normal leading-[26px] tracking-[0] text-[#6B7280]">
          Enter your email to recover your password
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="text-[15px] font-normal leading-none">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="hello@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="mt-2 h-12 w-full rounded-sm border border-[#8D8D8D] px-4 text-[15px] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-sm bg-[var(--color-primary)] text-[15px] font-bold leading-none text-white transition hover:bg-[#063D5B] disabled:opacity-60"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      </div>
    </AuthShell>
  )
}
