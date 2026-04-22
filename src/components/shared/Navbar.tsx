'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getUser, logout } from '@/lib/auth-helpers'
import { ChevronRight, LogOut, ShieldCheck, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'School', href: '/school' },
  { label: 'About Us', href: '/about-us' },
  { label: 'Contact Us', href: '/contact-us' },
]

interface UserData {
  _id?: string
  email?: string
  role?: string
  subscription?: string
  profilePicture?: string
  schoolName?: string
  firstName?: string
  lastName?: string
}

interface NavbarProps {
  hideAnnouncement?: boolean
}

export default function Navbar({ hideAnnouncement = false }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const u = getUser<UserData>()
    setUser(u)
  }, [pathname])

  const handleProfileNav = () => {
    if (user?.subscription) {
      router.push('/profile')
    } else {
      router.push('/purchase-plan')
    }
  }

  const confirmLogout = () => {
    logout()
    setUser(null)
    setLogoutModalOpen(false)
    router.push('/')
  }

  // Get initials for avatar fallback
  const getInitials = () => {
    if (user?.firstName) return user.firstName[0].toUpperCase()
    if (user?.email) return user.email[0].toUpperCase()
    return 'U'
  }

  const userDisplayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.schoolName ||
    'School Account'

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full shadow-sm">
      <nav className="relative z-10 h-[70px] bg-[var(--color-primary)]">
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

          {/* Right: Sign In button OR avatar */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-white/30 transition hover:border-white focus:outline-none"
                aria-label="Profile menu"
              >
                {user.profilePicture ? (
                  <Image
                    src={user.profilePicture}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center bg-[var(--color-accent)] text-[15px] font-bold text-white">
                    {getInitials()}
                  </span>
                )}
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={12}
                className="z-[120] w-72 rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-[0_20px_45px_rgba(15,23,42,0.16)]"
              >
                <div className="rounded-xl bg-[#F8FAFC] px-4 py-3.5 text-left">
                  <p className="truncate text-[16px] font-bold text-[#0F172A]">
                    {userDisplayName}
                  </p>
                  <p className="mt-1 truncate text-[13px] font-medium text-[#64748B]">
                    {user.email || ''}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#063D5B] ring-1 ring-[#E2E8F0]">
                    <ShieldCheck className="size-3.5" />
                    {user.subscription ? 'Subscription Active' : 'Plan Required'}
                  </div>
                </div>

                <DropdownMenuItem
                  onClick={handleProfileNav}
                  className="mt-2 flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium text-[#334155] hover:bg-[#F8FAFC]"
                >
                  <User className="size-4" />
                  {user.subscription ? 'Profile & Settings' : 'Choose a Plan'}
                  <ChevronRight className="ml-auto size-4 text-[#94A3B8]" />
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setLogoutModalOpen(true)}
                  variant="destructive"
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium text-red-500 hover:bg-red-50 focus:bg-red-50"
                >
                  <LogOut className="size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-normal text-white transition hover:bg-white hover:text-[var(--color-primary)]"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
        <DialogContent className="max-w-[440px] rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]" showCloseButton={false}>
          <DialogHeader className="gap-0">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <LogOut className="size-6" />
            </div>
            <DialogTitle className="text-[24px] font-bold text-[#0F172A]">
              Logout from your account?
            </DialogTitle>
            <DialogDescription className="text-[15px] leading-6 text-[#64748B]">
              You are about to sign out from this device. You can log in again anytime with your school account credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-7 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setLogoutModalOpen(false)}
              className="h-11 rounded-xl border border-[#CBD5E1] bg-white px-5 text-[15px] font-semibold text-[#334155] transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmLogout}
              className="h-11 rounded-xl bg-[#B91C1C] px-5 text-[15px] font-semibold text-white transition hover:bg-[#991B1B]"
            >
              Yes, Logout
            </button>
          </div>
        </DialogContent>
      </Dialog>

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
