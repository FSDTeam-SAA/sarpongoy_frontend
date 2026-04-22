'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AuthLogo from '@/components/auth/AuthLogo'
import AuthShell from '@/components/auth/AuthShell'
import { axiosInstance } from '@/lib/axios'
import { setToken, setUser } from '@/lib/auth-helpers'
import { toast } from 'sonner'

interface UserData {
  _id: string
  email: string
  role: string
  subscription?: string
  profilePicture?: string
  schoolName?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Pre-fill remembered email if stored
    const remembered = localStorage.getItem('ilearn_remembered_email')
    if (remembered && emailRef.current) {
      emailRef.current.value = remembered
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = emailRef.current?.value?.trim() || ''
    const password = passwordRef.current?.value || ''

    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }

    setLoading(true)
    try {
      const res = await axiosInstance.post('/auth/login', { email, password })
      const { accessToken, user } = res.data.data as { accessToken: string; user: UserData }

      setToken(accessToken)
      setUser(user)

      if (rememberMe) {
        localStorage.setItem('ilearn_remembered_email', email)
      } else {
        localStorage.removeItem('ilearn_remembered_email')
      }

      toast.success('Logged in successfully!')

      // Redirect based on subscription
      if (user.subscription) {
        router.push('/profile')
      } else {
        router.push('/purchase-plan')
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <AuthLogo />

      <div className="mt-8 rounded-2xl border border-[#E5E7EB] bg-white px-6 py-7 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:px-8">
        <h1 className="text-center text-[32px] font-bold leading-[40px] tracking-[0]">
          iLearnReady School Portal
        </h1>
        <p className="mt-3 text-center text-[17px] font-normal leading-[26px] tracking-[0] text-[#6B7280]">
          Partner schools can access their accounts below
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-[15px] font-bold leading-none tracking-[0]" htmlFor="email">
              School Email Address
            </label>
            <input
              ref={emailRef}
              id="email"
              type="email"
              placeholder="Enter your email address"
              required
              className="mt-2 h-12 w-full rounded-sm border border-[#6E7D8C] px-4 text-[15px] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-[15px] font-bold leading-none tracking-[0]" htmlFor="password">
              Password
            </label>
            <div className="mt-2 flex h-12 items-center rounded-sm border border-[#6E7D8C] px-4 focus-within:border-[var(--color-primary)]">
              <input
                ref={passwordRef}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                required
                className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none"
              />
              <button type="button" onClick={() => setShowPassword(p => !p)}>
                {showPassword ? <EyeOff className="size-4 text-[#6B7280]" /> : <Eye className="size-4 text-[#6B7280]" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[14px] leading-none">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              Remember Me
            </label>
            <Link href="/forgot-password" className="hover:text-[var(--color-primary)]">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-sm bg-[#063D5B] text-[15px] font-bold leading-none text-white transition hover:bg-[var(--color-primary)] disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-[14px] leading-none">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-bold text-[#6A9D23] hover:underline">
            Sign Up Here
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
