import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import * as authApi from '../api/auth'
import Logo from './Logo'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await authApi.logout().catch(() => {})
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/"><Logo className="h-8 w-auto" /></Link>
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">活動</Link>
            <Link to="/scripts" className="text-sm text-gray-600 hover:text-gray-900">劇本</Link>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/events/new" className="text-sm bg-brand text-white px-3 py-1.5 rounded-md hover:bg-brand-hover">
                  揪團
                </Link>
                <Link to="/me" className="text-sm text-gray-600 hover:text-gray-900">{user.nickname}</Link>
                <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600">
                  登出
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">登入</Link>
                <Link to="/register" className="text-sm bg-brand text-white px-3 py-1.5 rounded-md hover:bg-brand-hover">
                  註冊
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
