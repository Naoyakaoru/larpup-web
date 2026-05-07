import { request } from './client'
import type { Store } from '../types'

export function getStores() {
  return request<Store[]>('/stores')
}

export function getAdminStores() {
  return request<Store[]>('/admin/stores')
}

export function createStore(data: { name: string; owner_id: number }) {
  return request<Store>('/admin/stores', { method: 'POST', body: JSON.stringify(data) })
}

export interface StoreScriptVersion {
  id: number
  script: { id: number; title: string; difficulty: string; total_slots: number; status: string }
  version_name: string | null
  price: number | null
  available: boolean
  duration_override: number | null
}

export function getStoreScriptVersions(storeId: number) {
  return request<StoreScriptVersion[]>(`/stores/${storeId}/script_versions`)
}

export function updateStoreScriptVersion(storeId: number, versionId: number, data: Partial<Pick<StoreScriptVersion, 'available' | 'price' | 'version_name' | 'duration_override'>>) {
  return request<StoreScriptVersion>(`/stores/${storeId}/script_versions/${versionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

type CreateExistingScript = { script_id: number; price: number; duration_override?: number; version_name?: string }
type CreateNewScript = { title: string; difficulty: string; male_slots: number; female_slots: number; any_slots: number; genres: number[]; duration_override: number; price: number; version_name?: string }

export function createStoreScriptVersion(storeId: number, data: CreateExistingScript | CreateNewScript) {
  return request<StoreScriptVersion>(`/stores/${storeId}/script_versions`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
