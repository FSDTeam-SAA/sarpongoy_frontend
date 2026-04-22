import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import AuthLogo from '@/components/auth/AuthLogo'
import AuthShell from '@/components/auth/AuthShell'

const features = ['Full Library Access', 'Live Classes', 'Progress Tracking']

export default function PurchasePlanPage() {
  return (
    <AuthShell maxWidth="max-w-[520px]">
      <AuthLogo />

      <h1 className="mt-8 text-center text-[28px] font-bold leading-[36px] tracking-[0] text-[#111111]">
        Purchase a plan to access your dashboard
      </h1>

      <div className="mx-auto mt-12 w-full max-w-[360px] rounded-lg border border-[#A7A5FF] bg-white px-9 py-8 shadow-[0_4px_14px_rgba(78,70,229,0.18)]">
        <div className="text-center">
          <h2 className="text-[26px] font-bold leading-[34px] tracking-[0]">
            Silver
          </h2>
          <p className="mt-3 text-[26px] font-bold leading-[34px] tracking-[0]">
            4 Months
          </p>
          <p className="mt-4 text-[40px] font-bold leading-none tracking-[0]">
            <span className="mr-3 text-[32px]">$</span>37
          </p>
        </div>

        <ul className="mt-10 space-y-5">
          {features.map(feature => (
            <li key={feature} className="flex items-center gap-4 text-[16px] leading-none text-[#4A5565]">
              <CheckCircle2 className="size-5 text-[#14B88A]" aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>

        <Link
          href="/dashboard/overview"
          className="mt-9 flex h-12 w-full items-center justify-center rounded-md bg-[#063D5B] text-[16px] font-normal leading-none text-white transition hover:bg-[var(--color-primary)]"
        >
          Continue
        </Link>
      </div>
    </AuthShell>
  )
}
