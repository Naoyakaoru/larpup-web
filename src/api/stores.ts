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
  npc_count: number | null
  gm_count: number | null
  has_food: boolean | null
  has_costume_change: boolean | null
  address_ids: number[]
}

export function getStoreScriptVersions(storeId: number) {
  return request<StoreScriptVersion[]>(`/stores/${storeId}/script_versions`)
}

export function deleteStoreScriptVersion(storeId: number, versionId: number) {
  return request<void>(`/stores/${storeId}/script_versions/${versionId}`, { method: 'DELETE' })
}

export function updateStoreScriptVersion(storeId: number, versionId: number, data: Partial<Pick<StoreScriptVersion, 'available' | 'price' | 'version_name' | 'duration_override' | 'npc_count' | 'gm_count' | 'has_food' | 'has_costume_change'>>) {
  return request<StoreScriptVersion>(`/stores/${storeId}/script_versions/${versionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

type ExtrasFields = { npc_count?: number | null; gm_count?: number | null; has_food?: boolean | null; has_costume_change?: boolean | null }
type AddressField = { address_ids?: number[] }
type CreateExistingScript = { script_id: number; price: number; duration_override?: number; version_name?: string } & ExtrasFields & AddressField
type CreateNewScript = { title: string; difficulty: string; male_slots: number; female_slots: number; any_slots: number; genres: number[]; duration_override: number; price: number; version_name?: string } & ExtrasFields & AddressField

export function createStoreScriptVersion(storeId: number, data: CreateExistingScript | CreateNewScript) {
  return request<StoreScriptVersion>(`/stores/${storeId}/script_versions`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export interface BulkImportVersionRow {
  title: string
  price?: number | null
  duration_override?: number | null
  version_name?: string | null
  npc_count?: number | null
  gm_count?: number | null
  has_food?: boolean | null
  has_costume_change?: boolean | null
}

export function bulkImportStoreScriptVersions(
  storeId: number,
  versions: BulkImportVersionRow[],
) {
  return request<{ created: number; errors: { index: number; title: string; messages: string[] }[] }>(
    `/stores/${storeId}/script_versions/bulk_import`,
    { method: 'POST', body: JSON.stringify({ versions }) },
  )
}
