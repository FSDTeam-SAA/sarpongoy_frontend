'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, FileText, Link2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AuthLogo from '@/components/auth/AuthLogo'
import AuthShell from '@/components/auth/AuthShell'
import { axiosInstance } from '@/lib/axios'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface School {
  _id: string
  name: string
  subscribePrice?: number
  NDA?: string
}

const isUrl = (value?: string) => Boolean(value && /^(https?:|blob:|data:)\S+/i.test(value.trim()))

const getApiOrigin = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
  return apiUrl.replace(/\/api\/v\d+\/?$/i, '').replace(/\/$/, '')
}

const getNdaUrl = (nda?: string) => {
  const value = nda?.trim()
  if (!value) return ''
  if (isUrl(value)) return value
  if (value.startsWith('/')) return `${getApiOrigin()}${value}`
  if (value.includes('/')) return `${getApiOrigin()}/${value.replace(/^\/+/, '')}`
  return ''
}

export default function SignUpPage() {
  const router = useRouter()
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchoolDetails, setSelectedSchoolDetails] = useState<School | null>(null)
  const [schoolDetailsLoading, setSchoolDetailsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [form, setForm] = useState({
    schoolId: '',
    selectedSchoolName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    totalStudent: '',
  })

  const [schoolLogo, setSchoolLogo] = useState<File | null>(null)

  useEffect(() => {
    axiosInstance.get('/school?limit=100').then(res => {
      setSchools(res.data?.data || [])
    }).catch(() => { })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSchoolSelect = (value: string | null) => {
    if (!value) {
      setForm(prev => ({
        ...prev,
        schoolId: '',
        selectedSchoolName: '',
      }))
      setSelectedSchoolDetails(null)
      return
    }

    const selectedSchool = schools.find(s => s._id === value)
    if (!selectedSchool) return

    setForm(prev => ({
      ...prev,
      schoolId: selectedSchool._id,
      selectedSchoolName: selectedSchool.name,
    }))
    setSelectedSchoolDetails(selectedSchool)
    setSchoolDetailsLoading(true)

    axiosInstance
      .get(`/school/${selectedSchool._id}`)
      .then(res => {
        const schoolDetails = res.data?.data as School | undefined
        const nextSchool = schoolDetails?._id ? schoolDetails : selectedSchool
        setSelectedSchoolDetails(nextSchool)
      })
      .catch(() => {
        setSelectedSchoolDetails(selectedSchool)
      })
      .finally(() => {
        setSchoolDetailsLoading(false)
      })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.schoolId) {
      toast.error('Please select your school')
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('schoolName', form.schoolId)
      fd.append('phoneNumber', form.phoneNumber)
      fd.append('email', form.email)
      fd.append('password', form.password)
      if (form.bio) fd.append('bio', form.bio)
      if (form.totalStudent) fd.append('totalStudent', form.totalStudent)
      if (schoolLogo) fd.append('schoolLogo', schoolLogo)

      await axiosInstance.post('/auth/register', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success('Account created! Please log in to complete your school payment.')
      router.push('/login')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell maxWidth="max-w-[1120px]">
      <AuthLogo />

      <div className="mt-8 rounded-2xl border border-[#E5E7EB] bg-white px-6 py-7 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:px-8">
        <h1 className="text-center text-[26px] font-bold leading-[34px] tracking-[0] sm:text-[32px] sm:leading-[40px]">
          iLearnReady School Portal
        </h1>
        <p className="mt-3 text-center text-[15px] font-normal leading-[24px] tracking-[0] text-[#6B7280] sm:text-[17px] sm:leading-[26px]">
          Fill the form to access your dashboard
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 max-w-[980px] border-t border-[#E5E7EB] pt-6 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0"
        >
          <h2 className="text-[22px] font-bold leading-none tracking-[0] text-[#4A5565] sm:text-[24px]">
            Sign Up
          </h2>

          <div className="mt-5 space-y-4">
            {/* School Name - shadcn Select */}
            <div>
              <label className="text-[15px] font-normal leading-none">
                School Name
              </label>
              <Select
                value={form.schoolId}
                onValueChange={handleSchoolSelect}
                required
              >
                <SelectTrigger className="mt-2 h-12 w-full rounded-sm border border-[#CACACA] bg-white px-4 text-[15px] text-[#6B7280] outline-none focus:border-[var(--color-primary)] focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Select your school">
                    {form.selectedSchoolName || 'Select your school'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[260px] overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.12)]">
                  {schools.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[14px] text-[#6B7280]">
                      Loading schools...
                    </div>
                  ) : (
                    schools.map(s => (
                      <SelectItem
                        key={s._id}
                        value={s._id}
                        className="cursor-pointer rounded px-3 py-2.5 text-[15px] text-[#0F172A] hover:bg-[#F0F7FF] focus:bg-[#F0F7FF]"
                      >
                        {s.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="phone" className="text-[15px] font-normal leading-none">
                  Phone Number*
                </label>
                <input
                  id="phone"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+1 (555) 000-000"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  className="mt-2 h-12 w-full rounded-sm border border-[#CACACA] px-4 text-[15px] outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-[15px] font-normal leading-none">
                  School Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="hello@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="mt-2 h-12 w-full rounded-sm border border-[#CACACA] px-4 text-[15px] outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="password" className="text-[15px] font-normal leading-none">
                  Password*
                </label>
                <div className="mt-2 flex h-12 items-center rounded-sm border border-[#CACACA] px-4 focus-within:border-[var(--color-primary)]">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? <EyeOff className="size-4 text-[#6B7280]" /> : <Eye className="size-4 text-[#6B7280]" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="text-[15px] font-normal leading-none">
                  Confirm Password*
                </label>
                <div className="mt-2 flex h-12 items-center rounded-sm border border-[#CACACA] px-4 focus-within:border-[var(--color-primary)]">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(p => !p)}>
                    {showConfirmPassword ? <EyeOff className="size-4 text-[#6B7280]" /> : <Eye className="size-4 text-[#6B7280]" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="text-[15px] font-normal leading-none">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                placeholder="Tell about yourself..."
                value={form.bio}
                onChange={handleChange}
                className="mt-2 min-h-[150px] w-full resize-none rounded-sm border border-[#CACACA] px-4 py-3 text-[15px] outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div>
              <label htmlFor="population" className="text-[15px] font-normal leading-none">
                Total School Population
              </label>
              <input
                id="population"
                name="totalStudent"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="Enter total school population"
                value={form.totalStudent}
                onChange={handleChange}
                className="mt-2 h-12 w-full rounded-sm border border-[#CACACA] px-4 text-[15px] outline-none focus:border-[var(--color-primary)]"
              />
              <p className="mt-2 text-[12px] text-[#6B7280]">
                Enter the current total school population for your account.
              </p>
            </div>

            {form.schoolId ? (
              <div className="rounded-2xl border border-[#D7E7CF] bg-[#F8FCF4] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#6A9D23]">
                      School Contract
                    </p>
                    <h3 className="mt-1 text-[20px] font-bold leading-7 text-[#063D5B]">
                      {selectedSchoolDetails?.name || form.selectedSchoolName}
                    </h3>
                    <p className="mt-1 text-[14px] font-semibold text-[#4A5565]">
                      Per-student charge: ${Number(selectedSchoolDetails?.subscribePrice || 0).toLocaleString()}
                    </p>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-full bg-[#EAF4FA] text-[#063D5B]">
                    <FileText className="size-5" />
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-[#DDEBD5] bg-white p-4 shadow-[0_8px_20px_rgba(99,128,68,0.08)]">
                  {schoolDetailsLoading ? (
                    <p className="text-[15px] font-bold text-[#063D5B]">Loading school contract...</p>
                  ) : selectedSchoolDetails?.NDA ? (
                    getNdaUrl(selectedSchoolDetails.NDA) ? (
                      <a
                        href={getNdaUrl(selectedSchoolDetails.NDA)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-[15px] font-bold text-[#063D5B] underline-offset-4 transition hover:text-[#6A9D23] hover:underline"
                      >
                        View School Contract
                      </a>
                    ) : (
                      <p className="text-[15px] font-bold text-[#9A6B16]">
                        School contract saved, but no viewable URL found
                      </p>
                    )
                  ) : (
                    <p className="text-[15px] font-bold text-[#9A6B16]">Not available yet</p>
                  )}
                  <p className="mt-2 text-[13px] leading-5 text-[#6B7280]">
                    Review the school contract before submitting your signup request.
                  </p>
                </div>
              </div>
            ) : null}

            <div>
              <label className="text-[15px] font-normal leading-none">Upload School Logo (Optional)</label>
              <div className="mt-2 flex h-12 items-center justify-between rounded-sm border border-[#CACACA] px-4 text-[15px] text-[#6B7280] cursor-pointer relative">
                <span>{schoolLogo ? schoolLogo.name : 'Upload here'}</span>
                <Link2 className="size-4" aria-hidden="true" />
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={e => setSchoolLogo(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 h-12 w-full rounded-sm bg-[#063D5B] text-[15px] font-bold leading-none text-white transition hover:bg-[var(--color-primary)] disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Submit'}
          </button>

          <p className="mt-6 text-center text-[13px] leading-none">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#6A9D23] hover:underline">
              Login Here
            </Link>
          </p>
        </form>
      </div>
    </AuthShell>
  )
}
