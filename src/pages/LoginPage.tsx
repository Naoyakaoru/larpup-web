import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
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

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login }               = useAuth()
  const navigate                = useNavigate()
  const [searchParams]          = useSearchParams()

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

  function handleLineLogin() {
    window.location.href = buildLineLoginUrl()
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">登入</h1>

      {(error || urlError) && (
        <p className="text-sm text-red-600 mb-4">
          {error || (urlError ? (errorMap[urlError] ?? urlError) : '')}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
          <input
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

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs text-gray-400">
          <span className="bg-white px-2">或使用第三方登入</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Google SSO — GoogleLogin renders its own branded button; wrap in a div for width control */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google 登入取消或失敗')}
            width="100%"
            text="signin_with"
            locale="zh-TW"
          />
        </div>

        {/* LINE SSO */}
        <button
          type="button"
          onClick={handleLineLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#06C755] text-white rounded-md py-2 text-sm font-medium hover:bg-[#05a949] disabled:opacity-50 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M22 10.06C22 5.5 17.52 1.82 12 1.82S2 5.5 2 10.06c0 4.1 3.64 7.53 8.56 8.18.33.07.78.22.9.5.1.26.07.66.03.92l-.14.86c-.04.26-.2 1.02.9.55 1.1-.46 5.9-3.48 8.05-5.96C21.27 13.31 22 11.76 22 10.06z"/>
          </svg>
          使用 LINE 登入
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-500 text-center">
        還沒有帳號？<Link to="/register" className="text-brand hover:underline">註冊</Link>
      </p>
    </div>
  )
}
