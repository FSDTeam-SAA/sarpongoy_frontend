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
    <footer className="bg-[#F4F7FB] px-4 py-12 text-[var(--color-text-dark)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* MAIN GRID */}
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">

          {/* LOGO */}
          <div className="col-span-2 lg:col-span-1">
            <Link
              href="/"
              aria-label="iLearnReady home"
              className="relative mb-5 block h-14 w-[172px] overflow-hidden"
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

            <p className="max-w-xs text-[14px] leading-6 text-[var(--color-text-muted)]">
              Designed for Forward-Thinking Schools. More Value for Parents.
            </p>
          </div>

          {/* MENU */}
          <div>
            <h2 className="mb-4 text-lg font-bold">Menu</h2>
            <div className="flex flex-col gap-3 text-[16px] text-[var(--color-text-muted)]">
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

          {/* SUPPORT */}
          <div>
            <h2 className="mb-4 text-lg font-bold">Support</h2>
            <div className="flex flex-col gap-3 text-[16px] text-[var(--color-text-muted)]">
              <Link href="/contact-us" className="hover:text-[var(--color-primary)]">
                Contact Us
              </Link>

              <a href="mailto:info@etiaghana.com" className="hover:text-[var(--color-primary)]">
                info@etiaghana.com
              </a>

              <a href="tel:+233544444193" className="hover:text-[var(--color-primary)]">
                +233 54 444 4193
              </a>

              <a href="tel:+233546622050" className="hover:text-[var(--color-primary)]">
                +233 54 662 2050
              </a>
            </div>
          </div>

          {/* NEWSLETTER */}
          <div className="col-span-2 lg:col-span-1">
            <h2 className="mb-4 text-lg font-bold">Newsletter</h2>

            <form className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="rounded-md border border-[#aaa] bg-white px-3 py-2.5 text-[15px] outline-none focus:border-[var(--color-primary)]"
              />

              <button
                type="submit"
                className="rounded-md border border-[var(--color-primary)] bg-white px-5 py-2.5 font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* BOTTOM */}
        <div className="mt-10 border-t border-[rgba(8,82,128,0.14)] pt-6 text-center text-[14px] text-[var(--color-text-muted)]">
          © {currentYear} iLearnReady. All rights reserved.
        </div>

      </div>
    </footer>
  )
}