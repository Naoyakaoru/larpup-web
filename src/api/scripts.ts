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

export function updateScript(id: number, data: FormData) {
  return request<Script>(`/scripts/${id}`, { method: 'PATCH', body: data })
}

export interface ScriptVersion {
  id: number
  version_name: string | null
  price: number | null
  duration: number | null
  store: { id: number; name: string }
}

export function getScriptVersions(scriptId: number) {
  return request<ScriptVersion[]>(`/scripts/${scriptId}/versions`)
}

export function getAdminScripts() {
  return request<Script[]>('/admin/scripts')
}

export function approveScript(id: number) {
  return request<Script>(`/admin/scripts/${id}/approve`, { method: 'PATCH' })
}

export function rejectScript(id: number) {
  return request<Script>(`/admin/scripts/${id}/reject`, { method: 'PATCH' })
}

export interface BulkImportRow {
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  genres: number[]
  male_slots: number
  female_slots: number
  any_slots: number
  duration: number | null
  description: string
  publisher?: string | null
}

export function bulkImportScripts(scripts: BulkImportRow[]) {
  return request<{ created: number; errors: { index: number; title: string; messages: string[] }[] }>(
    '/admin/scripts/bulk_import',
    { method: 'POST', body: JSON.stringify({ scripts }) },
  )
}
