import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 text-xs px-3 py-1 ${isActive ? 'text-brand' : 'text-gray-400'}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop / Tablet Navbar */}
      <nav className="bg-surface border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/"><Logo className="h-8 w-auto" /></Link>
            <Link to="/" className="hidden sm:block text-sm text-gray-600 hover:text-gray-900">活動</Link>
            <Link to="/scripts" className="hidden sm:block text-sm text-gray-600 hover:text-gray-900">劇本</Link>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/events/new" className="hidden sm:block text-sm bg-brand text-white px-3 py-1.5 rounded-md hover:bg-brand-hover">
                  揪團
                </Link>
                <Link to="/me" className="hidden sm:block text-sm text-gray-600 hover:text-gray-900">{user.nickname}</Link>
                <button onClick={handleLogout} className="hidden sm:block text-sm text-gray-400 hover:text-gray-600">
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

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Tab Bar */}
      {user && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-200 z-40">
          <div className="flex items-center justify-around h-16">
            <NavLink to="/" end className={navLinkClass}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              活動
            </NavLink>
            <NavLink to="/scripts" className={navLinkClass}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              劇本
            </NavLink>
            <NavLink to="/events/new" className={navLinkClass}>
              <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center -mt-5 shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              揪團
            </NavLink>
            <NavLink to="/messages" className={navLinkClass}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              訊息
            </NavLink>
            <NavLink to="/me" className={navLinkClass}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              我的
            </NavLink>
          </div>
        </nav>
      )}
    </div>
  )
}
