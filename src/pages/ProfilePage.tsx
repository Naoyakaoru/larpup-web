import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyEvents } from '../api/users'
import { useAuth } from '../contexts/AuthContext'
import type { Event } from '../types'

const STATUS_LABELS: Record<Event['status'], string> = {
  recruiting: '招募中', full: '已滿員', completed: '已完成', cancelled: '已取消',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-TW', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [hosted, setHosted] = useState<Event[]>([])
  const [joined, setJoined] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyEvents().then(res => {
      setHosted(res.hosted)
      setJoined(res.joined)
    }).finally(() => setLoading(false))
  }, [])

  function EventList({ events }: { events: Event[] }) {
    if (events.length === 0) return <p className="text-sm text-gray-400">沒有活動</p>
    return (
      <div className="space-y-2">
        {events.map(e => (
          <Link key={e.id} to={`/events/${e.id}`}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 truncate">{e.script.title}</div>
              <div className="text-xs text-gray-400 truncate">{formatDate(e.scheduled_at)}・{e.location}</div>
            </div>
            <span className="text-xs text-gray-500 ml-2 shrink-0">{STATUS_LABELS[e.status]}</span>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{user?.nickname}</h1>
        <p className="text-sm text-gray-400">{user?.email}</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">載入中...</div>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="font-semibold text-gray-700 mb-3">我主辦的活動</h2>
            <EventList events={hosted} />
          </section>
          <section>
            <h2 className="font-semibold text-gray-700 mb-3">我參加的活動</h2>
            <EventList events={joined} />
          </section>
          {user?.is_admin && (
            <section>
              <h2 className="font-semibold text-gray-700 mb-3">管理員</h2>
              <Link to="/admin/scripts/new"
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-md hover:border-brand-light hover:shadow-sm transition-all">
                <span className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                <span className="text-sm font-medium text-gray-900">新增劇本</span>
              </Link>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
