import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getUserProfile } from '../api/users'
import type { PublicProfile } from '../types'
import { EVENT_STATUS_LABELS as STATUS_LABELS } from '../utils/labels'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-TW', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export default function UserProfilePage() {
  const { handle } = useParams<{ handle: string }>()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!handle) return
    getUserProfile(handle)
      .then(setProfile)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [handle])

  if (loading) return <div className="text-center text-gray-400 py-16">載入中...</div>
  if (notFound || !profile) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">找不到此用戶</p>
        <Link to="/" className="text-sm text-brand hover:underline">回首頁</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-surface border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.nickname)}&background=random`}
            className="w-16 h-16 rounded-full object-cover border border-gray-200"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-0.5">{profile.nickname}</h1>
            <p className="text-sm text-gray-400">@{profile.handle}</p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="font-semibold text-gray-700 mb-3">主辦的活動</h2>
        {!profile.hosted_events ? (
          <p className="text-sm text-gray-400">此用戶尚未公開活動資訊</p>
        ) : profile.hosted_events.length === 0 ? (
          <p className="text-sm text-gray-400">目前沒有即將舉辦的活動</p>
        ) : (
          <div className="space-y-2">
            {profile.hosted_events.map(e => (
              <Link key={e.id} to={`/events/${e.id}`}
                className="flex items-center justify-between p-3 bg-surface border border-gray-200 rounded-md hover:border-brand-light hover:shadow-sm transition-all">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">{e.script.title}</div>
                  <div className="text-xs text-gray-400 truncate">{formatDate(e.scheduled_at)}・{e.location}</div>
                </div>
                <span className="text-xs text-gray-500 ml-2 shrink-0">
                  {STATUS_LABELS[e.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
