import Link from 'next/link'

export default function DashboardOverviewPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 text-center text-[var(--color-text-dark)]">
      <div>
        <h1 className="text-[32px] font-bold leading-[42px] tracking-[0]">
          Dashboard
        </h1>
        <p className="mt-3 text-[16px] leading-[26px] text-[#4A5565]">
          Your school portal dashboard is ready.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-[var(--color-primary)] px-6 text-[14px] font-bold leading-none text-white"
        >
          Back Home
        </Link>
      </div>
    </main>
  )
}
