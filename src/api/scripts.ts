import { request } from './client'
import type { Script } from '../types'

export function getScripts(filters: { difficulty?: string; genre?: number } = {}) {
  const params = new URLSearchParams()
  if (filters.difficulty) params.set('difficulty', filters.difficulty)
  if (filters.genre !== undefined) params.set('genre', String(filters.genre))
  const qs = params.toString()
  return request<Script[]>(`/scripts${qs ? `?${qs}` : ''}`)
}

export function getScript(id: number) {
  return request<Script>(`/scripts/${id}`)
}

export function createScript(data: FormData) {
  return request<Script>('/scripts', { method: 'POST', body: data })
}
