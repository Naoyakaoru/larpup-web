import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ssoLine } from '../api/auth'
import type { AuthResponse, SsoPendingResponse } from '../types'

const LINE_REDIRECT_URI = import.meta.env.VITE_LINE_REDIRECT_URI as string

export default function LineCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const called = useRef(false)

  useEffect(() => {
    // Prevent double-invocation in React StrictMode
    if (called.current) return
    called.current = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const savedState = sessionStorage.getItem('line_oauth_state')

    if (!code) {
      navigate('/login?error=line_cancelled')
      return
    }

    if (state !== savedState) {
      navigate('/login?error=line_state_mismatch')
      return
    }

    sessionStorage.removeItem('line_oauth_state')

    ssoLine(code, LINE_REDIRECT_URI)
      .then((res: AuthResponse | SsoPendingResponse) => {
        if ('token' in res) {
          login(res.token, res.user)
          navigate('/')
        } else {
          sessionStorage.setItem('sso_temp_token', res.temp_token)
          sessionStorage.setItem('sso_email', res.email)
          sessionStorage.setItem('sso_nickname', res.nickname)
          navigate('/register?sso=1')
        }
      })
      .catch(() => {
        navigate('/login?error=line_failed')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-gray-500 text-sm">LINE 登入中，請稍候…</p>
    </div>
  )
}
