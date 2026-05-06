import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getScript } from '../api/scripts'
import type { Script } from '../types'

import { DIFFICULTY_COLORS } from '../utils/labels'

export default function ScriptDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [script, setScript] = useState<Script | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getScript(Number(id)).then(setScript).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center text-gray-400 py-16">載入中...</div>
  if (!script) return <div className="text-center text-gray-400 py-16">找不到劇本</div>

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 mb-4">← 返回</button>

      <div className="bg-surface rounded-lg border border-gray-200 overflow-hidden mb-4">
        {script.cover_image_url && (
          <img src={script.cover_image_url} alt={script.title}
            className="w-full h-48 object-cover" />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-xl font-bold text-gray-900">{script.title}</h1>
            <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${DIFFICULTY_COLORS[script.difficulty]}`}>
              {script.difficulty_label}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {script.genres.map(g => (
              <span key={g} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{g}</span>
            ))}
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
            <div className="text-center bg-gray-50 rounded-md py-2">
              <dt className="text-xs text-gray-400 mb-0.5">男生</dt>
              <dd className="font-semibold text-gray-900">{script.male_slots}</dd>
            </div>
            <div className="text-center bg-gray-50 rounded-md py-2">
              <dt className="text-xs text-gray-400 mb-0.5">女生</dt>
              <dd className="font-semibold text-gray-900">{script.female_slots}</dd>
            </div>
            <div className="text-center bg-gray-50 rounded-md py-2">
              <dt className="text-xs text-gray-400 mb-0.5">不限</dt>
              <dd className="font-semibold text-gray-900">{script.any_slots}</dd>
            </div>
            <div className="text-center bg-brand/10 rounded-md py-2">
              <dt className="text-xs text-brand-hover mb-0.5">共</dt>
              <dd className="font-semibold text-brand-hover">{script.total_slots} 人</dd>
            </div>
          </dl>

          {script.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{script.description}</p>
          )}
        </div>
      </div>

      <Link to={`/events/new?script_id=${script.id}`}
        className="block w-full text-center bg-brand text-white py-2.5 rounded-md text-sm font-medium hover:bg-brand-hover transition-colors">
        用這個劇本揪團
      </Link>
    </div>
  )
}
