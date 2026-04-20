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
        <div className="mx-auto w-full max-w-[1180px] px-6 sm:px-10">
          <div className="mb-7 h-2.5 w-[108px] bg-[#FFC400]" />
          <h1 className="max-w-[560px] text-[42px] font-bold leading-[52px] tracking-[0] text-white md:text-[48px] md:leading-[60px]">
            {heading}
          </h1>
          <p className="mt-5 max-w-[710px] text-[24px] font-semibold leading-[36px] tracking-[0] text-white/75">
            {subtext}
          </p>
          <Link
            href="/about-us"
            className="mt-8 inline-flex items-center gap-5 rounded-md border border-white bg-transparent px-7 py-4 text-center [font-family:var(--font-manrope)] text-[20px] font-bold leading-[27px] tracking-[0] text-white transition hover:bg-white hover:text-[var(--color-primary)]"
          >
            Learn More
            <ChevronRight className="size-5 stroke-[3]" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
