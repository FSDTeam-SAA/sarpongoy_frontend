import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function DemoCallToAction() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-full text-center">
        <div className="mx-auto mb-4 h-3 w-[118px] bg-[var(--color-accent)]" />
        <h2 className="[font-family:var(--font-manrope)] text-[24px] font-bold leading-[32px] tracking-[0] text-[var(--color-text-dark)] sm:text-[30px] sm:leading-[40px] md:text-[36px] md:leading-[52px]">
          See how iLearnReady can deliver similar results for your school.
        </h2>
        <Link
          href="/contact-us"
          className="mt-8 inline-flex items-center gap-3 rounded-md border border-[var(--color-link-inactive)] px-6 py-3 text-base font-semibold text-[var(--color-link-inactive)] transition hover:bg-[var(--color-link-inactive)] hover:text-white"
        >
          Request a Demo
          <ChevronRight className="size-5 stroke-[3]" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
