import { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { GoogleLogin } from '@react-oauth/google'
import * as authApi from '../api/auth'
import type { AuthResponse, SsoPendingResponse } from '../types'

const LINE_CHANNEL_ID   = import.meta.env.VITE_LINE_CHANNEL_ID as string
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

// Shared icon-left + text-center button layout to match Google's official button style
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
      className={`w-full flex items-center justify-center gap-2.5 rounded-md py-2.5 text-sm font-medium disabled:opacity-50 transition-colors ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function LineIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 10.06C22 5.5 17.52 1.82 12 1.82S2 5.5 2 10.06c0 4.1 3.64 7.53 8.56 8.18.33.07.78.22.9.5.1.26.07.66.03.92l-.14.86c-.04.26-.2 1.02.9.55 1.1-.46 5.9-3.48 8.05-5.96C21.27 13.31 22 11.76 22 10.06z"/>
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login }               = useAuth()
  const { isDark }              = useTheme()
  const navigate                = useNavigate()
  const [searchParams]          = useSearchParams()
  // Hidden GoogleLogin container — we trigger it programmatically to keep id_token flow
  const googleBtnRef            = useRef<HTMLDivElement>(null)

  const errorMap: Record<string, string> = {
    line_cancelled:      'LINE 登入已取消',
    line_state_mismatch: '登入驗證失敗，請再試一次',
    line_failed:         'LINE 登入失敗，請再試一次',
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

  function triggerGoogleLogin() {
    // Try clicking the rendered Google button first
    const inner = googleBtnRef.current?.querySelector<HTMLElement>('[role="button"],button,div[tabindex]')
    if (inner) {
      inner.click()
      return
    }
    // Fallback: renderButton may not have rendered in production build;
    // call google.accounts.id.prompt() directly — uses the same onSuccess callback
    // registered by <GoogleLogin> and avoids popup-blocker issues.
    ;(window as Window & { google?: { accounts?: { id?: { prompt?: () => void } } } })
      .google?.accounts?.id?.prompt?.()
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">登入</h1>

      {(error || urlError) && (
        <p className="text-sm text-red-600 mb-4">
          {error || (urlError ? (errorMap[urlError] ?? urlError) : '')}
        </p>
      )}

      {/* ── SSO buttons ─────────────────────────────────────────── */}
      <div className="space-y-3 mb-5">
        {/* LINE */}
        <SsoButton
          id="line-login-btn"
          icon={<LineIcon />}
          label="使用 LINE 登入"
          onClick={() => { window.location.href = buildLineLoginUrl() }}
          disabled={loading}
          className="bg-[#06C755] text-white hover:bg-[#05B34C] active:bg-[#049B42] hover:shadow-md active:shadow-sm transition-all duration-200"
        />

        {/* Google — custom button triggers the hidden <GoogleLogin> to preserve id_token */}
        <SsoButton
          id="google-login-btn"
          icon={
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          }
          label="使用 Google 登入"
          onClick={triggerGoogleLogin}
          disabled={loading}
          className="bg-white border border-[#dadce0] text-[#3c4043] hover:bg-[#f8f9fa] active:bg-[#f1f3f4] hover:shadow-md active:shadow-sm transition-all duration-200"
        />
        {/* Hidden GoogleLogin — renders Google's OAuth button invisibly; custom button above triggers it */}
        <div
          ref={googleBtnRef}
          style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '400px' }}
          aria-hidden="true"
          data-testid="google-login-hidden"
        >
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google 登入取消或失敗')}
            width={400}
            text="signin_with"
            theme={isDark ? 'filled_black' : 'outline'}
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
