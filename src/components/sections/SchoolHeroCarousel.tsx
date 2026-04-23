'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type SchoolHeroSlide = {
  imageSrc: string
  imagePosition?: string
  heading: string
  subtext: string
  buttonLabel: string
  href: string
}

const slides: SchoolHeroSlide[] = [
  {
    imageSrc: '/images/cover-image2.png',
    imagePosition: 'center top',
    heading: 'Classroom delivery, now simplified',
    subtext:
      'Deliver structured lessons with clear, consistent, and easy to follow learning pathways across all subjects.',
    buttonLabel: 'Request Demo',
    href: '/contact-us',
  },
  {
    imageSrc: '/images/growth.png',
    imagePosition: 'center 42%',
    heading: 'Driving enrollment and school growth:',
    subtext:
      'A differentiated, technology enabled learning experience helps increase enrollment and strengthen your school’s competitive position.',
    buttonLabel: 'Learn More',
    href: '/about-us',
  },
  {
    imageSrc: '/images/school-banner3.png',
    imagePosition: 'center 35%',
    heading: 'Improving student outcomes:',
    subtext:
      'Provide students with engaging, structured learning that supports stronger performance and long term academic success.',
    buttonLabel: 'Learn More',
    href: '/about-us',
  },
]

export default function SchoolHeroCarousel() {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActiveSlide(current => (current + 1) % slides.length)
    }, 4500)

    return () => window.clearTimeout(timeout)
  }, [activeSlide])

  return (
    <section className="pt-[182px]">
      <div className="relative h-[640px] overflow-hidden rounded-br-[120px] bg-[var(--color-primary)]">
        {slides.map((slide, index) => (
          <div
            key={slide.imageSrc}
            className={cn(
              'absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out',
              activeSlide === index ? 'opacity-100' : 'opacity-0',
            )}
            style={{
              backgroundImage: `url('${slide.imageSrc}')`,
              backgroundPosition: slide.imagePosition ?? 'center center',
            }}
            aria-hidden={activeSlide !== index}
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,47,79,0.9)_0%,rgba(8,47,79,0.72)_45%,rgba(8,47,79,0.25)_100%)]" />
            <div className="relative z-10 flex h-full items-center">
              <div className="mx-auto w-full max-w-[1180px] px-6 sm:px-10">
                <div className="mb-7 h-3 w-[120px] bg-[#FFB400]" />
                <h1 className="max-w-[560px] text-[42px] font-bold leading-[52px] tracking-[0] text-white md:text-[48px] md:leading-[60px]">
                  {slide.heading}
                </h1>
                <p className="mt-5 max-w-[710px] text-[24px] font-semibold leading-[36px] tracking-[0] text-white/75">
                  {slide.subtext}
                </p>
                <Link
                  href={slide.href}
                  className="mt-8 inline-flex items-center gap-5 rounded-md border border-white bg-transparent px-7 py-4 text-center [font-family:var(--font-manrope)] text-[20px] font-bold leading-[27px] tracking-[0] text-white transition hover:bg-white hover:text-[var(--color-primary)]"
                >
                  {slide.buttonLabel}
                  <ChevronRight
                    className="size-5 stroke-[3]"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </div>
        ))}

        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
          {slides.map((slide, index) => (
            <button
              key={slide.imageSrc}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => setActiveSlide(index)}
              className={cn(
                'size-2.5 rounded-full transition',
                activeSlide === index
                  ? 'bg-white'
                  : 'bg-white/50 hover:bg-white/80',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
