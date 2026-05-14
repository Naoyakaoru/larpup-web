import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { GoogleLogin } from '@react-oauth/google'
import * as authApi from '../api/auth'
import type { AuthResponse, SsoPendingResponse } from '../types'

const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID as string
const LINE_REDIRECT_URI = import.meta.env.VITE_LINE_REDIRECT_URI as string

function buildLineLoginUrl(): string {
  const state = crypto.randomUUID()
  sessionStorage.setItem('line_oauth_state', state)
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_CHANNEL_ID,
    redirect_uri: LINE_REDIRECT_URI,
    state,
    scope: 'profile openid email',
  })
  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`
}

function SsoButton({
  id,
  icon,
  label,
  onClick,
  disabled,
  className,
}: {
  id?: string
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  className: string
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}
      className={`w-full flex items-center justify-center h-[32px] rounded-[4px] text-[14px] font-medium tracking-[0.25px] disabled:opacity-50 transition-colors overflow-hidden ${className}`}
    >
      {/* Inner wrapper — 對應 Google 的 nsm7Bb div，左右各 13px padding */}
      <div className="flex items-center gap-2 flex-1 px-[13px]">
        {/* Icon 置左，18×18px */}
        <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
          {icon}
        </div>
        {/* 文字佔滿剩餘空間，在剩餘寬度內置中 */}
        <span className="flex-1 text-center leading-none">{label}</span>
      </div>
    </button>
  )
}

function LineIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 10.06C22 5.5 17.52 1.82 12 1.82S2 5.5 2 10.06c0 4.1 3.64 7.53 8.56 8.18.33.07.78.22.9.5.1.26.07.66.03.92l-.14.86c-.04.26-.2 1.02.9.55 1.1-.46 5.9-3.48 8.05-5.96C21.27 13.31 22 11.76 22 10.06z" />
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const errorMap: Record<string, string> = {
    line_cancelled: 'LINE 登入已取消',
    line_state_mismatch: '登入驗證失敗，請再試一次',
    line_failed: 'LINE 登入失敗，請再試一次',
  }
  const urlError = searchParams.get('error')

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      login(res.token, res.user)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登入失敗')
    } finally {
      setLoading(false)
    }
  }

  function handleSsoResponse(res: AuthResponse | SsoPendingResponse) {
    if ('token' in res) {
      login(res.token, res.user)
      navigate('/')
    } else {
      sessionStorage.setItem('sso_temp_token', res.temp_token)
      sessionStorage.setItem('sso_email', res.email)
      sessionStorage.setItem('sso_nickname', res.nickname)
      navigate('/register?sso=1')
    }
  }

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    const idToken = credentialResponse.credential
    if (!idToken) { setError('Google 登入失敗，請再試一次'); return }
    setLoading(true)
    setError('')
    try {
      const res = await authApi.ssoGoogle(idToken)
      handleSsoResponse(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google 登入失敗')
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="w-[300px] mx-auto mt-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">登入</h1>

      {(error || urlError) && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-5 text-balance text-center leading-relaxed">
          {error || (urlError ? (errorMap[urlError] ?? urlError) : '')}
        </div>
      )}

      {/* ── SSO buttons ─────────────────────────────────────────── */}
      <div className="space-y-3 mb-5">
        {/* LINE */}
        <SsoButton
          id="line-login-btn"
          icon={<LineIcon />}
          label="使用 LINE 帳戶登入"
          onClick={() => { window.location.href = buildLineLoginUrl() }}
          disabled={loading}
          className="bg-[#06C755] text-white hover:bg-[#05B34C] active:bg-[#049B42] hover:shadow-md active:shadow-sm transition-all duration-200"
        />

        {/* Google 官方按鈕 */}
        <div className="flex justify-center w-full [&>div]:w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google 登入取消或失敗')}
            text="signin_with"
            theme="outline"
            size="medium"
            width="300"
            shape="rectangular"
          />
        </div>
      </div>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs text-gray-500">
          <span className="bg-gray-50 px-2">或使用 Email 登入</span>
        </div>
      </div>

      {/* ── Email / Password form ────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="login-email"
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
          <input
            id="login-password"
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full bg-brand text-white py-2 rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
        >
          {loading ? '登入中...' : '登入'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-500 text-center">
        還沒有帳號？<Link to="/register" className="text-brand hover:underline">註冊</Link>
      </p>
    </div>
  )
}
