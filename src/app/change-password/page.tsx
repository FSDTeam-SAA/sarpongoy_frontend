import Link from 'next/link'
import { Eye } from 'lucide-react'
import AuthShell from '@/components/auth/AuthShell'

export default function ChangePasswordPage() {
  return (
    <AuthShell>
      <h1 className="text-[28px] font-bold leading-[36px] tracking-[0] text-[var(--color-primary)]">
        Change Password
      </h1>
      <p className="mt-2 text-[13px] font-normal leading-none tracking-[0] text-[#6B7280]">
        Enter your email to recover your password
      </p>

      <form className="mt-8 space-y-5">
        {['Create New Password', 'Confirm New Password'].map(label => (
          <div key={label}>
            <label className="text-[13px] font-normal leading-none">{label}</label>
            <div className="mt-2 flex h-10 items-center rounded-sm border border-[#8D8D8D] px-3 focus-within:border-[var(--color-primary)]">
              <input
                type="password"
                defaultValue="password"
                className="h-full min-w-0 flex-1 bg-transparent text-[13px] outline-none"
              />
              <Eye className="size-4 text-[#6B7280]" aria-hidden="true" />
            </div>
          </div>
        ))}

        <Link
          href="/login"
          className="flex h-11 w-full items-center justify-center rounded-sm bg-[var(--color-primary)] text-[13px] font-bold leading-none text-white transition hover:bg-[#063D5B]"
        >
          Change Password
        </Link>
      </form>
    </AuthShell>
  )
}
