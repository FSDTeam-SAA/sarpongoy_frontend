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
        className="text-[54px] font-extrabold leading-[64px] tracking-[0]"
        style={{ color }}
      >
        {value}
      </div>
      <p className="mt-7 max-w-[280px] text-center text-[24px] font-normal leading-[34px] tracking-[0] text-[#111111] md:text-[30px] md:leading-[37px]">
        {label}
      </p>
    </div>
  );
}
