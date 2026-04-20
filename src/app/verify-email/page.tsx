import Link from 'next/link'
import { Clock3 } from 'lucide-react'
import AuthShell from '@/components/auth/AuthShell'

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <h1 className="text-[28px] font-bold leading-[36px] tracking-[0] text-[var(--color-primary)]">
        Verify Email
      </h1>
      <p className="mt-2 text-[13px] font-normal leading-none tracking-[0] text-[#6B7280]">
        Enter OTP to verify your email address
      </p>

      <div className="mt-8 flex gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <input
            key={index}
            type="text"
            maxLength={1}
            defaultValue={index < 3 ? '1' : ''}
            className="size-12 rounded-sm border border-[#CACACA] text-center text-[20px] font-semibold outline-none focus:border-[var(--color-primary)]"
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-[12px] leading-none text-[#6B7280]">
        <span className="inline-flex items-center gap-1">
          <Clock3 className="size-4" />
          00:59
        </span>
        <span>
          Didn&apos;t get a code?{' '}
          <button type="button" className="font-bold text-[var(--color-primary)]">
            Resend
          </button>
        </span>
      </div>

      <Link
        href="/change-password"
        className="mt-8 flex h-11 w-full items-center justify-center rounded-sm bg-[var(--color-primary)] text-[13px] font-bold leading-none text-white transition hover:bg-[#063D5B]"
      >
        Verify
      </Link>
    </AuthShell>
  )
}
