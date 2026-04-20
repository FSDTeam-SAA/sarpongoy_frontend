import Link from 'next/link'
import AuthShell from '@/components/auth/AuthShell'

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <h1 className="text-[28px] font-bold leading-[36px] tracking-[0] text-[var(--color-primary)]">
        Forgot Password
      </h1>
      <p className="mt-2 text-[13px] font-normal leading-none tracking-[0] text-[#6B7280]">
        Enter your email to recover your password
      </p>

      <form className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="text-[13px] font-normal leading-none">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="hello@example.com"
            className="mt-2 h-10 w-full rounded-sm border border-[#8D8D8D] px-3 text-[13px] outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        <Link
          href="/verify-email"
          className="flex h-11 w-full items-center justify-center rounded-sm bg-[var(--color-primary)] text-[13px] font-bold leading-none text-white transition hover:bg-[#063D5B]"
        >
          Send OTP
        </Link>
      </form>
    </AuthShell>
  )
}
