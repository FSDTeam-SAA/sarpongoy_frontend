import Link from 'next/link'
import AuthLogo from '@/components/auth/AuthLogo'
import AuthShell from '@/components/auth/AuthShell'

export default function LoginPage() {
  return (
    <AuthShell>
      <AuthLogo />

      <div className="mt-8">
        <h1 className="text-center text-[24px] font-bold leading-[32px] tracking-[0]">
          iLearnReady School Portal
        </h1>
        <p className="mt-2 text-center text-[14px] font-normal leading-none tracking-[0] text-[#6B7280]">
          Partner schools can access their accounts below
        </p>

        <form className="mt-8 space-y-4">
          <div>
            <label className="text-[13px] font-bold leading-none tracking-[0]" htmlFor="email">
              School Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              className="mt-2 h-10 w-full rounded-sm border border-[#6E7D8C] px-3 text-[13px] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-[13px] font-bold leading-none tracking-[0]" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="mt-2 h-10 w-full rounded-sm border border-[#6E7D8C] px-3 text-[13px] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="flex items-center justify-between text-[12px] leading-none">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked
                className="size-4 accent-[var(--color-primary)]"
              />
              Remember Me
            </label>
            <Link href="/forgot-password" className="hover:text-[var(--color-primary)]">
              Forgot Password?
            </Link>
          </div>

          <Link
            href="/purchase-plan"
            className="flex h-11 w-full items-center justify-center rounded-sm bg-[#063D5B] text-[13px] font-bold leading-none text-white transition hover:bg-[var(--color-primary)]"
          >
            Login
          </Link>
        </form>

        <p className="mt-6 text-center text-[12px] leading-none">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-bold text-[#6A9D23] hover:underline">
            Sign Up Here
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
