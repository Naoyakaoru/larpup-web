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
            <div>
              <div className="text-sm font-medium text-gray-900">{e.script.title}</div>
              <div className="text-xs text-gray-400">{formatDate(e.scheduled_at)}・{e.location}</div>
            </div>
            <span className="text-xs text-gray-500">{STATUS_LABELS[e.status]}</span>
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
        </div>
      )}
    </div>
  )
}
