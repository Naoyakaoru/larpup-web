import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createScript } from '../../api/scripts'

const GENRES = [
  [0, '推理'], [1, '還原'], [2, '恐怖'], [3, '情感'],
  [4, '歡樂'], [5, '機制'], [6, '陣營'], [7, '古風'], [8, '現代'],
] as const

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '入門' },
  { value: 'medium', label: '進階' },
  { value: 'hard', label: '燒腦' },
]

export default function CreateScriptPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    male_slots: 0,
    female_slots: 0,
    any_slots: 0,
  })
  const [genres, setGenres] = useState<number[]>([])
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: keyof typeof form) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))
  }

  function toggleGenre(value: number) {
    setGenres(g => g.includes(value) ? g.filter(v => v !== value) : [...g, value])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (genres.length === 0) { setError('請至少選一個類型'); return }
    setError('')
    setLoading(true)

    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => data.append(k, String(v)))
    genres.forEach(g => data.append('genres[]', String(g)))
    if (coverImage) data.append('cover_image', coverImage)

    try {
      const script = await createScript(data)
      navigate('/scripts')
      console.info('Created script:', script.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : '建立失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">新增劇本</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">劇本名稱</label>
          <input type="text" value={form.title} onChange={set('title')} required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">難度</label>
          <select value={form.difficulty} onChange={set('difficulty')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand">
            {DIFFICULTY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">類型</label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map(([value, label]) => (
              <button key={value} type="button" onClick={() => toggleGenre(value)}
                className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                  genres.includes(value)
                    ? 'bg-brand text-white border-brand'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(['male_slots', 'female_slots', 'any_slots'] as const).map(field => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {field === 'male_slots' ? '男生名額' : field === 'female_slots' ? '女生名額' : '不限名額'}
              </label>
              <input type="number" min={0} value={form[field]} onChange={set(field)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">簡介</label>
          <textarea value={form.description} onChange={set('description')} rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">封面圖片</label>
          <input type="file" accept="image/*"
            onChange={e => setCoverImage(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-brand file:text-white hover:file:bg-brand-hover" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-brand text-white py-2 rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50">
          {loading ? '建立中...' : '建立劇本'}
        </button>
      </form>
    </div>
  )
}
