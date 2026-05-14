import { request } from './client'

export type ConsentType = 'privacy_policy' | 'terms_of_service' | 'marketing' | 'cookies' | 'ai_features' | 'other'

export interface UserConsent {
  id: number
  consent_type: ConsentType
  consent_version: string
  accepted: boolean
  accepted_at: string
  source: string | null
  ip_address: string | null
}

export interface RecordConsentParams {
  consent_type: ConsentType
  consent_version: string
  accepted?: boolean
  source?: string
}

export function recordConsent(params: RecordConsentParams) {
  return request<UserConsent>('/user_consents', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export function listConsents() {
  return request<UserConsent[]>('/user_consents')
}
