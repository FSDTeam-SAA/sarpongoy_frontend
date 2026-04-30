import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'

const stats = [
  { value: '15-30%', label: 'higher assessment scores' },
  { value: '2x faster', label: 'curriculum and topic mastery' },
  { value: '25-50%', label: 'higher lesson completion' },
]

export default function CompetitiveEdge() {
  return (
    <section className="bg-white px-3 py-8 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="[font-family:var(--font-manrope)] text-[28px] font-semibold leading-[36px] tracking-[0] text-[var(--color-text-dark)] sm:text-[38px] sm:leading-[48px] md:text-[56px] md:leading-[76.8px]">
            Gaining a Competitive Edge
          </h2>
          <p className="mt-4 [font-family:var(--font-manrope)] text-[16px] font-medium leading-[26px] tracking-[0] text-[#4A5565] sm:text-[20px] sm:leading-[30px] md:text-[24px] md:leading-[34px]">
            We help grow enrollment through modern learning
          </p>
        </div>

        <div className="mt-8 grid items-center gap-6 sm:mt-12 sm:gap-10 lg:grid-cols-[639px_1fr]">
          <div className="mx-auto h-auto w-full max-w-[639px] overflow-hidden rounded-tl-[32px] rounded-br-[32px]">
            <Image
              src="/images/competitive-image.png"
              alt="Students learning with iLearnReady"
              width={639}
              height={410}
              className="aspect-[639/410] w-full object-cover opacity-100"
            />
          </div>

          <div className="mx-auto max-w-2xl lg:mx-0">
            <p className="text-[16px] font-normal leading-[28px] tracking-[0] text-[var(--color-text-muted)] sm:text-[20px] sm:leading-[30px] md:text-[24px] md:leading-[34px]">
              iLearnReady is a digital learning platform that combines
              structured content, intuitive technology, and practical classroom
              integration to support consistent, high-quality education.
            </p>
            <Link
              href="/about-us"
              className="mt-5 inline-flex items-center gap-2.5 rounded-md border border-[var(--color-link-inactive)] px-4 py-2 text-sm font-semibold text-[var(--color-link-inactive)] transition hover:bg-[var(--color-link-inactive)] hover:text-white sm:mt-7 sm:gap-3 sm:px-6 sm:py-3 sm:text-base"
            >
              Learn More
              <ChevronRight className="size-5 stroke-[3]" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[22px] bg-[#F8F8F7] px-2 py-3 sm:mt-14 sm:rounded-[48px] sm:px-6 sm:py-8 lg:rounded-[64px] lg:px-8">
          <div className="grid md:grid-cols-3">
            {stats.map((stat, index) => (
              <StatCard
                key={stat.value}
                {...stat}
                className={cn(
                  index > 0 ? 'border-t border-[#C9C9C9]' : undefined,
                  index > 0 ? 'md:border-t-0 md:border-l md:border-[#C9C9C9]' : undefined
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
