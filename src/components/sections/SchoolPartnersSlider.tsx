'use client'

import { useRef, useState } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

interface SchoolPartnersSliderProps {
  partners: string[]
}

export default function SchoolPartnersSlider({
  partners,
}: SchoolPartnersSliderProps) {
  const plugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }))
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) return
    const update = () => setCurrent(api.selectedScrollSnap())
    api.on('select', update)
    return () => { api.off('select', update) }
  }, [api])

  return (
    <div className="relative">
      <Carousel
        setApi={setApi}
        opts={{
          align: 'center',
          containScroll: 'trimSnaps',
          loop: true,
        }}
        plugins={[plugin.current]}
        className="w-full"
      >
        <CarouselContent>
          {partners.map(partner => (
            <CarouselItem key={partner} className="basis-full pl-0">
              <div className="overflow-hidden rounded-lg shadow-md">
                {/* Card header — colored band */}
                <div className="flex h-[140px] items-center justify-center bg-[#C94F20] px-6">
                  <p className="text-center text-[18px] font-bold leading-[26px] text-white">
                    {partner}
                  </p>
                </div>

              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Dot navigation */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {partners.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => api?.scrollTo(i)}
            className={cn(
              'rounded-full transition-all duration-300',
              current === i
                ? 'h-2.5 w-6 bg-[#C94F20]'
                : 'size-2.5 bg-[#C94F20]/30 hover:bg-[#C94F20]/60',
            )}
          />
        ))}
      </div>
    </div>
  )
}
