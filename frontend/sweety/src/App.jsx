import { Navigate, Route, Routes } from 'react-router-dom'
import ScreenStatus from './components/ScreenStatus'
import { useAuth } from './hooks/useAuth'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <ScreenStatus />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <ScreenStatus />
  if (user) return <Navigate to="/home" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Root route directs directly to login (or home if already logged in) for testing */}
      <Route
        path="/"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        }
      />
      {/* Preserved landing page at /landing */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
