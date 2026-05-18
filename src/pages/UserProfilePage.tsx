import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getUserProfile } from '../api/users'
import type { PublicProfile } from '../types'
import {
  EVENT_STATUS_LABELS as STATUS_LABELS,
  EVENT_STATUS_COLORS as STATUS_COLORS,
  DIFFICULTY_LABELS,
  GENRE_LABELS,
} from "../utils/labels";
import EventLocation from "../components/EventLocation";
import { formatDate } from '../utils/formatDate'

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
          <div className="grid sm:grid-cols-2 gap-4">
            {profile.hosted_events.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="flex gap-3 bg-surface rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
                <div className="w-[72px] shrink-0">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-100">
                    {event.script.cover_image_url ? (
                      <img
                        src={event.script.cover_image_url}
                        alt={event.script.title}
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                        📖
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h2 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                        {event.script.title}
                      </h2>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${STATUS_COLORS[event.status]}`}
                      >
                        {STATUS_LABELS[event.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {event.script.genres
                        .filter((g) => g >= 15)
                        .map((g) => (
                          <span
                            key={g}
                            className="text-xs bg-amber-100 text-amber-700 font-medium px-1.5 py-0.5 rounded"
                          >
                            {GENRE_LABELS[g]}
                          </span>
                        ))}
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        {DIFFICULTY_LABELS[event.script.difficulty]}
                      </span>
                      {event.script.genres
                        .filter((g) => g < 15)
                        .slice(0, 3)
                        .map((g) => (
                          <span
                            key={g}
                            className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"
                          >
                            {GENRE_LABELS[g]}
                          </span>
                        ))}
                      {event.allow_cross_gender && (
                        <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">
                          反串
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                    <div className="font-medium text-gray-700">
                      {formatDate(event.scheduled_at)}
                    </div>
                    <EventLocation address={event.address} location={event.location} />
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-gray-400">{event.host?.nickname || profile.nickname}</span>
                      {event.slot_parts ? (
                        <span className="text-xs font-medium text-brand bg-brand-light/30 px-2 py-0.5 rounded-full border border-brand/20">
                          缺 {event.slot_parts}
                        </span>
                      ) : (
                        <span className="font-semibold text-gray-800 tabular-nums">
                          {event.confirmed_count}
                          <span className="font-normal text-gray-400">
                            /{event.script.total_slots} 人
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
