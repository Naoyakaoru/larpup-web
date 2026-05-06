import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import * as authApi from '../api/auth'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', passwordConfirmation: '', nickname: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.register(form.email, form.password, form.passwordConfirmation, form.nickname)
      login(res.token, res.user)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '註冊失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">註冊</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: '暱稱', field: 'nickname' as const, type: 'text' },
          { label: 'Email', field: 'email' as const, type: 'email' },
          { label: '密碼', field: 'password' as const, type: 'password' },
          { label: '確認密碼', field: 'passwordConfirmation' as const, type: 'password' },
        ].map(({ label, field, type }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type={type} value={form[field]} onChange={set(field)} required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        ))}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full bg-purple-600 text-white py-2 rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? '註冊中...' : '建立帳號'}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-500 text-center">
        已有帳號？<Link to="/login" className="text-purple-600 hover:underline">登入</Link>
      </p>
    </div>
  )
}
