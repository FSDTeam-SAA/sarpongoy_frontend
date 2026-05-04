'use client'

const TOKEN_KEY = 'ilearn_access_token'
const USER_KEY = 'ilearn_user'
export const USER_UPDATED_EVENT = 'ilearn-user-updated'
export const AUTH_CHANGED_EVENT = 'ilearn-auth-changed'

function dispatchClientEvent(eventName: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(eventName))
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  dispatchClientEvent(AUTH_CHANGED_EVENT)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  dispatchClientEvent(AUTH_CHANGED_EVENT)
}

export function getUser<T = Record<string, unknown>>(): T | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function setUser(user: unknown): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  dispatchClientEvent(USER_UPDATED_EVENT)
}

export function removeUser(): void {
  localStorage.removeItem(USER_KEY)
  dispatchClientEvent(USER_UPDATED_EVENT)
}

export function logout(): void {
  removeToken()
  removeUser()
}

export function isLoggedIn(): boolean {
  return !!getToken()
}
