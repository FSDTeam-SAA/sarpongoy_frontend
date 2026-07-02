'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Eye,
  EyeOff,
  Check,
  X,
  Upload,
  CreditCard,
  Download,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  FileText,
} from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import { axiosInstance } from '@/lib/axios'
import { getToken, getUser, setUser, logout } from '@/lib/auth-helpers'
import { getAssignedSchoolAccess } from '@/lib/school-access'
import {
  normalizeSchoolNameValue,
  resolveSchoolName,
  withCacheBuster,
} from '@/lib/school'
import { toast } from 'sonner'

interface PasswordRule {
  label: string
  test: (pw: string) => boolean
}

const passwordRules: PasswordRule[] = [
  {
    label: 'Minimum 8–12 characters (recommend 12+ for stronger security).',
    test: pw => pw.length >= 8,
  },
  {
    label: 'At least one uppercase letter must.',
    test: pw => /[A-Z]/.test(pw),
  },
  {
    label: 'At least one lowercase letter must.',
    test: pw => /[a-z]/.test(pw),
  },
  { label: 'At least one number must (0–9).', test: pw => /\d/.test(pw) },
  {
    label: 'At least special character (! @ # $ % ^ & * etc.).',
    test: pw => /[!@#$%^&*]/.test(pw),
  },
  { label: 'No spaces allowed.', test: pw => !/\s/.test(pw) && pw.length > 0 },
]

interface UserProfile {
  _id?: string
  email?: string
  phoneNumber?: string
  bio?: string
  schoolLogo?: string
  profilePicture?: string
  uploadeSignature?: string
  totalStudent?: number
  studentList?: unknown[]
  schoolName?: string | { _id?: string; name?: string }
}

interface SchoolDetails {
  _id?: string
  name?: string
  subscribePrice?: number
  NDA?: string
  termConfig?: {
    firstTermDueDate?: string
    secondTermDueDate?: string
    thirdTermDueDate?: string
    fullPaymentDueDate?: string
  }
}

interface SchoolPaymentOverview {
  schoolId?: string
  schoolName?: string
  paymentAccessStatus?: 'active' | 'restricted'
  activeTerm?: string
  overdueTerm?: string
  isRestricted?: boolean
  reason?: string
  hasConfiguredDueDate?: boolean
  totalStudents?: number
  perStudentCharge?: number
  totalAmountDue?: number
  totalCollected?: number
  balanceDue?: number
  latestPayment?: {
    id?: string
    amount?: number
    status?: string
    paymentPlan?: string
    paymentMethod?: string
    createdAt?: string
  } | null
  paymentHistory?: Array<{
    id?: string
    paymentId?: string
    status?: string
    paymentPlan?: string
    paymentMethod?: string
    amount?: number
    note?: string
    createdAt?: string
  }>
  paymentTerms?: Array<{
    termId?: string
    label?: string
    amount?: number
    amountPaid?: number
    remainingDue?: number
    dueDate?: string
    status?: string
  }>
}

interface StudentRow {
  _id?: string
  schoolName: string
  lastName: string
  firstName: string
  studentId: string
  gradeLevel: string
}

interface StudentMeta {
  page: number
  limit: number
  total: number
}

type PaymentDueDateItem = {
  label: string
  dueDate?: string
  remainingDue?: number
  status?: string
}

const STUDENTS_PER_PAGE = 10

function buildPaginationItems(
  currentPage: number,
  totalPages: number,
): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 'ellipsis', totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      'ellipsis',
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ]
  }

  return [
    1,
    'ellipsis',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis',
    totalPages,
  ]
}

