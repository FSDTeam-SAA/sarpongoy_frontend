import Image from 'next/image'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'

const focusItems = [
  'Ghana Focus',
  'School Onboarding',
  'Platform Deployment',
  'Ongoing Support',
  'General Operations',
]

const impactItems = [
  {
    icon: '/images/icon1.png',
    title: '15-30%',
    text: 'higher assessment scores',
  },
  {
    icon: '/images/icon2.png',
    title: '2x faster',
    text: 'topic mastery',
  },
  {
    icon: '/images/icon3.png',
    title: '25-50%',
    text: 'higher lesson completion',
  },
  {
    icon: '/images/icon4.png',
    title: 'Early Gap Detection',
    text: 'identify weak areas early',
  },
  {
    icon: '/images/icon5.png',
    title: 'Stronger School Appeal',
    text: 'drive enrollment growth',
  },
  {
    icon: '/images/icon6.png',
    title: 'More value for parents',
    text: 'visible, measurable learning',
  },
]

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-white text-[var(--color-text-dark)]">
      <Navbar hideAnnouncement />

      <section className="pt-[126px]">
        <div
          className="relative h-[540px] bg-cover"
          style={{
            backgroundImage: "url('/images/about-us-banner.png')",
            backgroundPosition: 'center 62%',
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,47,79,0.72)_0%,rgba(8,47,79,0.35)_45%,rgba(8,47,79,0.08)_100%)]" />
        </div>

        <div className="relative z-10 mx-auto -mt-[108px] max-w-[960px] rounded-tr-[22px] bg-white px-8 py-10 shadow-[0_10px_30px_rgba(27,47,91,0.12)] sm:px-12">
          <div className="grid gap-9 md:grid-cols-[1fr_240px]">
            <div>
              <h1 className="text-[34px] font-bold leading-[44px] tracking-[0] text-[var(--color-text-dark)]">
                About Us
              </h1>
              <p className="mt-6 text-[16px] font-normal leading-[26px] tracking-[0] text-[#333333]">
                iLearnReady operations in Ghana are supported by ETIA Ghana
                Operations Ltd, a subsidiary of the Education Technology
                Institute of America (ETIA), a Delaware-based organization
                focused on developing scalable education solutions.
              </p>
              <p className="mt-5 text-[16px] font-normal leading-[26px] tracking-[0] text-[#333333]">
                iLearnReady is one of ETIA&apos;s flagship platforms, designed
                to deliver structured, high-quality learning experiences across
                emerging markets.
              </p>
            </div>

            <div className="border-l border-[#E0E0E0] pl-6">
              <div className="flex flex-col gap-9 text-[16px] font-semibold leading-none tracking-[0] text-[#5F6E5E]">
                {focusItems.map(item => (
                  <span
                    key={item}
                    className={
                      item === 'Ghana Focus'
                        ? 'text-[16px] font-extrabold text-[var(--color-text-dark)]'
                        : undefined
                    }
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-[860px] text-center">
          <div className="mx-auto mb-5 h-2.5 w-[82px] bg-[var(--color-accent)]" />
          <h2 className="text-[30px] font-semibold leading-[40px] tracking-[0] text-[var(--color-text-dark)]">
            Foundational to Modern Education Delivery
          </h2>
          <p className="mx-auto mt-6 max-w-[720px] text-[18px] font-normal leading-[28px] tracking-[0] text-[#4A5565]">
            We play an essential role in supporting schools by providing
            structured, technology enabled learning systems that improve
            consistency and academic outcomes. As education continues to evolve,
            access to reliable, high quality learning tools is critical to
            student success and long term development.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-[1180px] rounded-lg border border-[#D8D8D8] bg-white px-5 pb-8 pt-3 shadow-[0_4px_14px_rgba(27,47,91,0.08)]">
          <h2 className="text-center text-[38px] font-extrabold leading-[48px] tracking-[0] text-[var(--color-text-dark)]">
            Our impact at a glance
          </h2>

          <div className="mt-12 rounded-[40px] bg-[#F8F8F7] px-6 py-12">
            <div className="grid gap-y-10 md:grid-cols-3">
              {impactItems.map((item, index) => {
                return (
                  <div
                    key={item.title}
                    className={[
                      'flex min-h-[154px] flex-col items-center justify-center text-center',
                      index % 3 !== 0 ? 'md:border-l md:border-[#D4D4D4]' : '',
                    ].join(' ')}
                  >
                    <Image
                      src={item.icon}
                      alt={item.title}
                      width={64}
                      height={64}
                      className="h-16 w-16 object-contain"
                    />
                    <h3 className="mt-5 text-[26px] font-extrabold leading-[32px] tracking-[0] text-[var(--color-primary)]">
                      {item.title}
                    </h3>
                    <p className="mt-4 max-w-[220px] text-center text-[17px] font-light leading-[27px] tracking-[0] text-[#111111]">
                      {item.text}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-bg-page)] px-4 py-20">
        <div className="mx-auto max-w-[1060px]">
          <div className="text-center">
            <div className="mx-auto mb-5 h-2.5 w-[82px] bg-[var(--color-accent)]" />
            <h2 className="text-[36px] font-bold leading-[48px] tracking-[0] text-[var(--color-text-dark)]">
              How we make a difference
            </h2>
          </div>

          <div className="mt-9 grid items-center gap-12 lg:grid-cols-[430px_1fr]">
            <Image
              src="/images/growth.png"
              alt="Students learning together"
              width={430}
              height={260}
              className="aspect-[430/260] w-full rounded-md object-cover"
            />
            <div>
              <h3 className="text-[26px] font-bold leading-[36px] tracking-[0] text-[var(--color-primary)]">
                Driving School Growth and Enrollment
              </h3>
              <p className="mt-4 text-[18px] font-normal leading-[30px] tracking-[0] text-[#222222]">
                We support schools in strengthening their market position by
                providing a modern, technology enabled learning experience that
                differentiates them from competitors. In environments where
                parents and students are increasingly seeking quality and
                innovation, access to structured digital learning and dedicated
                student devices enhances a school&apos;s appeal. By improving
                academic delivery and overall learning experience, iLearnReady
                helps schools increase enrollment, retain students, and position
                themselves as forward thinking.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20">
        <div className="mx-auto grid max-w-[1060px] items-center gap-12 lg:grid-cols-[1fr_430px]">
          <div>
            <h2 className="text-[26px] font-bold leading-[36px] tracking-[0] text-[var(--color-primary)]">
              Delivering Measurable Academic Impact
            </h2>
            <p className="mt-5 text-[18px] font-normal leading-[30px] tracking-[0] text-[#222222]">
              We focus on outcomes that matter. iLearnReady is designed to
              improve assessment performance, accelerate topic mastery, and
              increase student engagement through structured and consistent
              learning delivery. By combining curriculum aligned content with
              intuitive technology, schools gain better visibility into student
              progress and can address learning gaps more effectively. These
              measurable improvements support stronger exam readiness and
              contribute to sustained academic success over time.
            </p>
          </div>
          <Image
            src="/images/delivering-imapact.png"
            alt="Learning progress dashboard"
            width={430}
            height={260}
            className="aspect-[430/260] w-full rounded-md object-cover object-left"
          />
        </div>
      </section>

      <section
        className="relative min-h-[580px] bg-cover px-4 py-24"
        style={{
          backgroundImage: "url('/images/partners.png')",
          backgroundPosition: 'center 8%',
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 mx-auto flex min-h-[228px] max-w-[1060px] items-center">
          <div className="max-w-[440px] rounded-md bg-white px-8 py-10 shadow-[0_10px_30px_rgba(27,47,91,0.12)]">
            <h2 className="text-[26px] font-bold leading-[36px] tracking-[0] text-[var(--color-primary)]">
              Flexible School Partnerships
            </h2>
            <p className="mt-6 text-[18px] font-normal leading-[30px] tracking-[0] text-[#222222]">
              iLearnReady partnerships are structured to align with each
              school&apos;s size and implementation needs.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
