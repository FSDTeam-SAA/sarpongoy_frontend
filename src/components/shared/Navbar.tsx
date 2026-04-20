'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'School', href: '/school' },
  { label: 'About Us', href: '/about-us' },
  { label: 'Contact Us', href: '/contact-us' },
]

interface NavbarProps {
  hideAnnouncement?: boolean
}

export default function Navbar({ hideAnnouncement = false }: NavbarProps) {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full shadow-sm">
      <nav className="h-[70px] bg-[var(--color-primary)]">
        <div className="flex h-full w-full items-center justify-between pr-5 sm:pr-8 lg:px-[78px]">
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map(link => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative flex h-full items-center px-4 py-5 text-xl leading-[1.5] tracking-[0] transition-colors',
                    isActive
                      ? 'bg-[#05314D] px-5 font-bold text-white'
                      : 'font-normal text-white hover:text-white/80',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          <Link
            href="/login"
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-normal text-white transition hover:bg-white hover:text-[var(--color-primary)]"
          >
            Sign in
          </Link>
        </div>
      </nav>

      <div
        className={cn(
          'h-14 overflow-hidden bg-[var(--color-bg-footer)] transition-all duration-500 ease-in-out',
          isScrolled
            ? 'max-h-0 -translate-y-3 opacity-0'
            : 'max-h-14 translate-y-0 opacity-100',
        )}
      >
        <div className="flex h-full w-full items-center px-5 sm:px-8 lg:px-[90px]">
          <Link
            href="/"
            aria-label="iLearnReady home"
            className="relative block h-12 w-[147.06382751464844px] shrink-0 overflow-hidden"
          >
            <Image
              src="/images/logo.png"
              alt="iLearnReady"
              width={227}
              height={152}
              priority
              className="absolute left-0 top-0 h-auto w-[227px] max-w-none"
              style={{ transform: 'translate(-45px, -52px)' }}
            />
          </Link>
        </div>
      </div>

      {!hideAnnouncement ? (
        <div
          className={cn(
            'flex w-full items-center justify-center overflow-hidden border-b border-white/10 bg-[#C55422] px-5 text-center text-sm font-normal leading-5 text-white transition-all duration-500 ease-in-out sm:text-base lg:justify-between lg:px-[180px]',
            isScrolled
              ? 'max-h-0 -translate-y-3 py-0 opacity-0'
              : 'max-h-14 translate-y-0 py-[18px] opacity-100',
          )}
        >
          <span className="mx-auto truncate text-[20px] font-light">
            Designed to improve exam readiness, strengthen classroom
            consistency, and elevate overall school performance
          </span>
        </div>
      ) : null}
    </header>
  )
}
