import { request } from './client'
import type { User, Event, PublicProfile } from '../types'

export function getMe() {
  return request<User>('/users/me')
}

export function updateMe(data: FormData | {
  nickname?: string
  handle?: string
  password?: string
  password_confirmation?: string
  show_hosted_events?: boolean
}) {
  return request<User>('/users/me', {
    method: 'PATCH',
    body: data instanceof FormData ? data : JSON.stringify(data),
  })
}

export function getMyEvents() {
  return request<{ hosted: Event[]; joined: Event[] }>('/users/me/events')
}

export function getUserProfile(handle: string) {
  return request<PublicProfile>(`/users/${handle}`)
}

export function searchUsers(q: string) {
  return request<User[]>(`/users/search?q=${encodeURIComponent(q)}`)
}

export function getMyStores() {
  return request<{ id: number; name: string; status: string; role: string }[]>('/users/me/stores')
}
