'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Clock3 } from 'lucide-react'
import AuthShell from '@/components/auth/AuthShell'
import { axiosInstance } from '@/lib/axios'
import { toast } from 'sonner'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [seconds, setSeconds] = useState(59)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const email = typeof window !== 'undefined' ? sessionStorage.getItem('reset_email') || '' : ''

  useEffect(() => {
    if (seconds <= 0) return
    const timer = setInterval(() => setSeconds(s => s - 1), 1000)
    return () => clearInterval(timer)
  }, [seconds])

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const updated = [...otp]
    updated[index] = value.slice(-1)
    setOtp(updated)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      e.preventDefault()
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpValue = otp.join('')
    if (otpValue.length < 6) {
      toast.error('Please enter the complete 6-digit OTP')
      return
    }

    if (!email) {
      toast.error('Session expired. Please restart forgot password.')
      router.push('/forgot-password')
      return
    }

    setLoading(true)
    try {
      await axiosInstance.post('/auth/verify', { email, otp: otpValue })
      toast.success('OTP verified!')
      router.push('/change-password')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email || seconds > 0) return
    setResending(true)
    try {
      await axiosInstance.post('/auth/forgot-password', { email })
      setSeconds(59)
      setOtp(Array(6).fill(''))
      toast.success('OTP resent!')
    } catch {
      toast.error('Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell>
      <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-7 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:px-8">
        <h1 className="text-[26px] font-bold leading-[34px] tracking-[0] text-[var(--color-primary)] sm:text-[32px] sm:leading-[40px]">
          Verify Email
        </h1>
        <p className="mt-3 text-[15px] font-normal leading-[24px] tracking-[0] text-[#6B7280] sm:text-[17px] sm:leading-[26px]">
          Enter OTP to verify your email address
        </p>
        {email && (
          <p className="mt-2 text-[14px] text-[#6B7280]">
            Code sent to: <span className="font-semibold text-[#4A5565]">{email}</span>
          </p>
        )}

        <form onSubmit={handleVerify}>
          <div className="mt-8 flex gap-2 sm:gap-4" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                className="size-10 rounded-sm border border-[#CACACA] text-center text-[20px] font-semibold outline-none focus:border-[var(--color-primary)] sm:size-12 sm:text-[24px]"
              />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between text-[14px] leading-none text-[#6B7280]">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-4" />
              00:{String(seconds).padStart(2, '0')}
            </span>
            <span>
              Didn&apos;t get a code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={seconds > 0 || resending}
                className="font-bold text-[var(--color-primary)] disabled:opacity-40"
              >
                {resending ? 'Sending...' : 'Resend'}
              </button>
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 flex h-12 w-full items-center justify-center rounded-sm bg-[var(--color-primary)] text-[15px] font-bold leading-none text-white transition hover:bg-[#063D5B] disabled:opacity-60"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    </AuthShell>
  )
}
