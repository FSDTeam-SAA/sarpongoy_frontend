'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Eye, EyeOff, Check, X, Upload, Calendar } from 'lucide-react'
import Navbar from '@/components/shared/Navbar'
import { axiosInstance } from '@/lib/axios'
import { getToken, getUser, setUser, logout } from '@/lib/auth-helpers'
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

export default function ProfilePage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'info' | 'password'>('info')
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    // Personal info form state
    const [form, setForm] = useState({
        phoneNumber: '',
        bio: '',
        email: '',
        schoolNameDisplay: '',
    })
    const [schoolLogo, setSchoolLogo] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [signature, setSignature] = useState<File | null>(null)
    const [savingInfo, setSavingInfo] = useState(false)
    const logoRef = useRef<HTMLInputElement>(null)
    const signatureRef = useRef<HTMLInputElement>(null)

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
            setProfile(data)
            setForm({
                phoneNumber: data.phoneNumber || '',
                bio: data.bio || '',
                email: data.email || '',
                schoolNameDisplay: typeof data.schoolName === 'object'
                    ? data.schoolName?.name || ''
                    : data.schoolName || '',
            })
            if (data.schoolLogo) setLogoPreview(data.schoolLogo)
            // Also refresh user in localStorage
            const storedUser = getUser()
            if (storedUser) {
                setUser({ ...(storedUser as object), ...data })
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
            setProfile(mergedProfile)
            setForm({
                phoneNumber: mergedProfile.phoneNumber || '',
                bio: mergedProfile.bio || '',
                email: mergedProfile.email || '',
                schoolNameDisplay: typeof mergedProfile.schoolName === 'object'
                    ? mergedProfile.schoolName?.name || ''
                    : mergedProfile.schoolName || '',
            })
            if (mergedProfile.schoolLogo) setLogoPreview(mergedProfile.schoolLogo)
            setSchoolLogo(null)
            setSignature(null)
            const storedUser = getUser()
            if (storedUser) setUser({ ...(storedUser as object), ...mergedProfile })
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
                    <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
                        {/* Header row */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-[22px] font-bold text-[#111]">School Information</h1>
                                <p className="mt-1 text-[14px] text-[#6B7280]">Manage your school information and profile details.</p>
                            </div>
                        </div>

                        {/* Stats cards row */}
                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
                            {/* Logo upload */}
                            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] p-4">
                                <button
                                    type="button"
                                    onClick={() => logoRef.current?.click()}
                                    className="relative flex size-20 items-center justify-center overflow-hidden rounded-full bg-[#F3F4F6] transition hover:opacity-80"
                                >
                                    {logoPreview ? (
                                        <Image src={logoPreview} alt="Logo" fill className="object-cover" />
                                    ) : (
                                        <Upload className="size-6 text-[#9CA3AF]" />
                                    )}
                                </button>
                                <span className="text-[12px] text-[#6B7280]">Upload logo</span>
                                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                            </div>

                            {/* Expiry date */}
                            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] p-4">
                                <Calendar className="size-6 text-[#063D5B]" />
                                <p className="text-[16px] font-bold text-[#111]">{formatDate(profile?.subscriptionExpiry)}</p>
                                <p className="text-[12px] text-[#6B7280]">Expired Date</p>
                            </div>

                            {/* Total students */}
                            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] p-4">
                                <p className="text-[14px] font-semibold text-[#6B7280]">Total Students</p>
                                <p className="text-[28px] font-bold text-[var(--color-primary)]">{profile?.totalStudent ?? 0}</p>
                            </div>

                            {/* Total paid (student list length) */}
                            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#063D5B] p-4">
                                <p className="text-[14px] font-semibold text-white">Total Paid -</p>
                                <p className="text-[28px] font-bold text-white">{profile?.studentList?.length ?? 0}</p>
                            </div>
                        </div>

                        {/* Form fields */}
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
                                    className="mt-1 flex h-11 cursor-pointer items-center justify-between rounded-sm border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#6B7280] hover:border-[var(--color-primary)] relative"
                                    onClick={() => signatureRef.current?.click()}
                                >
                                    <span>{signature ? signature.name : profile?.uploadeSignature ? 'Signature uploaded' : 'Upload signature'}</span>
                                    <Upload className="size-4" />
                                    <input
                                        ref={signatureRef}
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={e => setSignature(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save button */}
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
