'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Building2,
  ChevronDown,
  GraduationCap,
  MapPin,
  Monitor,
  type LucideIcon,
} from 'lucide-react'
import TabButton from '@/components/ui/TabButton'
import { cn } from '@/lib/utils'

interface SchoolTab {
  id: string
  label: string
  icon: LucideIcon
  image: string
  description: string | null
  bullets: string[]
}

const tabs: SchoolTab[] = [
  {
    id: 'student',
    label: 'Student Experience',
    icon: GraduationCap,
    image: '/images/real-learning1.png',
    description: null,
    bullets: [
      'Easy-to-follow lessons',
      'Interactive assessments',
      'Clear academic progression',
    ],
  },
  {
    id: 'school',
    label: 'School Benefits',
    icon: Building2,
    image: '/images/real-learning2.png',
    description: null,
    bullets: [
      'Standardized curriculum delivery',
      'Improved academic consistency',
      'Scalable across classrooms',
    ],
  },
  {
    id: 'teacher',
    label: 'Teacher Fit',
    icon: Monitor,
    image: '/images/teacher-fit.png',
    description:
      'iLearnReady is designed to support teachers by providing structure and clarity, allowing them to focus on effective instruction and identify learning gaps early.',
    bullets: [],
  },
  {
    id: 'environment',
    label: 'Environment Fit',
    icon: MapPin,
    image: '/images/environment-fit.png',
    description:
      'iLearnReady adapts to any school environment, whether urban or rural, ensuring every student has access to quality education.',
    bullets: [],
  },
]

function TabContent({ tab }: { tab: SchoolTab }) {
  return (
    <div className="grid items-center gap-6 sm:gap-10 lg:grid-cols-[520px_minmax(0,639px)] lg:justify-between">
      <div>
        <h3 className="[font-family:var(--font-manrope)] text-[20px] font-bold leading-[28px] tracking-[0] text-[var(--color-text-dark)] sm:text-[30px] sm:leading-[40px] md:text-[36px] md:leading-[52px]">
          {tab.label}
        </h3>
        {tab.bullets.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-6 [font-family:var(--font-manrope)] text-[14px] font-normal leading-[24px] tracking-[0] text-[#222222] sm:mt-4 sm:text-[20px] sm:leading-[32px] md:text-[24px] md:leading-[40px]">
            {tab.bullets.map(bullet => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 max-w-[560px] [font-family:var(--font-manrope)] text-[14px] font-normal leading-[24px] tracking-[0] text-[#222222] sm:mt-4 sm:text-[20px] sm:leading-[32px] md:text-[24px] md:leading-[40px]">
            {tab.description}
          </p>
        )}
      </div>
      <div className="justify-self-center lg:justify-self-end">
        <Image
          key={tab.id}
          src={tab.image}
          alt={tab.label}
          width={639}
          height={410}
          className="aspect-[639/410] w-full max-w-[639px] rounded-tl-[32px] rounded-br-[32px] object-cover"
        />
      </div>
    </div>
  )
}

export default function BuiltForSchools() {
  const [activeTabId, setActiveTabId] = useState(tabs[0].id)
  // For mobile accordion — can have one open at a time
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(tabs[0].id)

  const activeTab = tabs.find(tab => tab.id === activeTabId) ?? tabs[0]

  const toggleAccordion = (id: string) => {
    setOpenAccordionId(prev => (prev === id ? null : id))
  }

  return (
    <section className="bg-[var(--color-bg-page)] px-4 py-14 sm:px-4 sm:py-16">
      <div className="mx-auto w-full max-w-[1560px]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-[14px] w-[118px] bg-[var(--color-accent)]" />
          <h2 className="mx-auto max-w-4xl text-center text-[24px] font-bold leading-[32px] tracking-[0] text-[var(--color-text-dark)] sm:text-[30px] sm:leading-[40px] md:text-[36px] md:leading-[48px]">
            Built for Schools. Designed for Real Learning
          </h2>
        </div>

        {/* ── Mobile accordion (hidden on md+) ── */}
        <div className="mt-8 flex flex-col gap-3 md:hidden">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isOpen = openAccordionId === tab.id
            return (
              <div key={tab.id} className="overflow-hidden rounded-xl border border-[#CACACA] bg-white">
                <button
                  type="button"
                  onClick={() => toggleAccordion(tab.id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-5 shrink-0 text-[var(--color-primary)]" />
                    <span className="text-[15px] font-semibold leading-none text-[var(--color-text-dark)]">
                      {tab.label}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'size-5 shrink-0 text-[var(--color-primary)] transition-transform duration-300',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'grid transition-all duration-300 ease-in-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="rounded-tr-[24px] rounded-bl-[24px] border-t border-[#CACACA] bg-[#F8F8F7] px-5 py-6">
                      <TabContent tab={tab} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Desktop tab layout (hidden below md) ── */}
        <div className="mt-[50px] hidden rounded-[24px] bg-white px-5 pb-[22px] pt-[41px] sm:px-[22px] md:block">
          <div className="grid gap-6 md:grid-cols-4 md:gap-10 lg:gap-[62px]" role="tablist">
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                label={tab.label}
                icon={tab.icon}
                isActive={activeTab.id === tab.id}
                onClick={() => setActiveTabId(tab.id)}
              />
            ))}
          </div>

          <div className="mx-auto mt-[45px] w-full max-w-[1441px] rounded-tr-[32px] rounded-bl-[32px] border border-[#CACACA] bg-[#F8F8F7] px-6 py-8 sm:px-[64px] sm:py-[58px]">
            <div className="grid min-h-[500px] items-center gap-10 lg:grid-cols-[520px_minmax(0,639px)] lg:justify-between">
              <div>
                <h3 className="[font-family:var(--font-manrope)] text-[24px] font-bold leading-[32px] tracking-[0] text-[var(--color-text-dark)] sm:text-[30px] sm:leading-[40px] md:text-[36px] md:leading-[52px]">
                  {activeTab.label}
                </h3>
                {activeTab.bullets.length > 0 ? (
                  <ul className="mt-4 list-disc space-y-2 pl-6 [font-family:var(--font-manrope)] text-[16px] font-normal leading-[28px] tracking-[0] text-[#222222] sm:text-[20px] sm:leading-[32px] md:text-[24px] md:leading-[40px]">
                    {activeTab.bullets.map(bullet => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 max-w-[560px] [font-family:var(--font-manrope)] text-[16px] font-normal leading-[28px] tracking-[0] text-[#222222] sm:text-[20px] sm:leading-[32px] md:text-[24px] md:leading-[40px]">
                    {activeTab.description}
                  </p>
                )}
              </div>
              <div className="justify-self-center lg:justify-self-end">
                <Image
                  key={activeTab.id}
                  src={activeTab.image}
                  alt={activeTab.label}
                  width={639}
                  height={410}
                  className="aspect-[639/410] w-full max-w-[639px] rounded-tl-[32px] rounded-br-[32px] object-cover opacity-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
