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
    Calendar,
    Download,
    ChevronLeft,
    ChevronRight,
    Ellipsis,
} from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import { axiosInstance } from '@/lib/axios'
import { getToken, getUser, setUser, logout } from '@/lib/auth-helpers'
import { normalizeSchoolNameValue, resolveSchoolName, withCacheBuster } from '@/lib/school'
import { toast } from 'sonner'

interface PasswordRule {
    label: string
    test: (pw: string) => boolean
}

const passwordRules: PasswordRule[] = [
    { label: 'Minimum 8–12 characters (recommend 12+ for stronger security).', test: pw => pw.length >= 8 },
    { label: 'At least one uppercase letter must.', test: pw => /[A-Z]/.test(pw) },
    { label: 'At least one lowercase letter must.', test: pw => /[a-z]/.test(pw) },
    { label: 'At least one number must (0–9).', test: pw => /\d/.test(pw) },
    { label: 'At least special character (! @ # $ % ^ & * etc.).', test: pw => /[!@#$%^&*]/.test(pw) },
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
    subscriptionExpiry?: string
    studentList?: unknown[]
    schoolName?: string | { name?: string }
    subscription?: string
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

const STUDENTS_PER_PAGE = 10

const PLAN_LABELS: Record<number, string> = {
    50: 'Starter Plan',
    150: 'Growth Plan',
    300: 'Pro Plan',
    750: 'Campus Plan',
}

function getPlanLabel(capacity: number) {
    if (!capacity) return 'Plan not set'
    return PLAN_LABELS[capacity] || 'Custom Plan'
}

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
        return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages]
}

export default function ProfilePage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'info' | 'password'>('info')
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [students, setStudents] = useState<StudentRow[]>([])
    const [studentMeta, setStudentMeta] = useState<StudentMeta>({ page: 1, limit: STUDENTS_PER_PAGE, total: 0 })
    const [loadingStudents, setLoadingStudents] = useState(false)
    const [uploadingStudents, setUploadingStudents] = useState(false)

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
    const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
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
            const resolvedSchoolName = await resolveSchoolName(data.schoolName)
            const normalizedProfile = {
                ...data,
                schoolName: normalizeSchoolNameValue(data.schoolName, resolvedSchoolName),
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

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setSchoolLogo(file)
        setLogoPreview(URL.createObjectURL(file))
    }

    const handleInfoSave = async () => {
        if (!form.phoneNumber.trim() && !form.bio.trim() && !schoolLogo && !signature) {
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
            const resolvedSchoolName = await resolveSchoolName(mergedProfile.schoolName)
            const normalizedProfile = {
                ...mergedProfile,
                schoolName: normalizeSchoolNameValue(mergedProfile.schoolName, resolvedSchoolName),
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
            if (storedUser) setUser({ ...(storedUser as object), ...normalizedProfile })
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

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A'
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const planCapacity = profile?.totalStudent ?? 0
    const usedStudents = profile?.studentList?.length ?? 0
    const usagePercent = planCapacity > 0 ? Math.min(100, Math.round((usedStudents / planCapacity) * 100)) : 0
    const isAtCapacity = planCapacity > 0 && usedStudents >= planCapacity

    const fetchStudents = useCallback(async (page = 1) => {
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
            const error = err as { response?: { status?: number; data?: { message?: string } } }
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
    }, [router])

    useEffect(() => {
        if (loading || activeTab !== 'info') return
        fetchStudents(1)
    }, [activeTab, fetchStudents, loading])

    const handleDemoUpload = async (file: File) => {
        if (isAtCapacity) {
            toast.warning('You have reached your student limit. Please upgrade your plan.')
            router.push('/purchase-plan')
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
            toast.error(error?.response?.data?.message || 'Failed to replace student list')
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
            <div className="fixed inset-x-0 top-[70px] z-40 bg-[#E8EAF0] px-6 py-2 text-xs text-[#6B7280] shadow-sm">
                {activeTab === 'info' ? 'Personal Information' : 'Change Password'}
            </div>

            <div className="pt-[calc(70px+36px)] pb-10 px-4 sm:px-8 lg:px-[90px]">
                {/* Tabs */}
                <div className="mt-6 inline-flex rounded-md border border-[#E5E7EB] bg-white text-[14px]">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`px-6 py-2.5 font-medium transition rounded-l-md ${activeTab === 'info'
                            ? 'bg-[#063D5B] text-white'
                            : 'text-[#6B7280] hover:bg-[#F8FAFC]'
                            }`}
                    >
                        Personal Information
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        className={`px-6 py-2.5 font-medium transition rounded-r-md ${activeTab === 'password'
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
                                    <h1 className="text-[22px] font-bold text-[#111]">School Information</h1>
                                    <p className="mt-1 text-[14px] text-[#6B7280]">Manage your school information and profile details.</p>
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
                                    <span className="text-[12px] text-[#6B7280]">Upload logo</span>
                                    <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                                </div>

                                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] p-4">
                                    <Calendar className="size-6 text-[#063D5B]" />
                                    <p className="text-[16px] font-bold text-[#111]">{formatDate(profile?.subscriptionExpiry)}</p>
                                    <p className="text-[12px] text-[#6B7280]">Expired Date</p>
                                </div>

                                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] p-4">
                                    <p className="text-[14px] font-semibold text-[#6B7280]">Total Students</p>
                                    <p className="text-[28px] font-bold text-[var(--color-primary)]">{profile?.totalStudent ?? 0}</p>
                                </div>

                                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#063D5B] p-4">
                                    <p className="text-[14px] font-semibold text-white">Total Paid -</p>
                                    <p className="text-[28px] font-bold text-white">{profile?.studentList?.length ?? 0}</p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="text-[14px] font-medium text-[#4A5565]">School Name</label>
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
                                        <label className="text-[14px] font-medium text-[#4A5565]">School Email</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            readOnly
                                            className="mt-1 h-11 w-full rounded-sm border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-[14px] text-[#6B7280] outline-none"
                                            placeholder="Email"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[14px] font-medium text-[#4A5565]">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={form.phoneNumber}
                                            onChange={e => setForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                            className="mt-1 h-11 w-full rounded-sm border border-[#E5E7EB] bg-white px-3 text-[14px] outline-none focus:border-[var(--color-primary)]"
                                            placeholder="+1 (555) 123-4567"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[14px] font-medium text-[#4A5565]">Bio</label>
                                    <textarea
                                        value={form.bio}
                                        onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                                        rows={4}
                                        className="mt-1 w-full resize-none rounded-sm border border-[#E5E7EB] bg-white px-3 py-3 text-[14px] outline-none focus:border-[var(--color-primary)]"
                                        placeholder="Tell about your school..."
                                    />
                                </div>

                                <div>
                                    <label className="text-[14px] font-medium text-[#4A5565]">Signature</label>
                                    <div
                                        className="relative mt-1 flex h-11 cursor-pointer items-center justify-between rounded-sm border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#6B7280] hover:border-[var(--color-primary)]"
                                        onClick={() => signatureRef.current?.click()}
                                    >
                                        <span>{signature ? signature.name : profile?.uploadeSignature ? 'Signature uploaded' : 'Upload signature'}</span>
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

                        <div className="rounded-xl bg-gradient-to-r from-[#063D5B] to-[#0C6AA0] p-6 text-white shadow-sm">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                <div className="max-w-2xl">
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">
                                        Subscription Capacity
                                    </p>
                                    <h2 className="mt-2 text-[22px] font-bold">
                                        {getPlanLabel(planCapacity)}
                                    </h2>
                                    <p className="mt-2 text-[14px] leading-6 text-white/80">
                                        {usedStudents} of {planCapacity || 0} students used
                                        {' '}
                                        <span className="text-white/60">
                                            {profile?.subscriptionExpiry
                                                ? `- Expires ${formatDate(profile.subscriptionExpiry)}`
                                                : '- No expiry set'}
                                        </span>
                                    </p>
                                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
                                        <div
                                            className="h-full rounded-full bg-white transition-all"
                                            style={{ width: `${usagePercent}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => router.push('/purchase-plan')}
                                        className={`inline-flex h-11 items-center justify-center rounded-md px-5 text-[14px] font-bold transition ${isAtCapacity
                                            ? 'bg-[#F97316] text-white hover:bg-[#EA580C]'
                                            : 'bg-white text-[#063D5B] hover:bg-[#E6EEF5]'
                                            }`}
                                    >
                                        {isAtCapacity ? 'Limit reached - Upgrade' : 'Upgrade Plan'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <h2 className="text-[22px] font-bold text-[#111]">Added Students</h2>
                                    <p className="mt-1 text-[14px] text-[#6B7280]">
                                        Download the demo file, upload your students, and review imported records below.
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
                                                toast.warning('You have reached your student limit. Please upgrade your plan.')
                                                router.push('/purchase-plan')
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
                                                    <td className="px-6 py-10 text-center text-[#6B7280]" colSpan={5}>
                                                        Loading student records...
                                                    </td>
                                                </tr>
                                            ) : students.length ? (
                                                students.map(student => (
                                                    <tr key={student._id || `${student.studentId}-${student.firstName}`}>
                                                        <td className="border-t border-[#E5E7EB] px-6 py-4">{student.schoolName}</td>
                                                        <td className="border-t border-[#E5E7EB] px-6 py-4">{student.lastName}</td>
                                                        <td className="border-t border-[#E5E7EB] px-6 py-4">{student.firstName}</td>
                                                        <td className="border-t border-[#E5E7EB] px-6 py-4">{student.studentId}</td>
                                                        <td className="border-t border-[#E5E7EB] px-6 py-4">{student.gradeLevel}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td className="px-6 py-10 text-center text-[#6B7280]" colSpan={5}>
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
                                        {studentMeta.total ? (studentMeta.page - 1) * studentMeta.limit + 1 : 0}{' '}
                                        to {Math.min(studentMeta.page * studentMeta.limit, studentMeta.total)} of{' '}
                                        {studentMeta.total} results
                                    </p>

                                    {Math.ceil(studentMeta.total / studentMeta.limit) > 1 && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => fetchStudents(Math.max(1, studentMeta.page - 1))}
                                                disabled={studentMeta.page <= 1 || loadingStudents}
                                                className="inline-flex size-8 items-center justify-center rounded-sm border border-[#CBD5E1] bg-white text-[#6B7280] transition hover:border-[#94A3B8] hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
                                                aria-label="Previous page"
                                            >
                                                <ChevronLeft className="size-4" />
                                            </button>

                                            {buildPaginationItems(studentMeta.page, Math.ceil(studentMeta.total / studentMeta.limit)).map((item, index) =>
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
                                                        className={`inline-flex h-8 min-w-8 items-center justify-center rounded-sm border px-2 text-[14px] transition ${item === studentMeta.page
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
                                                onClick={() => fetchStudents(Math.min(Math.ceil(studentMeta.total / studentMeta.limit), studentMeta.page + 1))}
                                                disabled={studentMeta.page >= Math.ceil(studentMeta.total / studentMeta.limit) || loadingStudents}
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
                        <h1 className="text-[22px] font-bold text-[#111]">Change Password</h1>
                        <p className="mt-1 text-[14px] text-[#6B7280]">
                            Manage your account preferences, security settings, and privacy options.
                        </p>

                        <div className="mt-8 grid gap-4 md:grid-cols-2">
                            {/* Current Password */}
                            <div>
                                <label className="text-[14px] font-medium text-[#4A5565]">Current Password</label>
                                <div className="mt-2 flex h-11 items-center rounded-sm border border-[#CACACA] px-3 focus-within:border-[var(--color-primary)]">
                                    <input
                                        type={showOld ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={pwForm.oldPassword}
                                        onChange={e => setPwForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                                        className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none"
                                    />
                                    <button type="button" onClick={() => setShowOld(p => !p)}>
                                        {showOld ? <EyeOff className="size-4 text-[#6B7280]" /> : <Eye className="size-4 text-[#6B7280]" />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="text-[14px] font-medium text-[#4A5565]">New Password</label>
                                <div className="mt-2 flex h-11 items-center rounded-sm border border-[#CACACA] px-3 focus-within:border-[var(--color-primary)]">
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={pwForm.newPassword}
                                        onChange={e => setPwForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                        className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none"
                                    />
                                    <button type="button" onClick={() => setShowNew(p => !p)}>
                                        {showNew ? <EyeOff className="size-4 text-[#6B7280]" /> : <Eye className="size-4 text-[#6B7280]" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Confirm New Password */}
                        <div className="mt-4 max-w-[50%] pr-2">
                            <label className="text-[14px] font-medium text-[#4A5565]">Confirm New Password</label>
                            <div
                                className={`mt-2 flex h-11 items-center rounded-sm border px-3 focus-within:border-[var(--color-primary)] ${pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword
                                    ? 'border-red-400'
                                    : 'border-[#CACACA]'
                                    }`}
                            >
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={pwForm.confirmPassword}
                                    onChange={e => setPwForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none"
                                />
                                <button type="button" onClick={() => setShowConfirm(p => !p)}>
                                    {showConfirm ? <EyeOff className="size-4 text-[#6B7280]" /> : <Eye className="size-4 text-[#6B7280]" />}
                                </button>
                            </div>
                        </div>

                        {/* Password rules */}
                        {pwForm.newPassword.length > 0 && (
                            <ul className="mt-5 space-y-1.5 text-[13px]">
                                {ruleResults.map((rule, i) => (
                                    <li key={i} className={`flex items-center gap-2 ${rule.passed ? 'text-[#14B88A]' : 'text-[#E53935]'}`}>
                                        {rule.passed ? <Check className="size-4 shrink-0" /> : <X className="size-4 shrink-0" />}
                                        {rule.label}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Buttons */}
                        <div className="mt-8 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' })}
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
