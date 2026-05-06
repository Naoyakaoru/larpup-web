import { useEffect, useState } from 'react'
import { getScripts } from '../api/scripts'
import type { Script } from '../types'

const DIFFICULTY_LABELS = { easy: '入門', medium: '進階', hard: '燒腦' }
const DIFFICULTY_COLORS = {
  easy: 'bg-blue-100 text-blue-700',
  medium: 'bg-orange-100 text-orange-700',
  hard: 'bg-red-100 text-red-700',
}

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">劇本</h1>
        <div className="flex gap-2">
          {(['', 'easy', 'medium', 'hard'] as const).map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                difficulty === d
                  ? 'bg-purple-600 text-white border-purple-600'
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
            <div key={script.id} className="bg-white rounded-lg border border-gray-200 p-4">
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
                  <span key={g} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{g}</span>
                ))}
              </div>
              <div className="text-xs text-gray-400">
                {[
                  script.male_slots ? `男 ${script.male_slots}` : '',
                  script.female_slots ? `女 ${script.female_slots}` : '',
                  script.any_slots ? `不限 ${script.any_slots}` : '',
                ].filter(Boolean).join('・')}・共 {script.total_slots} 人
              </div>
              {script.description && (
                <p className="mt-2 text-xs text-gray-500 line-clamp-2">{script.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
