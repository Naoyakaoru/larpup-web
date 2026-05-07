import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminStores } from '../../api/stores'
import type { Store } from '../../types'

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStores()
      .then(setStores)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">店家管理</h1>
        <Link
          to="/admin/stores/new"
          className="text-sm bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-hover"
        >
          新增店家
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">載入中...</div>
      ) : stores.length === 0 ? (
        <div className="text-center text-gray-400 py-16">還沒有任何店家</div>
      ) : (
        <div className="bg-surface border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
          {stores.map(store => (
            <div key={store.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{store.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {store.owner.nickname} · @{store.owner.handle}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                store.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {store.status === 'active' ? '營業中' : '停用'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
