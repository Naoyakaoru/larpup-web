import { request } from './client'
import type { Script } from '../types'

export function getScripts(filters: { difficulty?: string; genres?: number[]; q?: string; page?: number } = {}) {
  const params = new URLSearchParams()
  if (filters.difficulty) params.set('difficulty', filters.difficulty)
  if (filters.genres?.length) params.set('genres', filters.genres.join(','))
  if (filters.q) params.set('q', filters.q)
  if (filters.page) params.set('page', String(filters.page))
  const qs = params.toString()
  return request<{ scripts: Script[]; has_more: boolean }>(`/scripts${qs ? `?${qs}` : ''}`)
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

export function getAdminScripts(params: { page?: number; q?: string } = {}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.q) searchParams.set('q', params.q)
  const qs = searchParams.toString()
  return request<{ scripts: Script[]; total: number; page: number; total_pages: number; pending_count: number }>(`/admin/scripts${qs ? `?${qs}` : ''}`)
}

export function approveScript(id: number) {
  return request<Script>(`/admin/scripts/${id}/approve`, { method: 'PATCH' })
}

export function rejectScript(id: number) {
  return request<Script>(`/admin/scripts/${id}/reject`, { method: 'PATCH' })
}

export function importScriptCover(id: number) {
  return request<Script>(`/admin/scripts/${id}/cover_import`, { method: 'POST' })
}

export function scriptAutofill(title: string) {
  return request<{
    qiandao_id: string
    title: string
    difficulty: 'easy' | 'medium' | 'hard'
    genres: number[]
    male_slots: number
    female_slots: number
    any_slots: number
    duration: number | null
    description: string
    publisher: string
    cover_image_id: string
    key_property: string
  }>(`/admin/scripts/autofill?title=${encodeURIComponent(title)}`)
}

export function adminDeleteScript(id: number) {
  return request<void>(`/admin/scripts/${id}`, { method: 'DELETE' })
}

export function adminDeleteScriptCover(id: number) {
  return request<Script>(`/admin/scripts/${id}/cover_delete`, { method: 'DELETE' })
}

export interface BulkImportRow {
  qiandao_id?: string | null
  rating?: string | null
  cover_image_id?: string | null
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
  return request<{ created: number; skipped: number; errors: { index: number; title: string; messages: string[] }[] }>(
    '/admin/scripts/bulk_import',
    { method: 'POST', body: JSON.stringify({ scripts }) },
  )
}
