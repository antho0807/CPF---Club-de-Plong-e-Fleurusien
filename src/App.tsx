import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/layout/Layout'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { Dashboard } from './pages/Dashboard'
import { Calendar } from './pages/Calendar'
import { Members } from './pages/Members'
import { MemberProfile } from './pages/MemberProfile'
import { DiveSites } from './pages/DiveSites'
import { Documents } from './pages/Documents'
import { ClubInfo } from './pages/ClubInfo'
import { Profile } from './pages/Profile'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-[#0077b6] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Chargement…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="calendrier" element={<Calendar />} />
          <Route path="membres" element={<Members />} />
          <Route path="membres/:id" element={<MemberProfile />} />
          <Route path="sites" element={<DiveSites />} />
          <Route path="documents" element={<Documents />} />
          <Route path="club" element={<ClubInfo />} />
          <Route path="profil" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
