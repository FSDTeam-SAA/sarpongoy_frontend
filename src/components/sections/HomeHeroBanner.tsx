import CarouselSlide from '@/components/ui/CarouselSlide'

const bannerSlide = {
  imageSrc: '/images/cover-image1.png',
  imagePosition: 'center 34%',
  heading: 'A Smarter Way to Deliver Education',
  subtext:
    'We empower schools to deliver structured, curriculum aligned education through a modern digital learning platform anytime, anywhere',
}

export default function HomeHeroBanner() {
  return (
    <section className="pt-[182px]">
      <div className="relative h-[540px] w-full overflow-hidden rounded-br-[72px] bg-[var(--color-primary)] sm:h-[600px] sm:rounded-br-[96px] lg:h-[640px] lg:rounded-br-[120px]">
        <CarouselSlide {...bannerSlide} />
      </div>
    </section>
  )
}
