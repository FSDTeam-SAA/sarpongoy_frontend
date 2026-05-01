'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Loader2, Mail, Phone } from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import { axiosInstance } from '@/lib/axios'
import { toast } from 'sonner'

type ContactFormState = {
  schoolName: string
  email: string
  phoneNumber: string
  message: string
}

const initialFormState: ContactFormState = {
  schoolName: '',
  email: '',
  phoneNumber: '',
  message: '',
}

export default function ContactUsPage() {
  const [form, setForm] = useState<ContactFormState>(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const schoolName = form.schoolName.trim()
    const email = form.email.trim()
    const phoneNumber = form.phoneNumber.trim()
    const message = form.message.trim()

    if (!schoolName || !email || !message) {
      toast.error('Please fill in the required fields.')
      return
    }

    setIsSubmitting(true)
    try {
      await axiosInstance.post('/contact', {
        schoolName,
        email,
        phoneNumber,
        message,
      })

      toast.success('Your message has been sent. We will get back to you soon.')
      setForm(initialFormState)
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } }
        message?: string
      }

      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to send your message. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

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
            <h1 className="text-[28px] font-bold leading-[36px] tracking-[0] sm:text-[38px] sm:leading-[48px] md:text-[48px] md:leading-[60px]">
              Talk to Our Team, Get Clear Answers
            </h1>
            <p className="mt-3 max-w-[720px] text-[14px] font-normal leading-[22px] tracking-[0] text-white/80 sm:text-[15px] md:text-[16px]">
              Whether you need a product demo or want to start a project, our
              team is here to guide you every step of the way.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-[1180px] rounded-[40px] border border-[#E5E5E5] bg-white px-6 py-12 sm:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-[420px_1fr]">
            <div>
              <h2 className="text-[24px] font-bold leading-[32px] tracking-[0] text-[var(--color-primary)] sm:text-[28px] sm:leading-[38px] md:text-[32px] md:leading-[42px]">
                Get in Touch
              </h2>
              <p className="mt-2 text-[13px] font-normal leading-[20px] tracking-[0] text-[#4A5565]">
                Our friendly team would love to hear from you.
              </p>

              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="school-name"
                    className="text-[13px] font-bold leading-none tracking-[0] text-[#111111]"
                  >
                    School Name
                  </label>
                  <input
                    id="school-name"
                    name="schoolName"
                    type="text"
                    placeholder="Name Here"
                    value={form.schoolName}
                    onChange={handleChange}
                    required
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
                    name="email"
                    type="email"
                    placeholder="hello@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
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
                    name="phoneNumber"
                    type="tel"
                    placeholder="+123 4567890"
                    value={form.phoneNumber}
                    onChange={handleChange}
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
                    name="message"
                    placeholder="Write your message here..."
                    value={form.message}
                    onChange={handleChange}
                    required
                    className="mt-2 min-h-[132px] w-full resize-none rounded-none border border-[#CACACA] px-3 py-3 text-[13px] outline-none transition focus:border-[var(--color-primary)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm bg-[var(--color-primary)] text-[13px] font-bold leading-none tracking-[0] text-white transition hover:bg-[#05314D] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            <div className="overflow-hidden rounded-md">
              <iframe
                title="iLearnReady location map"
                src="https://maps.google.com/maps?ll=5.605278,-0.171389&z=14&hl=en&output=embed"
                className="h-[460px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-[620px] text-center">
          <h2 className="text-[24px] font-bold leading-[32px] tracking-[0] text-[var(--color-primary)] sm:text-[28px] sm:leading-[38px] md:text-[32px] md:leading-[42px]">
            Contact Information
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 text-[14px] font-normal leading-6 tracking-[0] text-[#111111] sm:text-[15px]">
            <a
              href="mailto:info@etiaghana.com"
              className="inline-flex items-center gap-2 hover:text-[var(--color-primary)]"
            >
              <Mail className="size-4 text-[var(--color-primary)]" />
              info@etiaghana.com
            </a>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
              <a
                href="tel:+233544444193"
                className="inline-flex items-center gap-2 hover:text-[var(--color-primary)]"
              >
                <Phone className="size-4 text-[var(--color-primary)]" />
                +233 54 444 4193
              </a>
              <a
                href="tel:+233546622050"
                className="inline-flex items-center gap-2 hover:text-[var(--color-primary)]"
              >
                <Phone className="size-4 text-[var(--color-primary)]" />
                +233 54 662 2050
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
