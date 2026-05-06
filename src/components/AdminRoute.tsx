import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (!user?.is_admin) return <Navigate to="/" replace />
  return <Outlet />
}
