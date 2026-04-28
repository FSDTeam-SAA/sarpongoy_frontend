import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface CarouselSlideProps {
  imageSrc: string;
  imagePosition?: string;
  heading: string;
  subtext: string;
}

export default function CarouselSlide({
  imageSrc,
  imagePosition = "center 28%",
  heading,
  subtext,
}: CarouselSlideProps) {
  return (
    <div
      className="absolute inset-0 bg-cover"
      style={{
        backgroundImage: `url(${imageSrc})`,
        backgroundPosition: imagePosition,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(15, 40, 80, 0.85) 0%, rgba(15, 40, 80, 0.55) 60%, rgba(15, 40, 80, 0.2) 100%)",
        }}
      />
      <div className="relative z-10 flex h-full items-center">
        <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10">
          <div className="mb-5 h-2.5 w-[88px] bg-[#FFB400] sm:mb-7 sm:h-3 sm:w-[120px]" />
          <h1 className="max-w-[560px] text-[26px] font-bold leading-[34px] tracking-[0] text-white sm:text-[34px] sm:leading-[42px] md:text-[48px] md:leading-[60px]">
            {heading}
          </h1>
          <p className="mt-4 max-w-[710px] text-[16px] font-semibold leading-[26px] tracking-[0] text-white/80 sm:mt-5 sm:text-[20px] sm:leading-[30px] md:text-[24px] md:leading-[36px]">
            {subtext}
          </p>
          <Link
            href="/about-us"
            className="mt-6 inline-flex items-center gap-3 rounded-md border border-white bg-transparent px-5 py-3 text-center [font-family:var(--font-manrope)] text-[15px] font-bold leading-5 tracking-[0] text-white transition hover:bg-white hover:text-[var(--color-primary)] sm:mt-8 sm:gap-5 sm:px-7 sm:py-4 sm:text-[18px] sm:leading-[24px] md:text-[20px] md:leading-[27px]"
          >
            Learn More
            <ChevronRight className="size-4 stroke-[3] sm:size-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
