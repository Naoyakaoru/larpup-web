import { request } from './client'
import type { AuthResponse } from '../types'

export function register(email: string, password: string, passwordConfirmation: string, nickname: string, gender: string) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, password_confirmation: passwordConfirmation, nickname, gender }),
  })
}

export function login(email: string, password: string) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function logout() {
  return request<{ message: string }>('/auth/logout', { method: 'DELETE' })
}
