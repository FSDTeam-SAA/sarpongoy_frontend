import { Mail, Phone } from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'

export default function ContactUsPage() {
  return (
    <main className="min-h-screen bg-white text-[var(--color-text-dark)]">
      <Navbar hideAnnouncement />

      <section className="pt-[126px]">
        <div
          className="relative h-[420px] bg-cover bg-center"
          style={{ backgroundImage: "url('/images/contact-image.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-white">
            <h1 className="text-[38px] font-bold leading-[48px] tracking-[0] md:text-[48px] md:leading-[60px]">
              Talk to Our Team, Get Clear Answers
            </h1>
            <p className="mt-3 text-[14px] font-normal leading-[22px] tracking-[0] text-white/80 md:text-[16px]">
              Whether you need a product demo, want to start a project, our team
              is here to guide you every step of the way.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-[1180px] rounded-[40px] border border-[#E5E5E5] bg-white px-6 py-12 sm:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-[420px_1fr]">
            <div>
              <h2 className="text-[32px] font-bold leading-[42px] tracking-[0] text-[var(--color-primary)]">
                Get in Touch
              </h2>
              <p className="mt-2 text-[13px] font-normal leading-[20px] tracking-[0] text-[#4A5565]">
                Our friendly team would love to hear from you.
              </p>

              <form className="mt-8 space-y-4">
                <div>
                  <label
                    htmlFor="school-name"
                    className="text-[13px] font-bold leading-none tracking-[0] text-[#111111]"
                  >
                    School Name
                  </label>
                  <input
                    id="school-name"
                    type="text"
                    placeholder="Name Here"
                    className="mt-2 h-9 w-full rounded-none border border-[#CACACA] px-3 text-[13px] outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="text-[13px] font-bold leading-none tracking-[0] text-[#111111]"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="hello@example.com"
                    className="mt-2 h-9 w-full rounded-none border border-[#CACACA] px-3 text-[13px] outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="text-[13px] font-bold leading-none tracking-[0] text-[#111111]"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+123 4567890"
                    className="mt-2 h-9 w-full rounded-none border border-[#CACACA] px-3 text-[13px] outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="text-[13px] font-bold leading-none tracking-[0] text-[#111111]"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    placeholder="Write your message here..."
                    className="mt-2 min-h-[132px] w-full resize-none rounded-none border border-[#CACACA] px-3 py-3 text-[13px] outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>

                <button
                  type="submit"
                  className="h-10 w-full rounded-sm bg-[var(--color-primary)] text-[13px] font-bold leading-none tracking-[0] text-white transition hover:bg-[#05314D]"
                >
                  Send Message
                </button>
              </form>
            </div>

            <div className="overflow-hidden rounded-md">
              <iframe
                title="Airport Residential Area, Accra, Ghana location map"
                src="https://maps.google.com/maps?q=Airport%20Residential%20Area%2C%20Accra%2C%20Ghana&t=&z=14&ie=UTF8&iwloc=&output=embed"
                className="h-[460px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-[620px] text-center">
          <h2 className="text-[32px] font-bold leading-[42px] tracking-[0] text-[var(--color-primary)]">
            Contact Information
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-5 text-[15px] font-normal leading-none tracking-[0] text-[#111111] sm:flex-row">
            <a
              href="mailto:info@etiaghana.com"
              className="inline-flex items-center gap-2 hover:text-[var(--color-primary)]"
            >
              <Mail className="size-4 text-[var(--color-primary)]" />
              info@etiaghana.com
            </a>
            <a
              href="tel:+23354444193"
              className="inline-flex items-center gap-2 hover:text-[var(--color-primary)]"
            >
              <Phone className="size-4 text-[var(--color-primary)]" />
              +233 54 444 4193 / +233 54 662 2050
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
