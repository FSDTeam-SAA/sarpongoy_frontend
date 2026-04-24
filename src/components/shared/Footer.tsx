import Image from 'next/image'
import Link from 'next/link'

const menuLinks = [
  { label: 'Home', href: '/' },
  { label: 'School', href: '/school' },
  { label: 'About Us', href: '/about-us' },
  { label: 'Contact Us', href: '/contact-us' },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#F4F7FB] px-8 py-12 text-[var(--color-text-dark)]">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              href="/"
              aria-label="iLearnReady home"
              className="relative mb-5 block h-14 w-[172px] shrink-0 overflow-hidden"
            >
              <Image
                src="/images/logo.png"
                alt="iLearnReady"
                width={227}
                height={152}
                className="absolute left-0 top-0 h-auto w-[227px] max-w-none"
                style={{ transform: 'translate(-32px, -48px)' }}
              />
            </Link>
            <p className="max-w-xs text-[14px] font-normal leading-none tracking-[0] text-[var(--color-text-muted)]">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
              learning support built for modern classrooms.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold">Menu</h2>
            <div className="flex flex-col gap-3 text-[16px] font-normal leading-none tracking-[0] text-[var(--color-text-muted)]">
              {menuLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-[var(--color-primary)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold">Support</h2>
            <div className="flex flex-col gap-3 text-[16px] font-normal leading-none tracking-[0] text-[var(--color-text-muted)]">
              <Link
                href="/contact-us"
                className="hover:text-[var(--color-primary)]"
              >
                Contact Us
              </Link>
              <p>Linienstrasse 120, Berlin</p>
              <a
                href="mailto:info@etiaghana.com"
                className="hover:text-[var(--color-primary)]"
              >
                info@etiaghana.com
              </a>
              <a
                href="tel:+233544444193"
                className="hover:text-[var(--color-primary)]"
              >
                +233 54 444 4193
              </a>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold">Newsletter</h2>
            <form className="flex flex-col gap-3">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email"
                className="rounded-md border border-[#aaa] bg-white px-3 py-2.5 text-[20px] font-normal leading-none tracking-[0] outline-none transition focus:border-[var(--color-primary)]"
              />
              <button
                type="submit"
                className="rounded-md border border-[var(--color-primary)] bg-white px-5 py-2.5 text-[20px] font-normal leading-none tracking-[0] text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 border-t border-[rgba(8,82,128,0.14)] pt-6 text-center text-[20px] font-normal leading-none tracking-[0] text-[var(--color-text-muted)]">
          © {currentYear} iLearnReady. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
