import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getScripts } from '../api/scripts'
import { createEvent } from '../api/events'
import type { Script } from '../types'

export default function CreateEventPage() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [form, setForm] = useState({ script_id: '', scheduled_at: '', location: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getScripts().then(setScripts)
  }, [])

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const event = await createEvent({
        script_id: Number(form.script_id),
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        location: form.location,
      })
      navigate(`/events/${event.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '建立失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">建立揪團</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">劇本</label>
          <select value={form.script_id} onChange={set('script_id')} required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="">請選擇劇本</option>
            {scripts.map(s => (
              <option key={s.id} value={s.id}>
                {s.title}（{s.total_slots} 人）
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">活動時間</label>
          <input type="datetime-local" value={form.scheduled_at} onChange={set('scheduled_at')} required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">地點</label>
          <input type="text" value={form.location} onChange={set('location')} required
            placeholder="例：台北市信義區 / 謎境劇本殺台北店"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-brand text-white py-2 rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50">
          {loading ? '建立中...' : '建立活動'}
        </button>
      </form>
    </div>
  )
}
