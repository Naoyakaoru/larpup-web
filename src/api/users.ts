import { request } from './client'
import type { User, Event } from '../types'

export function getMe() {
  return request<User>('/users/me')
}

export function updateMe(data: FormData | { nickname?: string; password?: string; password_confirmation?: string }) {
  return request<User>('/users/me', {
    method: 'PATCH',
    body: data instanceof FormData ? data : JSON.stringify(data),
  })
}

export function getMyEvents() {
  return request<{ hosted: Event[]; joined: Event[] }>('/users/me/events')
}
