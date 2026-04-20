"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabButtonProps {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
}

export default function TabButton({
  label,
  icon: Icon,
  isActive,
  onClick,
}: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onClick}
      className="relative flex min-h-[110px] w-full cursor-pointer touch-manipulation items-start justify-center px-2 pb-5 text-center"
      role="tab"
      aria-selected={isActive}
    >
      <span className="flex flex-col items-center gap-4">
        <span
          className={cn(
            "flex size-[58px] items-center justify-center rounded-full transition-colors",
            isActive ? "bg-[#0B2F4F]" : "bg-[#D9D9D9]"
          )}
        >
          <Icon
            className={cn(
              "size-8 stroke-[1.6] transition-colors",
              isActive ? "text-white" : "text-[#111111]"
            )}
          />
        </span>
        <span
          className={cn(
            "text-[17px] leading-normal transition-colors",
            isActive
              ? "font-bold text-[var(--color-text-dark)]"
              : "font-semibold text-[#1685C7]"
          )}
        >
          {label}
        </span>
      </span>
      {isActive ? (
        <span className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-[var(--color-accent)]" />
      ) : null}
    </button>
  );
}
