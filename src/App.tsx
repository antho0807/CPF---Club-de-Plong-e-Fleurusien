import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/layout/Layout'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { ResetPassword } from './pages/auth/ResetPassword'
import { Dashboard } from './pages/Dashboard'
import { Calendar } from './pages/Calendar'
import { Members } from './pages/Members'
import { MemberProfile } from './pages/MemberProfile'
import { DiveSites } from './pages/DiveSites'
import { Documents } from './pages/Documents'
import { ClubInfo } from './pages/ClubInfo'
import { Profile } from './pages/Profile'
import { Objectives } from './pages/Objectives'
import { Useful } from './pages/Useful'
import { GdprConsent } from './components/GdprConsent'
import { PendingApproval } from './pages/PendingApproval'
import { Rejected } from './pages/Rejected'
import { AdminPending } from './pages/admin/AdminPending'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border-4 border-[#0077b6] border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Chargement…</p>
      </div>
    </div>
  )
}

// Accès complet : connecté + approuvé (+ admin si requireAdmin)
function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, profile, loading, signOut } = useAuth()

  // Si l'utilisateur est authentifié mais que le profil est introuvable après chargement
  // (DB non initialisée, trigger manquant…), on déconnecte pour éviter la boucle infinie.
  useEffect(() => {
    if (!loading && user && !profile) {
      signOut()
    }
  }, [loading, user, profile, signOut])

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Spinner /> // Bref — signOut en cours dans le useEffect

  if (profile.status === 'pending') return <Navigate to="/pending-approbation" replace />
  if (profile.status === 'rejected') return <Navigate to="/refus" replace />
  if (requireAdmin && profile.role !== 'admin') return <Navigate to="/" replace />

  return <>{children}</>
}

// Accès connecté seulement (pending/rejected peuvent voir leur page de statut)
function ConnectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Pages publiques : redirige les utilisateurs déjà connectés
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return null
  if (user) {
    if (profile?.status === 'pending') return <Navigate to="/pending-approbation" replace />
    if (profile?.status === 'rejected') return <Navigate to="/refus" replace />
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <GdprConsent />
      <Routes>
        {/* Public */}
        <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register"        element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* Statut du compte — connecté mais pas encore approuvé */}
        <Route path="/pending-approbation" element={<ConnectedRoute><PendingApproval /></ConnectedRoute>} />
        <Route path="/refus"               element={<ConnectedRoute><Rejected /></ConnectedRoute>} />

        {/* Admin */}
        <Route path="/admin/approbations" element={<ProtectedRoute requireAdmin><AdminPending /></ProtectedRoute>} />

        {/* App principale — approved uniquement */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="calendrier" element={<Calendar />} />
          <Route path="membres" element={<Members />} />
          <Route path="membres/:id" element={<MemberProfile />} />
          <Route path="sites" element={<DiveSites />} />
          <Route path="documents" element={<Documents />} />
          <Route path="club" element={<ClubInfo />} />
          <Route path="objectifs" element={<Objectives />} />
          <Route path="utile" element={<Useful />} />
          <Route path="profil" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
