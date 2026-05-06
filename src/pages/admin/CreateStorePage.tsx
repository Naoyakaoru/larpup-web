import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createStore } from '../../api/stores'
import { searchUsers } from '../../api/users'
import type { User } from '../../types'

export default function CreateStorePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [ownerQuery, setOwnerQuery] = useState('')
  const [ownerResults, setOwnerResults] = useState<User[] | null>(null) // null = not searched yet
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleOwnerSearch(q: string) {
    setOwnerQuery(q)
    setSelectedOwner(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 1) {
      setOwnerResults(null)
      setDropdownOpen(false)
      return
    }
    setSearching(true)
    setDropdownOpen(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers(q)
        setOwnerResults(results)
      } finally {
        setSearching(false)
      }
    }, 500)
  }

  function selectOwner(user: User) {
    setSelectedOwner(user)
    setOwnerQuery(`${user.nickname}  @${user.handle}`)
    setDropdownOpen(false)
    setOwnerResults(null)
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!selectedOwner) { setError('請選擇一位 owner'); return }
    setError('')
    setLoading(true)
    try {
      await createStore({ name, owner_id: selectedOwner.id })
      navigate('/admin/stores')
    } catch (err) {
      setError(err instanceof Error ? err.message : '建立失敗')
    } finally {
      setLoading(false)
    }
  }

  const showDropdown = dropdownOpen && !searching

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">新增店家</h1>
      <form onSubmit={handleSubmit} className="bg-surface border border-gray-200 rounded-lg p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">店家名稱</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div ref={containerRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Owner（店家帳號）</label>
          <div className="relative">
            <input
              type="text"
              value={ownerQuery}
              onChange={e => handleOwnerSearch(e.target.value)}
              onFocus={() => ownerResults !== null && setDropdownOpen(true)}
              placeholder="搜尋使用者暱稱或 handle..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">搜尋中...</span>
            )}
            {selectedOwner && !searching && (
              <button
                type="button"
                onClick={() => { setSelectedOwner(null); setOwnerQuery(''); setOwnerResults(null) }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {selectedOwner && (
            <p className="text-xs text-gray-400 mt-1">已選擇：{selectedOwner.nickname} · @{selectedOwner.handle}</p>
          )}

          {showDropdown && ownerResults !== null && (
            <div className="absolute z-10 w-full mt-1 bg-surface-2 border border-gray-200 rounded-md shadow-md overflow-hidden">
              {ownerResults.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">找不到符合的使用者</p>
              ) : (
                <ul className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {ownerResults.map(u => (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => selectOwner(u)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <span className="font-medium text-gray-900">{u.nickname}</span>
                        <span className="text-gray-400 text-xs">@{u.handle}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand text-white py-2 rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
        >
          {loading ? '建立中...' : '建立店家'}
        </button>
      </form>
    </div>
  )
}
