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
    <main className="min-h-screen bg-white px-4 py-16 text-[var(--color-text-dark)]">
      <div className={`mx-auto flex min-h-[calc(100vh-8rem)] w-full ${maxWidth} flex-col justify-center`}>
        {children}
      </div>
    </main>
  )
}
