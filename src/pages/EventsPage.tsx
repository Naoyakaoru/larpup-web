import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEvents } from '../api/events'
import { EVENT_STATUS_LABELS as STATUS_LABELS, EVENT_STATUS_COLORS as STATUS_COLORS } from '../utils/labels'
import type { Event } from '../types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    setLoading(true)
    getEvents(status ? { status } : {})
      .then(setEvents)
      .finally(() => setLoading(false))
  }, [status])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-gray-900">揪團活動</h1>
        <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
          {(['', 'recruiting', 'full'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                status === s
                  ? 'bg-brand text-white border-brand'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {s === '' ? '全部' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">載入中...</div>
      ) : events.length === 0 ? (
        <div className="text-center text-gray-400 py-16">目前沒有活動</div>
      ) : (
        <div className="grid gap-4">
          {events.map(event => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="block bg-surface rounded-lg border border-gray-200 p-4 hover:border-brand-light hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{event.script.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[event.status]}`}>
                      {STATUS_LABELS[event.status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-1">
                    <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                      {event.script.difficulty_label}
                    </span>
                    {event.script.genres.map(g => (
                      <span key={g} className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{g}</span>
                    ))}
                    {event.allow_cross_gender ? (
                      <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">開放反串</span>
                    ) : (event.script.male_slots > 0 || event.script.female_slots > 0) ? (
                      <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">不反串</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-400 mb-0.5">
                    {[
                      event.script.store?.name,
                      event.script.version_name,
                      event.script.duration != null ? `${event.script.duration}h` : null,
                    ].filter(Boolean).join("・")}
                  </p>
                  <div className="text-sm text-gray-500 space-y-0.5">
                    <div>{formatDate(event.scheduled_at)}</div>
                    <div>{event.location}</div>
                    <div>主辦：{event.host.nickname}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-semibold text-gray-900">
                    {event.confirmed_count} / {event.script.total_slots}
                  </div>
                  <div className="text-xs text-gray-400">已確認 / 總人數</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
