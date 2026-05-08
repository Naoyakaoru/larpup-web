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
import AdminScriptsPage from './pages/admin/ScriptsPage'
import EditScriptPage from './pages/admin/EditScriptPage'
import CreateStorePage from './pages/admin/CreateStorePage'
import AdminStoresPage from './pages/admin/StoresPage'
import ImportScriptsPage from './pages/admin/ImportScriptsPage'
import AdminAddressesPage from './pages/admin/AddressesPage'
import StoreManagePage from './pages/StoreManagePage'
import StoreScriptVersionsPage from './pages/StoreScriptVersionsPage'
import StoreImportScriptVersionsPage from './pages/StoreImportScriptVersionsPage'
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
          { path: 'stores/:id/manage', element: <StoreManagePage /> },
          { path: 'stores/:id/script_versions', element: <StoreScriptVersionsPage /> },
          { path: 'stores/:id/script_versions/import', element: <StoreImportScriptVersionsPage /> },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          { path: 'admin/scripts', element: <AdminScriptsPage /> },
          { path: 'admin/scripts/import', element: <ImportScriptsPage /> },
          { path: 'admin/scripts/new', element: <CreateScriptPage /> },
          { path: 'admin/scripts/:id/edit', element: <EditScriptPage /> },
          { path: 'admin/stores', element: <AdminStoresPage /> },
          { path: 'admin/stores/new', element: <CreateStorePage /> },
          { path: 'admin/addresses', element: <AdminAddressesPage /> },
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
