import Link from 'next/link'
import { BarChart3, FileText, Layers, MonitorCheck } from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import SchoolHeroCarousel from '@/components/sections/SchoolHeroCarousel'
import SchoolPartnersSlider from '@/components/sections/SchoolPartnersSlider'

const schoolBenefits = [
  {
    icon: BarChart3,
    title: 'Dedicated Student Access',
  },
  {
    icon: FileText,
    title: 'NACCA Curriculum-Aligned Learning',
  },
  {
    icon: MonitorCheck,
    title: 'Reliable in Real-World Environments',
  },
  {
    icon: Layers,
    title: 'Structured Academic Delivery',
  },
]

const steps = [
  {
    number: '1',
    color: '#FFB400',
    title: 'Partner with iLearnReady:',
    text: 'Schools begin by engaging with our team to start onboarding.',
  },
  {
    number: '2',
    color: '#0B5280',
    title: 'Setup & Activation:',
    text: 'The platform is configured and deployed for classroom use.',
  },
  {
    number: '3',
    color: '#C55422',
    title: 'Student Access:',
    text: 'Students are onboarded in structured groups for a seamless experience.',
  },
  {
    number: '4',
    color: '#77B82A',
    title: 'Continuous Learning:',
    text: 'Lessons, assessments, and structured learning continue throughout the academic term.',
  },
]

const partners = [
  'Private basic and JHS schools',
  'Schools seeking structured curriculum delivery',
  'Institutions focused on academic performance',
]

export default function SchoolPage() {
  return (
    <main className="min-h-screen bg-white text-[var(--color-text-dark)]">
      <Navbar />
      <SchoolHeroCarousel />

      <section className="bg-white px-4 py-10 sm:py-20">
        <div className="mx-auto max-w-[1120px] text-center">
          <h2 className="max-w-[1110px] text-[18px] font-semibold leading-[26px] tracking-[0] text-[var(--color-text-dark)] sm:text-[30px] sm:leading-[38px] md:text-[36px] md:leading-[44px]">
            Designed to improve exam readiness, strengthen classroom
            consistency, and elevate overall school performance
          </h2>
          <p className="mx-auto mt-4 text-[15px] font-normal leading-[24px] tracking-[0] text-[#4A5565] sm:mt-8 sm:text-[18px] sm:leading-[30px] md:text-[20px] md:leading-[34px]">
            iLearnReady enables schools to deliver structured, high quality
            education through a digital platform that integrates curriculum
            aligned content with classroom instruction. This approach improves
            consistency, strengthens academic outcomes, and supports a more
            effective learning environment for students.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl text-center">
          <h2 className="text-[24px] font-bold leading-[32px] tracking-[0] text-[var(--color-text-dark)] sm:text-[28px] sm:leading-[38px] md:text-[32px] md:leading-[42px]">
            Why Schools Love iLearnReady
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 px-1 sm:mt-10 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-10 sm:px-0 lg:grid-cols-4">
            {schoolBenefits.map(item => {
              const Icon = item.icon

              return (
                <div key={item.title} className="flex flex-col items-center">
                  <Icon className="size-11 stroke-[1.9] text-[#0B5280] sm:size-14" />
                  <p className="mt-3 max-w-[146px] text-center text-[14px] font-extrabold leading-[19px] tracking-[0] text-[var(--color-text-dark)] sm:mt-4 sm:max-w-[190px] sm:text-[16px] sm:leading-[24px]">
                    {item.title}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section
        className="relative bg-cover bg-center px-4 py-20"
        style={{ backgroundImage: "url('/images/how-it-works.png')" }}
      >
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />
        <div className="relative z-10 mx-auto max-w-[940px] rounded-md bg-white px-6 py-10 shadow-[0_10px_30px_rgba(27,47,91,0.12)] sm:px-9">
          <h2 className="text-[24px] font-bold leading-[32px] tracking-[0] text-[var(--color-text-dark)] sm:text-[30px] sm:leading-[40px] md:text-[34px] md:leading-[44px]">
            How it Works
          </h2>
          <p className="mt-3 text-[16px] font-normal leading-[24px] tracking-[0] text-[#4A5565]">
            Simple for Schools. Powerful for Learning
          </p>

          <div className="mt-8 space-y-5">
            {steps.map(step => (
              <div key={step.number} className="flex gap-5">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold leading-none text-white"
                  style={{ backgroundColor: step.color }}
                >
                  {step.number}
                </span>
                <p className="text-[15px] font-normal leading-[24px] tracking-[0] text-[#111111] sm:text-[16px] sm:leading-[26px]">
                  <strong className="font-bold">{step.title}</strong>{' '}
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-7 max-w-[940px]">
          <Link
            href="/contact-us"
            className="inline-flex rounded-md bg-[#27A9E1] px-5 py-3 text-[16px] font-bold leading-none tracking-[0] text-white transition hover:bg-[var(--color-primary)]"
          >
            Get started
          </Link>
        </div>
      </section>

      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-[24px] font-semibold leading-[32px] tracking-[0] text-[var(--color-text-dark)] sm:text-[30px] sm:leading-[40px] md:text-[34px] md:leading-[44px]">
            Our Ideal Partners
          </h2>
          <div className="mt-10 md:hidden">
            <SchoolPartnersSlider partners={partners} />
          </div>
          <div className="mt-10 hidden gap-8 md:grid md:grid-cols-3">
            {partners.map(partner => (
              <div
                key={partner}
                className="mx-auto flex h-[170px] w-full max-w-[380px] items-center justify-center rounded-md bg-[#C94F20] px-8 text-center text-[18px] font-normal leading-[28px] tracking-[0] text-white sm:px-10 sm:text-[22px] sm:leading-[30px] md:text-[24px] md:leading-[32px]"
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
