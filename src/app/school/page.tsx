import Link from 'next/link'
import {
  BarChart3,
  ChevronRight,
  FileText,
  Layers,
  MonitorCheck,
} from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'

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

      <section className="pt-[182px]">
        <div
          className="relative h-[640px] overflow-hidden rounded-br-[120px] bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/cover-image2.png')",
            backgroundPosition: 'center top',
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,47,79,0.9)_0%,rgba(8,47,79,0.72)_45%,rgba(8,47,79,0.25)_100%)]" />
          <div className="relative z-10 flex h-full items-center">
            <div className="mx-auto w-full max-w-[1180px] px-6 sm:px-10">
              <div className="mb-7 h-2.5 w-[108px] bg-[#FFC400]" />
              <h1 className="max-w-[560px] text-[42px] font-bold leading-[52px] tracking-[0] text-white md:text-[48px] md:leading-[60px]">
                Classroom delivery,
                <br />
                now simplified
              </h1>
              <p className="mt-5 max-w-[710px] text-[24px] font-semibold leading-[36px] tracking-[0] text-white/75">
                Deliver structured lessons with clear, consistent, and easy to
                follow learning pathways across all subjects.
              </p>
              <Link
                href="/contact-us"
                className="mt-8 inline-flex items-center gap-5 rounded-md border border-white bg-transparent px-7 py-4 text-center [font-family:var(--font-manrope)] text-[20px] font-bold leading-[27px] tracking-[0] text-white transition hover:bg-white hover:text-[var(--color-primary)]"
              >
                Request Demo
                <ChevronRight
                  className="size-5 stroke-[3]"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-[1120px] text-center">
          <h2 className="max-w-[1110px] text-[36px] font-medium  leading-[38px] tracking-[0] text-[var(--color-text-dark)] md:text-[36px] md:leading-[44px]">
            iLearnReady partners with schools that are committed to improving
            academic outcomes and modernizing learning experience
          </h2>
          <p className="mx-auto text-[20px] font-normal mt-8 leading-[30px] tracking-[0] text-[#4A5565] md:text-[20px] md:leading-[34px]">
            iLearnReady enables schools to deliver structured, high quality
            education through a digital platform that integrates curriculum
            aligned content with classroom instruction. This approach improves
            consistency, strengthens academic outcomes, and supports a more
            effective learning environment for students.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl text-center">
          <h2 className="text-[32px] font-bold leading-[42px] tracking-[0] text-[var(--color-text-dark)]">
            Why Schools Love iLearnReady
          </h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {schoolBenefits.map(item => {
              const Icon = item.icon

              return (
                <div key={item.title} className="flex flex-col items-center">
                  <Icon className="size-20 stroke-[1.8] text-[#111111]" />
                  <p className="mt-5 max-w-[190px] text-center text-[18px] font-normal leading-[26px] tracking-[0] text-[#111111]">
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
          <h2 className="text-[34px] font-bold leading-[44px] tracking-[0] text-[var(--color-text-dark)]">
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
                <p className="text-[16px] font-normal leading-[26px] tracking-[0] text-[#111111]">
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
          <h2 className="text-[34px] font-semibold leading-[44px] tracking-[0] text-[var(--color-text-dark)]">
            Ideal Partners
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {partners.map(partner => (
              <div
                key={partner}
                className="mx-auto flex h-[142px] w-full max-w-[230px] items-center justify-center rounded-md bg-[#C94F20] px-6 text-center text-[22px] font-normal leading-[28px] tracking-[0] text-white"
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
