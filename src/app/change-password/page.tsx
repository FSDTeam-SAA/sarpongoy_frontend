'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import AuthShell from '@/components/auth/AuthShell'
import { axiosInstance } from '@/lib/axios'
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

export default function ChangePasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const ruleResults = useMemo(() =>
    passwordRules.map(rule => ({ ...rule, passed: rule.test(newPassword) })),
    [newPassword]
  )

  const allPassed = ruleResults.every(r => r.passed)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const email = sessionStorage.getItem('reset_email') || ''
    if (!email) {
      toast.error('Session expired. Please restart forgot password flow.')
      router.push('/forgot-password')
      return
    }

    if (!allPassed) {
      toast.error('Password does not meet all requirements')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await axiosInstance.post('/auth/reset-password', { email, newPassword })
      sessionStorage.removeItem('reset_email')
      toast.success('Password changed successfully! Please login.')
      router.push('/login')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-7 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:px-8">
        <h1 className="text-[26px] font-bold leading-[34px] tracking-[0] text-[var(--color-primary)] sm:text-[32px] sm:leading-[40px]">
          Change Password
        </h1>
        <p className="mt-3 text-[15px] font-normal leading-[24px] tracking-[0] text-[#6B7280] sm:text-[17px] sm:leading-[26px]">
          Enter your new password below
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-[15px] font-normal leading-none">Create New Password</label>
            <div className="mt-2 flex h-12 items-center rounded-sm border border-[#8D8D8D] px-4 focus-within:border-[var(--color-primary)]">
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none"
              />
              <button type="button" onClick={() => setShowNew(p => !p)}>
                {showNew ? <EyeOff className="size-4 text-[#6B7280]" /> : <Eye className="size-4 text-[#6B7280]" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[15px] font-normal leading-none">Confirm New Password</label>
            <div className="mt-2 flex h-12 items-center rounded-sm border border-[#8D8D8D] px-4 focus-within:border-[var(--color-primary)]">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none"
              />
              <button type="button" onClick={() => setShowConfirm(p => !p)}>
                {showConfirm ? <EyeOff className="size-4 text-[#6B7280]" /> : <Eye className="size-4 text-[#6B7280]" />}
              </button>
            </div>
          </div>

          {newPassword.length > 0 && (
            <ul className="space-y-1.5 text-[14px]">
              {ruleResults.map((rule, i) => (
                <li key={i} className={`flex items-center gap-2 ${rule.passed ? 'text-[#14B88A]' : 'text-[#E53935]'}`}>
                  {rule.passed ? <Check className="size-4 shrink-0" /> : <X className="size-4 shrink-0" />}
                  {rule.label}
                </li>
              ))}
            </ul>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-sm bg-[var(--color-primary)] text-[15px] font-bold leading-none text-white transition hover:bg-[#063D5B] disabled:opacity-60"
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </AuthShell>
  )
}
