import Link from 'next/link'
import type { ReactNode } from 'react'

interface AuthShellProps {
  children: ReactNode
  maxWidth?: string
}

export default function AuthShell({
  children,
  maxWidth = 'max-w-[430px]',
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen bg-white px-4 py-16 text-[var(--color-text-dark)]">
      <Link
        href="/"
        className="absolute left-4 top-4 inline-flex items-center rounded-md border border-[#D1D5DB] bg-white px-4 py-2 text-[14px] font-semibold text-[#063D5B] transition hover:border-[#063D5B] hover:bg-[#F8FAFC]"
      >
        Go Home
      </Link>

      <div className={`mx-auto flex min-h-[calc(100vh-8rem)] w-full ${maxWidth} flex-col justify-center`}>
        {children}
      </div>
    </main>
  )
}