export default function ProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [studentMeta, setStudentMeta] = useState<StudentMeta>({
    page: 1,
    limit: STUDENTS_PER_PAGE,
    total: 0,
  })
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [uploadingStudents, setUploadingStudents] = useState(false)
  const [invoiceDownloadingId, setInvoiceDownloadingId] = useState('')
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails | null>(null)
  const [paymentOverview, setPaymentOverview] =
    useState<SchoolPaymentOverview | null>(null)

  // Personal info form state
  const [form, setForm] = useState({
    phoneNumber: '',
    bio: '',
    email: '',
    schoolNameDisplay: '',
  })
  const [schoolLogo, setSchoolLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoVersion, setLogoVersion] = useState(Date.now())
  const [signature, setSignature] = useState<File | null>(null)
  const [savingInfo, setSavingInfo] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const signatureRef = useRef<HTMLInputElement>(null)
  const studentFileRef = useRef<HTMLInputElement>(null)

  // Change password form state
  const [pwForm, setPwForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const ruleResults = passwordRules.map(rule => ({
    ...rule,
    passed: rule.test(pwForm.newPassword),
  }))

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/user/profile')
      const data = res.data.data as UserProfile
      const { school, isActive, access } = await getAssignedSchoolAccess(data)

      if (!isActive) {
        toast.warning(
          access?.reason ||
            'Please complete your school payment before accessing settings.',
        )
        router.replace('/purchase-plan')
        return
      }

      const resolvedSchoolName = await resolveSchoolName(data.schoolName)
      const normalizedProfile = {
        ...data,
        schoolName: normalizeSchoolNameValue(
          data.schoolName,
          resolvedSchoolName,
        ),
      } as UserProfile
      setProfile(normalizedProfile)
      setForm({
        phoneNumber: normalizedProfile.phoneNumber || '',
        bio: normalizedProfile.bio || '',
        email: normalizedProfile.email || '',
        schoolNameDisplay: resolvedSchoolName,
      })
      setLogoPreview(normalizedProfile.schoolLogo || null)
      setLogoVersion(Date.now())
      setSchoolDetails(school)
      setPaymentOverview(null)

      if (school?._id) {
        try {
          const overviewRes = await axiosInstance.get(
            `/payment/school/${school._id}/overview`,
          )
          setPaymentOverview(overviewRes.data?.data as SchoolPaymentOverview)
        } catch {
          setPaymentOverview(null)
        }
      }
      // Also refresh user in localStorage
      const storedUser = getUser()
      if (storedUser) {
        setUser({ ...(storedUser as object), ...normalizedProfile })
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } }
      if (error?.response?.status === 401) {
        logout()
        router.push('/login')
        return
      }
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/login')
      return
    }
    fetchProfile()
  }, [fetchProfile, router])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const getUrlTarget = () => {
      if (window.location.search.includes('tab=settings')) return 'settings'
      if (window.location.hash === '#subscription-payment') {
        return 'subscription-payment'
      }
      return ''
    }

    const applyTarget = (target = '') => {
      const nextTarget =
        target ||
        window.sessionStorage.getItem('profile-navigation-target') ||
        getUrlTarget()

      if (nextTarget === 'settings') {
        setActiveTab('password')
        window.sessionStorage.removeItem('profile-navigation-target')
        return
      }

      if (nextTarget === 'subscription-payment') {
        setActiveTab('info')
        if (loading) return
        window.sessionStorage.removeItem('profile-navigation-target')
        window.setTimeout(() => {
          document
            .getElementById('subscription-payment')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 80)
      }
    }

    const handleProfileTarget = (event: Event) => {
      applyTarget((event as CustomEvent<string>).detail)
    }
    const handleUrlTarget = () => applyTarget()

    applyTarget()
    window.addEventListener('profile-navigation-target', handleProfileTarget)
    window.addEventListener('hashchange', handleUrlTarget)
    window.addEventListener('popstate', handleUrlTarget)

    return () => {
      window.removeEventListener('profile-navigation-target', handleProfileTarget)
      window.removeEventListener('hashchange', handleUrlTarget)
      window.removeEventListener('popstate', handleUrlTarget)
    }
  }, [loading])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSchoolLogo(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleInfoSave = async () => {
    if (
      !form.phoneNumber.trim() &&
      !form.bio.trim() &&
      !schoolLogo &&
      !signature
    ) {
      toast.error('Please update at least one field before saving')
      return
    }

    setSavingInfo(true)
    try {
      const fd = new FormData()
      fd.append('phoneNumber', form.phoneNumber)
      fd.append('bio', form.bio)
      if (schoolLogo) fd.append('schoolLogo', schoolLogo)
      if (signature) fd.append('uploadeSignature', signature)

      const res = await axiosInstance.put('/user/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const updated = res.data.data as UserProfile
      const mergedProfile = { ...profile, ...updated } as UserProfile
      const resolvedSchoolName = await resolveSchoolName(
        mergedProfile.schoolName,
      )
      const normalizedProfile = {
        ...mergedProfile,
        schoolName: normalizeSchoolNameValue(
          mergedProfile.schoolName,
          resolvedSchoolName,
        ),
      } as UserProfile
      setProfile(normalizedProfile)
      setForm({
        phoneNumber: normalizedProfile.phoneNumber || '',
        bio: normalizedProfile.bio || '',
        email: normalizedProfile.email || '',
        schoolNameDisplay: resolvedSchoolName,
      })
      setLogoPreview(normalizedProfile.schoolLogo || null)
      setLogoVersion(Date.now())
      setSchoolLogo(null)
      setSignature(null)
      const storedUser = getUser()
      if (storedUser)
        setUser({ ...(storedUser as object), ...normalizedProfile })
      toast.success('Profile updated successfully!')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Failed to update profile')
    } finally {
      setSavingInfo(false)
    }
  }

  const handlePasswordSave = async () => {
    if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    if (pwForm.oldPassword === pwForm.newPassword) {
      toast.error('New password must be different from current password')
      return
    }
    if (!ruleResults.every(r => r.passed)) {
      toast.error('Password does not meet all requirements')
      return
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    setSavingPw(true)
    try {
      await axiosInstance.post('/auth/change-password', {
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword,
      })
      toast.success('Password changed successfully!')
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      setShowOld(false)
      setShowNew(false)
      setShowConfirm(false)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Failed to change password')
    } finally {
      setSavingPw(false)
    }
  }

  const formatCurrency = (value?: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(Number(value || 0))

  const isUrl = (value?: string) =>
    Boolean(value && /^(https?:|blob:|data:)\S+/i.test(value.trim()))

  const getApiOrigin = () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
    return apiUrl.replace(/\/api\/v\d+\/?$/i, '').replace(/\/$/, '')
  }

  const getNdaUrl = (nda?: string) => {
    const value = nda?.trim()
    if (!value) return ''
    if (isUrl(value)) return value
    if (value.startsWith('/')) return `${getApiOrigin()}${value}`
    if (value.includes('/'))
      return `${getApiOrigin()}/${value.replace(/^\/+/, '')}`
    return ''
  }

  const getNdaLabel = (nda?: string) => {
    if (!nda?.trim()) return 'No school contract available yet.'
    return getNdaUrl(nda) ? 'View School Contract' : 'School contract on file'
  }

  const formatAccessStatus = (
    status?: SchoolPaymentOverview['paymentAccessStatus'],
  ) => {
    if (status === 'restricted') return 'Payment required'
    if (status === 'active') return 'Access active'
    return 'Unknown'
  }

  const formatPaymentPlan = (plan?: string) => {
    if (plan === 'first_term') return 'First Term'
    if (plan === 'second_term') return 'Second Term'
    if (plan === 'third_term') return 'Third Term'
    if (plan === 'full_year') return 'Full Term'
    if (plan === 'full_payment') return 'Full Payment'
    if (plan?.startsWith('term_')) {
      return `Term ${plan.replace('term_', '')}`
    }
    return plan ? plan.replace(/_/g, ' ') : 'N/A'
  }

  const formatPaymentStatus = (status?: string) => {
    if (!status) return 'unknown'
    return status.replace(/_/g, ' ')
  }

  const downloadInvoice = async (paymentId?: string) => {
    if (!paymentId) {
      toast.error('Invoice payment reference not found.')
      return
    }

    try {
      setInvoiceDownloadingId(paymentId)
      const res = await axiosInstance.get(`/payment/${paymentId}/invoice`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(res.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${paymentId.slice(-8)}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(
        error?.response?.data?.message || 'Failed to download invoice',
      )
    } finally {
      setInvoiceDownloadingId('')
    }
  }

  const planCapacity = profile?.totalStudent ?? 0
  const usedStudents = studentMeta.total
  const usagePercent =
    planCapacity > 0
      ? Math.min(100, Math.round((usedStudents / planCapacity) * 100))
      : 0
  const isAtCapacity = planCapacity > 0 && usedStudents >= planCapacity
  const paymentTerms = paymentOverview?.paymentTerms || []
  const nextDueTerm =
    paymentTerms.find(term => term.status === 'overdue') ||
    paymentTerms.find(term => Number(term.remainingDue || 0) > 0) ||
    null
  const hasPaymentDue = Number(paymentOverview?.balanceDue || 0) > 0
  const legacyDueDates: PaymentDueDateItem[] = [
    { label: 'First Term', dueDate: schoolDetails?.termConfig?.firstTermDueDate },
    { label: 'Second Term', dueDate: schoolDetails?.termConfig?.secondTermDueDate },
    { label: 'Third Term', dueDate: schoolDetails?.termConfig?.thirdTermDueDate },
    { label: 'Full Payment', dueDate: schoolDetails?.termConfig?.fullPaymentDueDate },
  ].filter(item => Boolean(item.dueDate))
  const dueDateItems: PaymentDueDateItem[] = paymentTerms.length
    ? paymentTerms.map(term => ({
        label: term.label || formatPaymentPlan(term.termId),
        dueDate: term.dueDate,
        remainingDue: term.remainingDue,
        status: term.status,
      }))
    : legacyDueDates

  const fetchStudents = useCallback(
    async (page = 1) => {
      setLoadingStudents(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(STUDENTS_PER_PAGE),
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
        const res = await axiosInstance.get(`/exclesheet?${params.toString()}`)
        const data = res.data?.data as StudentRow[] | undefined
        const meta = res.data?.meta as StudentMeta | undefined

        setStudents(data || [])
        setStudentMeta({
          page: meta?.page || page,
          limit: meta?.limit || STUDENTS_PER_PAGE,
          total: meta?.total || 0,
        })
      } catch (err: unknown) {
        const error = err as {
          response?: { status?: number; data?: { message?: string } }
        }
        if (error?.response?.status === 401) {
          logout()
          router.push('/login')
          return
        }
        setStudents([])
        setStudentMeta({ page, limit: STUDENTS_PER_PAGE, total: 0 })
      } finally {
        setLoadingStudents(false)
      }
    },
    [router],
  )

  useEffect(() => {
    if (loading || activeTab !== 'info') return
    fetchStudents(1)
  }, [activeTab, fetchStudents, loading])

  const handleDemoUpload = async (file: File) => {
    if (isAtCapacity) {
      toast.warning('You have reached your admin-assigned student limit.')
      return
    }

    setUploadingStudents(true)
    try {
      // First, clear existing students to perform a "replace"
      await axiosInstance.delete('/exclesheet')

      const fd = new FormData()
      fd.append('file', file)

      await axiosInstance.post('/exclesheet/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success('Student list replaced successfully!')
      await fetchStudents(1)
      // Also refresh profile to update "Total Paid" count
      await fetchProfile()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(
        error?.response?.data?.message || 'Failed to replace student list',
      )
    } finally {
      setUploadingStudents(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6]">
        <div className="text-[#063D5B]">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar hideAnnouncement />

      {/* Top breadcrumb bar (matches design image) */}
      <div className="fixed inset-x-0 top-[70px] z-40 bg-[#E8EAF0] px-4 py-2 text-xs text-[#6B7280] shadow-sm sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <span>
            {activeTab === 'info' ? 'Personal Information' : 'Change Password'}
          </span>
          <button
            type="button"
            onClick={() => router.push('/purchase-plan')}
            className="inline-flex h-8 items-center rounded-full bg-[#063D5B] px-3 text-[12px] font-semibold text-white transition hover:bg-[var(--color-primary)] md:hidden"
          >
            Pay Now
          </button>
        </div>
      </div>

      <div className="pt-[calc(70px+36px)] pb-10 px-4 sm:px-8 lg:px-[90px]">
        {/* Tabs */}
        <div className="mt-6 inline-flex rounded-md border border-[#E5E7EB] bg-white text-[14px]">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-2.5 font-medium transition rounded-l-md ${
              activeTab === 'info'
                ? 'bg-[#063D5B] text-white'
                : 'text-[#6B7280] hover:bg-[#F8FAFC]'
            }`}
          >
            Personal Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-6 py-2.5 font-medium transition rounded-r-md ${
              activeTab === 'password'
                ? 'bg-[#063D5B] text-white'
                : 'text-[#6B7280] hover:bg-[#F8FAFC]'
            }`}
          >
            Change Password
          </button>
        </div>

        {/* ─── PERSONAL INFORMATION TAB ─── */}
        {activeTab === 'info' && (
          <div className="mt-6 space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-[22px] font-bold text-[#111]">
                    School Information
                  </h1>
                  <p className="mt-1 text-[14px] text-[#6B7280]">
                    Manage your school information and profile details.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] p-4">
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className="relative flex size-20 items-center justify-center overflow-hidden rounded-full bg-[#F3F4F6] transition hover:opacity-80"
                  >
                    {logoPreview ? (
                      <Image
                        src={withCacheBuster(logoPreview, logoVersion)}
                        alt="Logo"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Upload className="size-6 text-[#9CA3AF]" />
                    )}
                  </button>
                  <span className="text-[12px] text-[#6B7280]">
                    Upload logo
                  </span>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </div>

                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] p-4">
                  <CreditCard className="size-6 text-[#063D5B]" />
                  <p className="text-[16px] font-bold text-[#111]">
                    {formatCurrency(schoolDetails?.subscribePrice)}
                  </p>
                  <p className="text-[12px] text-[#6B7280]">
                    School Subscription
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] p-4">
                  <p className="text-[14px] font-semibold text-[#6B7280]">
                    Total Students
                  </p>
                  <p className="text-[28px] font-bold text-[var(--color-primary)]">
                    {profile?.totalStudent ?? 0}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#063D5B] p-4">
                  <p className="text-[14px] font-semibold text-white">
                    Imported Students
                  </p>
                  <p className="text-[28px] font-bold text-white">
                    {usedStudents}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-[14px] font-medium text-[#4A5565]">
                    School Name
                  </label>
                  <input
                    type="text"
                    value={form.schoolNameDisplay}
                    readOnly
                    className="mt-1 h-11 w-full rounded-sm border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-[14px] text-[#6B7280] outline-none"
                    placeholder="School name"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-[14px] font-medium text-[#4A5565]">
                      School Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      readOnly
                      className="mt-1 h-11 w-full rounded-sm border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-[14px] text-[#6B7280] outline-none"
                      placeholder="Email"
                    />
                  </div>
                  <div>
                    <label className="text-[14px] font-medium text-[#4A5565]">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={form.phoneNumber}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          phoneNumber: e.target.value,
                        }))
                      }
                      className="mt-1 h-11 w-full rounded-sm border border-[#E5E7EB] bg-white px-3 text-[14px] outline-none focus:border-[var(--color-primary)]"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[14px] font-medium text-[#4A5565]">
                    Bio
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={e =>
                      setForm(prev => ({ ...prev, bio: e.target.value }))
                    }
                    rows={4}
                    className="mt-1 w-full resize-none rounded-sm border border-[#E5E7EB] bg-white px-3 py-3 text-[14px] outline-none focus:border-[var(--color-primary)]"
                    placeholder="Tell about your school..."
                  />
                </div>

                <div>
                  <label className="text-[14px] font-medium text-[#4A5565]">
                    Signature
                  </label>
                  <div
                    className="relative mt-1 flex h-11 cursor-pointer items-center justify-between rounded-sm border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#6B7280] hover:border-[var(--color-primary)]"
                    onClick={() => signatureRef.current?.click()}
                  >
                    <span>
                      {signature
                        ? signature.name
                        : profile?.uploadeSignature
                          ? 'Signature uploaded'
                          : 'Upload signature'}
                    </span>
                    <Upload className="size-4" />
                    <input
                      ref={signatureRef}
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={e => setSignature(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleInfoSave}
                  disabled={savingInfo}
                  className="h-11 rounded-md bg-[#063D5B] px-8 text-[14px] font-bold text-white transition hover:bg-[var(--color-primary)] disabled:opacity-60"
                >
                  {savingInfo ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                  <h2 className="text-[22px] font-bold leading-tight text-[#111]">
                    School Agreement
                  </h2>
                  <p className="mt-1 text-[14px] leading-6 text-[#6B7280]">
                    Review the admin-assigned school contract, per-student
                    charge, and current student limit.
                  </p>
                </div>
                <span className="inline-flex self-start rounded-full bg-[#E6F4EA] px-3 py-1 text-[12px] font-semibold leading-5 text-[#2F9E44]">
                  Shared with admin
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <p className="text-[13px] font-medium text-[#6B7280]">
                    Total Students
                  </p>
                  <p className="mt-2 text-[28px] font-bold text-[#111]">
                    {profile?.totalStudent ?? 0}
                  </p>
                </div>

                <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <p className="text-[13px] font-medium text-[#6B7280]">
                    Subscription Price
                  </p>
                  <p className="mt-2 text-[28px] font-bold text-[#111]">
                    {formatCurrency(schoolDetails?.subscribePrice)}
                  </p>
                </div>

                <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-[#6B7280]">
                    <FileText className="size-4" />
                    School Contract
                  </div>
                  {schoolDetails?.NDA ? (
                    getNdaUrl(schoolDetails.NDA) ? (
                      <a
                        href={getNdaUrl(schoolDetails.NDA)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-[15px] font-semibold text-[#063D5B] transition hover:text-[var(--color-primary)]"
                      >
                        {getNdaLabel(schoolDetails.NDA)}
                      </a>
                    ) : (
                      <p className="mt-2 max-h-24 overflow-hidden whitespace-pre-wrap text-[15px] leading-6 text-[#111]">
                        {getNdaLabel(schoolDetails.NDA)}
                      </p>
                    )
                  ) : (
                    <p className="mt-2 text-[15px] text-[#6B7280]">
                      No school contract available yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div
              className="rounded-xl bg-white p-6 shadow-sm"
              id="subscription-payment"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-[22px] font-bold text-[#111]">
                    Subscription & Payment
                  </h2>
                  <p className="mt-1 text-[14px] text-[#6B7280]">
                    Review due dates, payment status, and the latest
                    subscription activity.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/purchase-plan')}
                  className="h-11 rounded-md bg-[#063D5B] px-5 text-[14px] font-bold text-white transition hover:bg-[var(--color-primary)]"
                >
                  Open Payment Page
                </button>
              </div>

              {hasPaymentDue ? (
                <div className="mt-5 flex flex-col gap-3 rounded-lg border border-[#FBBF24] bg-[#FFFBEB] p-4 text-[#92400E] md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[14px] font-bold">
                      Payment due
                      {nextDueTerm?.label ? `: ${nextDueTerm.label}` : ''}
                    </p>
                    <p className="mt-1 text-[13px] leading-5">
                      {formatCurrency(
                        Number(
                          nextDueTerm?.remainingDue ??
                            paymentOverview?.balanceDue ??
                            0,
                        ),
                      )}{' '}
                      is still unpaid. Complete payment to keep access current.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => router.push('/purchase-plan')}
                      className="h-9 rounded-md bg-[#063D5B] px-4 text-[13px] font-bold text-white transition hover:bg-[var(--color-primary)]"
                    >
                      Pay Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('password')}
                      className="h-9 rounded-md border border-[#F59E0B] bg-white px-4 text-[13px] font-bold text-[#92400E] transition hover:bg-[#FEF3C7]"
                    >
                      Settings
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <p className="text-[13px] font-medium text-[#6B7280]">
                    Access Status
                  </p>
                  <p className="mt-2 text-[20px] font-bold text-[#111]">
                    {formatAccessStatus(paymentOverview?.paymentAccessStatus)}
                  </p>
                  <p className="mt-1 text-[12px] text-[#6B7280]">
                    {paymentOverview?.reason ||
                      'Due dates and payment status stay synced here.'}
                  </p>
                </div>

                <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <p className="text-[13px] font-medium text-[#6B7280]">
                    Next Due Term
                  </p>
                  <p className="mt-2 text-[20px] font-bold text-[#111]">
                    {nextDueTerm?.label ||
                      (paymentOverview?.overdueTerm &&
                      paymentOverview.overdueTerm !== 'none'
                        ? formatPaymentPlan(paymentOverview.overdueTerm)
                        : paymentOverview?.activeTerm &&
                            paymentOverview.activeTerm !== 'none'
                          ? formatPaymentPlan(paymentOverview.activeTerm)
                          : 'None')}
                  </p>
                  <p className="mt-1 text-[12px] text-[#6B7280]">
                    {nextDueTerm?.dueDate
                      ? `Due ${new Date(nextDueTerm.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                      : 'No unpaid term due date found.'}
                  </p>
                </div>

                <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <p className="text-[13px] font-medium text-[#6B7280]">
                    Collected
                  </p>
                  <p className="mt-2 text-[20px] font-bold text-[#111]">
                    {formatCurrency(paymentOverview?.totalCollected)}
                  </p>
                  <p className="mt-1 text-[12px] text-[#6B7280]">
                    Against {formatCurrency(paymentOverview?.totalAmountDue)}{' '}
                    due
                  </p>
                </div>

                <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <p className="text-[13px] font-medium text-[#6B7280]">
                    Balance Due
                  </p>
                  <p className="mt-2 text-[20px] font-bold text-[#111]">
                    {formatCurrency(paymentOverview?.balanceDue)}
                  </p>
                  <p className="mt-1 text-[12px] text-[#6B7280]">
                    {paymentOverview?.latestPayment?.status
                      ? `Latest payment: ${formatPaymentStatus(paymentOverview.latestPayment.status)}`
                      : 'No completed payment yet.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <p className="text-[13px] font-medium text-[#6B7280]">
                    Due Dates
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {dueDateItems.map(item => (
                      <div
                        key={item.label}
                        className="rounded-md bg-white px-3 py-2"
                      >
                        <p className="text-[12px] font-medium text-[#6B7280]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-[14px] font-semibold text-[#0A0A0B]">
                          {item.dueDate
                            ? new Date(item.dueDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Not set'}
                        </p>
                        {'remainingDue' in item && item.remainingDue !== undefined ? (
                          <p className="mt-1 text-[12px] font-medium text-[#64748B]">
                            {formatPaymentStatus(String(item.status || 'pending'))} ·{' '}
                            {formatCurrency(Number(item.remainingDue || 0))} due
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-medium text-[#6B7280]">
                      Recent Payment Activity
                    </p>
                    <p className="text-[12px] font-medium text-[#64748B]">
                      {paymentOverview?.paymentHistory?.length || 0} items
                    </p>
                  </div>

                  <div className="mt-3 space-y-3">
                    {paymentOverview?.paymentHistory?.length ? (
                      paymentOverview.paymentHistory.slice(0, 4).map(item => (
                        <div
                          key={item.id}
                          className="rounded-md bg-white px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[14px] font-semibold text-[#0A0A0B]">
                              {formatPaymentPlan(item.paymentPlan)}
                            </p>
                            <span className="rounded-full bg-[#EEF6FB] px-2 py-0.5 text-[11px] font-semibold text-[#063D5B]">
                              {formatPaymentStatus(item.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-[12px] text-[#6B7280]">
                            {formatCurrency(item.amount)} ·{' '}
                            {item.paymentMethod || 'system'}
                            {item.createdAt
                              ? ` · ${new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                              : ''}
                          </p>
                          {item.note ? (
                            <p className="mt-1 text-[12px] text-[#475569]">
                              {item.note}
                            </p>
                          ) : null}
                          {item.status === 'completed' && item.paymentId ? (
                            <button
                              type="button"
                              onClick={() => downloadInvoice(item.paymentId)}
                              disabled={invoiceDownloadingId === item.paymentId}
                              className="mt-2 inline-flex h-8 items-center justify-center gap-2 rounded-md border border-[#063D5B] px-3 text-[12px] font-semibold text-[#063D5B] transition hover:bg-[#EEF6FB] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {invoiceDownloadingId === item.paymentId
                                ? 'Downloading...'
                                : 'Download Invoice'}
                              <Download className="size-3.5" />
                            </button>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="rounded-md bg-white px-3 py-4 text-[13px] text-[#6B7280]">
                        No payment activity yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-gradient-to-r from-[#063D5B] to-[#0C6AA0] p-6 text-white shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">
                    School Capacity
                  </p>
                  <h2 className="mt-2 text-[22px] font-bold">
                    Admin-managed student limit
                  </h2>
                  <p className="mt-2 text-[14px] leading-6 text-white/80">
                    {usedStudents} of {planCapacity || 0} students used
                  </p>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white transition-all"
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-white/10 px-5 py-4 text-[14px] leading-6 text-white/85">
                  Student capacity and price are managed by the admin for your
                  school.
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-[22px] font-bold text-[#111]">
                    Added Students
                  </h2>
                  <p className="mt-1 text-[14px] text-[#6B7280]">
                    Download the demo file, upload your students, and review
                    imported records below.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/images/students_demo.xlsx"
                    download
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#063D5B] bg-white px-4 text-[14px] font-semibold text-[#063D5B] transition hover:bg-[#F8FAFC]"
                  >
                    Download Demo Excel
                    <Download className="size-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (isAtCapacity) {
                        toast.warning(
                          'You have reached your admin-assigned student limit.',
                        )
                        return
                      }
                      studentFileRef.current?.click()
                    }}
                    disabled={uploadingStudents}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#063D5B] px-4 text-[14px] font-semibold text-white transition hover:bg-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Upload Student Data (Excel)
                    <Upload className="size-4" />
                  </button>
                  <input
                    ref={studentFileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      await handleDemoUpload(file)
                      e.target.value = ''
                    }}
                  />
                </div>
              </div>

              <div className="mt-8 overflow-hidden rounded-sm border border-[#E5E7EB]">
                <div className="overflow-x-auto">
                  <table className="min-w-[760px] w-full border-collapse text-left">
                    <thead className="bg-[#F8FAFC] text-[13px] text-[#6B7280]">
                      <tr>
                        <th className="px-6 py-4 font-semibold">School Name</th>
                        <th className="px-6 py-4 font-semibold">Last Name</th>
                        <th className="px-6 py-4 font-semibold">First Name</th>
                        <th className="px-6 py-4 font-semibold">Student ID</th>
                        <th className="px-6 py-4 font-semibold">Grade Level</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white text-[14px] text-[#374151]">
                      {loadingStudents ? (
                        <tr>
                          <td
                            className="px-6 py-10 text-center text-[#6B7280]"
                            colSpan={5}
                          >
                            Loading student records...
                          </td>
                        </tr>
                      ) : students.length ? (
                        students.map(student => (
                          <tr
                            key={
                              student._id ||
                              `${student.studentId}-${student.firstName}`
                            }
                          >
                            <td className="border-t border-[#E5E7EB] px-6 py-4">
                              {student.schoolName}
                            </td>
                            <td className="border-t border-[#E5E7EB] px-6 py-4">
                              {student.lastName}
                            </td>
                            <td className="border-t border-[#E5E7EB] px-6 py-4">
                              {student.firstName}
                            </td>
                            <td className="border-t border-[#E5E7EB] px-6 py-4">
                              {student.studentId}
                            </td>
                            <td className="border-t border-[#E5E7EB] px-6 py-4">
                              {student.gradeLevel}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            className="px-6 py-10 text-center text-[#6B7280]"
                            colSpan={5}
                          >
                            No student records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-4 border-t border-[#E5E7EB] bg-[#FBFCFE] px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-[13px] text-[#6B7280]">
                    Showing{' '}
                    {studentMeta.total
                      ? (studentMeta.page - 1) * studentMeta.limit + 1
                      : 0}{' '}
                    to{' '}
                    {Math.min(
                      studentMeta.page * studentMeta.limit,
                      studentMeta.total,
                    )}{' '}
                    of {studentMeta.total} results
                  </p>

                  {Math.ceil(studentMeta.total / studentMeta.limit) > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          fetchStudents(Math.max(1, studentMeta.page - 1))
                        }
                        disabled={studentMeta.page <= 1 || loadingStudents}
                        className="inline-flex size-8 items-center justify-center rounded-sm border border-[#CBD5E1] bg-white text-[#6B7280] transition hover:border-[#94A3B8] hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="size-4" />
                      </button>

                      {buildPaginationItems(
                        studentMeta.page,
                        Math.ceil(studentMeta.total / studentMeta.limit),
                      ).map((item, index) =>
                        typeof item !== 'number' ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="inline-flex h-8 min-w-8 items-center justify-center px-2 text-[14px] text-[#94A3B8]"
                          >
                            <Ellipsis className="size-4" />
                          </span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            onClick={() => fetchStudents(item)}
                            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-sm border px-2 text-[14px] transition ${
                              item === studentMeta.page
                                ? 'border-[#063D5B] bg-[#063D5B] text-white'
                                : 'border-[#CBD5E1] bg-white text-[#334155] hover:border-[#94A3B8]'
                            }`}
                            aria-label={`Page ${item}`}
                          >
                            {item}
                          </button>
                        ),
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          fetchStudents(
                            Math.min(
                              Math.ceil(studentMeta.total / studentMeta.limit),
                              studentMeta.page + 1,
                            ),
                          )
                        }
                        disabled={
                          studentMeta.page >=
                            Math.ceil(studentMeta.total / studentMeta.limit) ||
                          loadingStudents
                        }
                        className="inline-flex size-8 items-center justify-center rounded-sm border border-[#CBD5E1] bg-white text-[#6B7280] transition hover:border-[#94A3B8] hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Next page"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── CHANGE PASSWORD TAB ─── */}
        {activeTab === 'password' && (
          <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <h1 className="text-[22px] font-bold text-[#111]">
              Change Password
            </h1>
            <p className="mt-1 text-[14px] text-[#6B7280]">
              Manage your account preferences, security settings, and privacy
              options.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {/* Current Password */}
              <div>
                <label className="text-[14px] font-medium text-[#4A5565]">
                  Current Password
                </label>
                <div className="mt-2 flex h-11 items-center rounded-sm border border-[#CACACA] px-3 focus-within:border-[var(--color-primary)]">
                  <input
                    type={showOld ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={pwForm.oldPassword}
                    onChange={e =>
                      setPwForm(prev => ({
                        ...prev,
                        oldPassword: e.target.value,
                      }))
                    }
                    className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none"
                  />
                  <button type="button" onClick={() => setShowOld(p => !p)}>
                    {showOld ? (
                      <EyeOff className="size-4 text-[#6B7280]" />
                    ) : (
                      <Eye className="size-4 text-[#6B7280]" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="text-[14px] font-medium text-[#4A5565]">
                  New Password
                </label>
                <div className="mt-2 flex h-11 items-center rounded-sm border border-[#CACACA] px-3 focus-within:border-[var(--color-primary)]">
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={pwForm.newPassword}
                    onChange={e =>
                      setPwForm(prev => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none"
                  />
                  <button type="button" onClick={() => setShowNew(p => !p)}>
                    {showNew ? (
                      <EyeOff className="size-4 text-[#6B7280]" />
                    ) : (
                      <Eye className="size-4 text-[#6B7280]" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="mt-4 max-w-[50%] pr-2">
              <label className="text-[14px] font-medium text-[#4A5565]">
                Confirm New Password
              </label>
              <div
                className={`mt-2 flex h-11 items-center rounded-sm border px-3 focus-within:border-[var(--color-primary)] ${
                  pwForm.confirmPassword &&
                  pwForm.confirmPassword !== pwForm.newPassword
                    ? 'border-red-400'
                    : 'border-[#CACACA]'
                }`}
              >
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={pwForm.confirmPassword}
                  onChange={e =>
                    setPwForm(prev => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none"
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)}>
                  {showConfirm ? (
                    <EyeOff className="size-4 text-[#6B7280]" />
                  ) : (
                    <Eye className="size-4 text-[#6B7280]" />
                  )}
                </button>
              </div>
            </div>

            {/* Password rules */}
            {pwForm.newPassword.length > 0 && (
              <ul className="mt-5 space-y-1.5 text-[13px]">
                {ruleResults.map((rule, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-2 ${rule.passed ? 'text-[#14B88A]' : 'text-[#E53935]'}`}
                  >
                    {rule.passed ? (
                      <Check className="size-4 shrink-0" />
                    ) : (
                      <X className="size-4 shrink-0" />
                    )}
                    {rule.label}
                  </li>
                ))}
              </ul>
            )}

            {/* Buttons */}
            <div className="mt-8 flex justify-end gap-4">
              <button
                type="button"
                onClick={() =>
                  setPwForm({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  })
                }
                className="h-11 rounded-md border border-red-400 px-6 text-[14px] font-medium text-red-500 transition hover:bg-red-50"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={handlePasswordSave}
                disabled={savingPw}
                className="h-11 rounded-md bg-[#063D5B] px-6 text-[14px] font-bold text-white transition hover:bg-[var(--color-primary)] disabled:opacity-60"
              >
                {savingPw ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
