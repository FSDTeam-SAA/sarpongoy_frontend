import { axiosInstance } from '@/lib/axios'

export type SchoolNameValue =
  | string
  | {
      _id?: string
      name?: string
    }
  | null
  | undefined

export function isMongoObjectId(value?: string | null): boolean {
  return Boolean(value && /^[a-fA-F0-9]{24}$/.test(value.trim()))
}

export async function resolveSchoolName(schoolName: SchoolNameValue): Promise<string> {
  if (!schoolName) return ''

  if (typeof schoolName === 'object') {
    return schoolName.name?.trim() || ''
  }

  const trimmedSchoolName = schoolName.trim()
  if (!trimmedSchoolName) return ''

  if (!isMongoObjectId(trimmedSchoolName)) {
    return trimmedSchoolName
  }

  try {
    const response = await axiosInstance.get(`/school/${trimmedSchoolName}`)
    return response.data?.data?.name?.trim() || trimmedSchoolName
  } catch {
    return trimmedSchoolName
  }
}

export function normalizeSchoolNameValue(
  schoolName: SchoolNameValue,
  resolvedSchoolName: string,
): SchoolNameValue {
  if (!resolvedSchoolName) return schoolName
  return { name: resolvedSchoolName }
}

export function withCacheBuster(url?: string | null, version?: number): string {
  if (!url) return ''

  if (!version) return url

  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${version}`
}
