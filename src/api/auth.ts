import { request } from './client'
import type { AuthResponse, SsoPendingResponse } from '../types'

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

export function ssoGoogle(idToken: string) {
  return request<AuthResponse | SsoPendingResponse>('/auth/sso/google', {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken }),
  })
}

export function ssoLine(code: string, redirectUri: string) {
  return request<AuthResponse | SsoPendingResponse>('/auth/sso/line', {
    method: 'POST',
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  })
}

export function ssoRegister(tempToken: string, gender: string, nickname: string) {
  return request<AuthResponse>('/auth/sso/register', {
    method: 'POST',
    body: JSON.stringify({ temp_token: tempToken, gender, nickname }),
  })
}
