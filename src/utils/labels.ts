import type { Event, EventMember, Script } from '../types'

export const EVENT_STATUS_LABELS: Record<Event['status'], string> = {
  recruiting: '招募中',
  full: '已滿員',
  completed: '已完成',
  cancelled: '已取消',
}

export const EVENT_STATUS_COLORS: Record<Event['status'], string> = {
  recruiting: 'bg-green-100 text-green-700',
  full: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-500',
}

export const DIFFICULTY_LABELS: Record<Script['difficulty'], string> = {
  easy: '入門',
  medium: '進階',
  hard: '重度',
}

export const DIFFICULTY_COLORS: Record<Script['difficulty'], string> = {
  easy: 'bg-blue-100 text-blue-700',
  medium: 'bg-orange-100 text-orange-700',
  hard: 'bg-red-100 text-red-700',
}

export const DIFFICULTY_OPTIONS: { value: Script['difficulty']; label: string }[] = [
  { value: 'easy', label: '入門' },
  { value: 'medium', label: '進階' },
  { value: 'hard', label: '重度' },
]

export const MEMBER_STATUS_LABELS: Record<EventMember['status'], string> = {
  pending: '待審核',
  confirmed: '已確認',
  rejected: '已拒絕',
  cancelled: '已取消',
  leave_requested: '申請退出',
}

export const GENRES: [number, string][] = [
  [0, '推理'], [1, '還原'], [2, '恐怖'], [3, '情感'],
  [4, '歡樂'], [5, '機制'], [6, '陣營'], [7, '古風'], [8, '現代'],
]

export const GENRE_LABELS: Record<number, string> = Object.fromEntries(GENRES)

export const GENRE_BY_LABEL: Record<string, number> = Object.fromEntries(
  GENRES.map(([id, label]) => [label, id])
)
