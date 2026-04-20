'use client'

import { useEffect, useState } from 'react'
import CarouselSlide, {
  type CarouselSlideProps,
} from '@/components/ui/CarouselSlide'
import { cn } from '@/lib/utils'

const slides: CarouselSlideProps[] = [
  {
    imageSrc: '/images/cover-image1.png',
    imagePosition: 'center 34%',
    heading: 'A Smarter Way to Deliver Education',
    subtext:
      'We empower schools to deliver structured, curriculum aligned education through a modern digital learning platform anytime, anywhere',
  },
  {
    imageSrc: '/images/cover-image2.png',
    imagePosition: 'center 30%',
    heading: 'A Smarter Way to Deliver Education',
    subtext:
      'We empower schools to deliver structured, curriculum aligned education through a modern digital learning platform anytime, anywhere',
  },
]

export default function HeroCarousel() {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide(current => (current + 1) % slides.length)
    }, 4000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <section className="pt-[182px]">
      <div className="relative h-[640px] w-full overflow-hidden rounded-br-[120px] bg-[var(--color-primary)]">
        {slides.map((slide, index) => (
          <div
            key={slide.imageSrc}
            className={cn(
              'absolute inset-0 transition-opacity duration-500 ease-in-out',
              activeSlide === index ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden={activeSlide !== index}
          >
            <CarouselSlide {...slide} />
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
