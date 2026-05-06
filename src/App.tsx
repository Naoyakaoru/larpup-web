import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import CreateEventPage from './pages/CreateEventPage'
import ScriptsPage from './pages/ScriptsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import MessagesPage from './pages/MessagesPage'
import ScriptDetailPage from './pages/ScriptDetailPage'
import AdminRoute from './components/AdminRoute'
import CreateScriptPage from './pages/admin/CreateScriptPage'
import UserProfilePage from './pages/UserProfilePage'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <EventsPage /> },
      { path: 'events/:id', element: <EventDetailPage /> },
      { path: 'scripts', element: <ScriptsPage /> },
      { path: 'scripts/:id', element: <ScriptDetailPage /> },
      { path: 'messages', element: <MessagesPage /> },
      { path: 'users/:handle', element: <UserProfilePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'events/new', element: <CreateEventPage /> },
          { path: 'me', element: <ProfilePage /> },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          { path: 'admin/scripts/new', element: <CreateScriptPage /> },
        ],
      },
    ],
  },
])

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  )
}
