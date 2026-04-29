import { cn } from '@/lib/utils'

interface StatCardProps {
  value: string
  label: string
  color?: string
  className?: string
}

export default function StatCard({
  value,
  label,
  color = '#0B5280',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'flex min-h-[204px] flex-1 flex-col items-center justify-center bg-[#F8F8F7] px-4 py-4 text-center sm:px-6',
        className,
      )}
    >
      <div
        className="text-[28px] font-extrabold leading-[34px] tracking-[0] sm:text-[34px] sm:leading-[40px] md:text-[44px] md:leading-[52px]"
        style={{ color }}
      >
        {value}
      </div>
      <p className="mt-3 max-w-[260px] text-center text-[15px] font-normal leading-[24px] tracking-[0] text-[#111111] sm:mt-5 sm:text-[16px] sm:leading-[25px] md:mt-7 md:text-[18px] md:leading-[27px]">
        {label}
      </p>
    </div>
  )
}
