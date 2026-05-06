export interface User {
  id: number
  email: string
  nickname: string
  gender: 'male' | 'female' | 'other'
  avatar_url: string | null
  is_admin: boolean
}

export interface Script {
  id: number
  title: string
  genres: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  male_slots: number
  female_slots: number
  any_slots: number
  total_slots: number
  description: string
  cover_image_url: string | null
}

export interface Event {
  id: number
  script: { id: number; title: string; total_slots: number; male_slots: number; female_slots: number; any_slots: number }
  host: { id: number; nickname: string }
  allow_cross_gender: boolean
  offline_male: number
  offline_female: number
  scheduled_at: string
  location: string
  status: 'recruiting' | 'full' | 'completed' | 'cancelled'
  confirmed_count: number
  available_slots: number
  members?: EventMember[]
}

export interface EventMember {
  id: number
  user: { id: number; nickname: string }
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'leave_requested'
  cross_gender: boolean
}

export interface AuthResponse {
  token: string
  user: User
}
