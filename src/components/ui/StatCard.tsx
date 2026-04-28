import { cn } from "@/lib/utils";

interface StatCardProps {
  value: string;
  label: string;
  color?: string;
  className?: string;
}

export default function StatCard({
  value,
  label,
  color = "#0B5280",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex min-h-[204px] flex-1 flex-col items-center justify-center bg-[#F8F8F7] px-6 py-4 text-center",
        className
      )}
    >
      <div
        className="text-[36px] font-extrabold leading-[44px] tracking-[0] sm:text-[44px] sm:leading-[52px] md:text-[54px] md:leading-[64px]"
        style={{ color }}
      >
        {value}
      </div>
      <p className="mt-5 max-w-[280px] text-center text-[17px] font-normal leading-[26px] tracking-[0] text-[#111111] sm:mt-6 sm:text-[22px] sm:leading-[30px] md:mt-7 md:text-[30px] md:leading-[37px]">
        {label}
      </p>
    </div>
  );
}
