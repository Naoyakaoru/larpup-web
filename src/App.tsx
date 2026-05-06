import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
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

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <EventsPage /> },
      { path: 'events/:id', element: <EventDetailPage /> },
      { path: 'scripts', element: <ScriptsPage /> },
      { path: 'messages', element: <MessagesPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'events/new', element: <CreateEventPage /> },
          { path: 'me', element: <ProfilePage /> },
        ],
      },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
