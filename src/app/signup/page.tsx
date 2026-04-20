import { Link2 } from 'lucide-react'
import AuthLogo from '@/components/auth/AuthLogo'
import AuthShell from '@/components/auth/AuthShell'

export default function SignUpPage() {
  return (
    <AuthShell maxWidth="max-w-[1120px]">
      <AuthLogo />

      <div className="mt-8">
        <h1 className="text-center text-[24px] font-bold leading-[32px] tracking-[0]">
          iLearnReady School Portal
        </h1>
        <p className="mt-2 text-center text-[14px] font-normal leading-none tracking-[0] text-[#6B7280]">
          Fill the form to access your dashboard
        </p>

        <form className="mx-auto mt-10 max-w-[980px] border-l border-[#E5E7EB] pl-6">
          <h2 className="text-[18px] font-bold leading-none tracking-[0] text-[#4A5565]">
            Sign Up
          </h2>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="school-name" className="text-[13px] font-normal leading-none">
                School Name
              </label>
              <select
                id="school-name"
                className="mt-2 h-10 w-full rounded-sm border border-[#CACACA] bg-white px-3 text-[13px] text-[#6B7280] outline-none focus:border-[var(--color-primary)]"
              >
                <option>Select your school</option>
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="phone" className="text-[13px] font-normal leading-none">
                  Phone Number*
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-000"
                  className="mt-2 h-10 w-full rounded-sm border border-[#CACACA] px-3 text-[13px] outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-[13px] font-normal leading-none">
                  School Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="hello@example.com"
                  className="mt-2 h-10 w-full rounded-sm border border-[#CACACA] px-3 text-[13px] outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="text-[13px] font-normal leading-none">
                Bio
              </label>
              <textarea
                id="bio"
                placeholder="Tell about yourself..."
                className="mt-2 min-h-[150px] w-full resize-none rounded-sm border border-[#CACACA] px-3 py-3 text-[13px] outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div>
              <label htmlFor="population" className="text-[13px] font-normal leading-none">
                Total School Population
              </label>
              <input
                id="population"
                type="text"
                placeholder="Write here"
                className="mt-2 h-10 w-full rounded-sm border border-[#CACACA] px-3 text-[13px] outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            {['Upload School Logo (Optional)', 'Upload Signature (Optional)'].map(label => (
              <div key={label}>
                <label className="text-[13px] font-normal leading-none">{label}</label>
                <div className="mt-2 flex h-10 items-center justify-between rounded-sm border border-[#CACACA] px-3 text-[13px] text-[#6B7280]">
                  <span>Upload here</span>
                  <Link2 className="size-4" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="mt-8 h-11 w-full rounded-sm bg-[#063D5B] text-[13px] font-bold leading-none text-white transition hover:bg-[var(--color-primary)]"
          >
            Submit
          </button>
        </form>
      </div>
    </AuthShell>
  )
}
