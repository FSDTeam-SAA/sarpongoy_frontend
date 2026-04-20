import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import StatCard from "@/components/ui/StatCard";

const stats = [
  { value: "15-30%", label: "higher assessment scores" },
  { value: "2x faster", label: "topic mastery" },
  { value: "25-50%", label: "higher lesson completion" },
];

export default function CompetitiveEdge() {
  return (
    <section className="bg-white px-8 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="[font-family:var(--font-manrope)] text-[40px] font-semibold leading-[54px] tracking-[0] text-[var(--color-text-dark)] md:text-[56px] md:leading-[76.8px]">
            Gaining a Competitive Edge
          </h2>
          <p className="mt-4 [font-family:var(--font-manrope)] text-[22px] font-medium leading-[32px] tracking-[0] text-[#4A5565] md:text-[24px] md:leading-[34px]">
            We help grow enrollment through modern learning
          </p>
        </div>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[639px_1fr]">
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
            <p className="text-[22px] font-normal leading-[32px] tracking-[0] text-[var(--color-text-muted)] md:text-[24px] md:leading-[34px]">
              iLearnReady is a digital learning platform that combines
              structured content, intuitive technology, and practical classroom
              integration to support consistent, high-quality education.
            </p>
            <Link
              href="/about-us"
              className="mt-7 inline-flex items-center gap-3 rounded-md border border-[var(--color-link-inactive)] px-6 py-3 text-base font-semibold text-[var(--color-link-inactive)] transition hover:bg-[var(--color-link-inactive)] hover:text-white"
            >
              Learn More
              <ChevronRight className="size-5 stroke-[3]" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mt-14 overflow-hidden rounded-[64px] bg-[#F8F8F7] px-8 py-8">
          <div className="grid md:grid-cols-3">
            {stats.map((stat, index) => (
              <StatCard
                key={stat.value}
                {...stat}
                className={index > 0 ? "md:border-l md:border-[#C9C9C9]" : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
