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
      <div className="relative h-[640px] w-full overflow-hidden rounded-br-[120px] bg-[var(--color-primary)]">
        <CarouselSlide {...bannerSlide} />
      </div>
    </section>
  )
}
