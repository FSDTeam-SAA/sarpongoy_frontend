'use client'

import { axiosInstance } from '@/lib/axios'

export interface SchoolAccessUser {
  _id?: string
  schoolName?: string | { _id?: string; name?: string }
}

export interface SchoolAccessDetails {
  _id?: string
  name?: string
  subscribePrice?: number
  NDA?: string
  school?: Array<string | { _id?: string }>
}

interface SchoolPaymentAccess {
  hasAccess?: boolean
}

export function getAssignedSchoolId(user?: SchoolAccessUser | null) {
  const schoolName = user?.schoolName
  if (!schoolName) return ''
  return typeof schoolName === 'object' ? schoolName._id || '' : schoolName
}

export function schoolIncludesUser(
  school?: SchoolAccessDetails | null,
  userId?: string,
) {
  if (!school?.school?.length || !userId) return false

  return school.school.some(member => {
    const memberId = typeof member === 'string' ? member : member._id
    return memberId === userId
  })
}

export async function getAssignedSchoolAccess(user?: SchoolAccessUser | null) {
  const schoolId = getAssignedSchoolId(user)
  if (!schoolId) return { school: null, isActive: false }

  const [schoolRes, accessRes] = await Promise.all([
    axiosInstance.get(`/school/${schoolId}`),
    axiosInstance.get(`/payment/school/${schoolId}/access`),
  ])
  const school = (schoolRes.data?.data || null) as SchoolAccessDetails | null
  const access = (accessRes.data?.data || {}) as SchoolPaymentAccess

  return {
    school,
    isActive: Boolean(access.hasAccess),
  }
}
