import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getScripts } from '../api/scripts'
import type { Script } from '../types'

import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '../utils/labels'

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [difficulty, setDifficulty] = useState('')

  useEffect(() => {
    setLoading(true)
    getScripts(difficulty ? { difficulty } : {})
      .then(setScripts)
      .finally(() => setLoading(false))
  }, [difficulty])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-gray-900">劇本</h1>
        <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
          {(['', 'easy', 'medium', 'hard'] as const).map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                difficulty === d
                  ? 'bg-brand text-white border-brand'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}>
              {d === '' ? '全部' : DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">載入中...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scripts.map(script => (
            <Link key={script.id} to={`/scripts/${script.id}`} className="block bg-surface rounded-lg border border-gray-200 p-4 hover:border-brand-light hover:shadow-sm transition-all">
              {script.cover_image_url && (
                <img src={script.cover_image_url} alt={script.title}
                  className="w-full h-32 object-cover rounded-md mb-3" />
              )}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-semibold text-gray-900 text-sm leading-tight">{script.title}</h2>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[script.difficulty]}`}>
                  {DIFFICULTY_LABELS[script.difficulty]}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {script.genres.map(g => (
                  <span key={g} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{g}</span>
                ))}
              </div>
              <div className="text-xs text-gray-400">
                {[
                  script.male_slots ? `${script.male_slots}男` : '',
                  script.female_slots ? `${script.female_slots}女` : '',
                  script.any_slots ? `${script.any_slots}不限` : '',
                ].filter(Boolean).join('・')}・共 {script.total_slots} 人
              </div>
              {script.description && (
                <p className="mt-2 text-xs text-gray-500 line-clamp-2">{script.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
