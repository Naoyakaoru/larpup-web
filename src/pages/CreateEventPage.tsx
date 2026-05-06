import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getScripts } from '../api/scripts'
import { createEvent } from '../api/events'
import type { Script } from '../types'

export default function CreateEventPage() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    script_id: searchParams.get('script_id') ?? '',
    scheduled_at: '',
    location: '',
    host_in_game: false,
    host_cross_gender: false,
    allow_cross_gender: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getScripts().then(setScripts)
  }, [])

  const selectedScript = scripts.find(s => String(s.id) === form.script_id) ?? null

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))
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
        host_in_game: form.host_in_game,
        host_cross_gender: form.host_cross_gender,
        allow_cross_gender: form.allow_cross_gender,
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
              <option key={s.id} value={s.id}>{s.title}（{s.total_slots} 人）</option>
            ))}
          </select>
        </div>

        {selectedScript && (
          <div className="bg-gray-50 rounded-md p-3 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {[
                { label: '男', value: selectedScript.male_slots },
                { label: '女', value: selectedScript.female_slots },
                { label: '不限', value: selectedScript.any_slots },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded border border-gray-200 py-2">
                  <div className="text-gray-400 mb-0.5">{label}</div>
                  <div className="font-semibold text-gray-900">{value}</div>
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.host_in_game} onChange={set('host_in_game')}
                className="w-4 h-4 accent-brand rounded" />
              <span className="text-sm text-gray-700">主揪也要上車（佔一個名額）</span>
            </label>
            {form.host_in_game && (
              <label className="flex items-center gap-2 cursor-pointer pl-6">
                <input type="checkbox" checked={form.host_cross_gender} onChange={set('host_cross_gender')}
                  className="w-4 h-4 accent-brand rounded" />
                <span className="text-sm text-gray-500">主揪反串</span>
              </label>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.allow_cross_gender} onChange={set('allow_cross_gender')}
                className="w-4 h-4 accent-brand rounded" />
              <span className="text-sm text-gray-700">開放反串</span>
            </label>
            <p className="text-xs text-gray-400">
              實際招募人數：{selectedScript.total_slots - (form.host_in_game ? 1 : 0)} 人
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">活動時間</label>
          <input type="datetime-local" value={form.scheduled_at} onChange={set('scheduled_at')} required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">地點</label>
          <input type="text" value={form.location} onChange={set('location')} required
            placeholder="例：台北市信義區 / 謎境劇本殺台北店"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
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
