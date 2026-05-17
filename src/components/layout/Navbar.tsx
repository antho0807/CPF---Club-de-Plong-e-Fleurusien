import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, MapPin, Info, LogOut, User, Bell,
  ShieldCheck, Target, Lightbulb, ChevronDown, Users, FileText, Building2,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { cn } from '../../lib/utils'

const mainItems = [
  { to: '/',           label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/calendrier', label: 'Calendrier',       icon: Calendar },
  { to: '/objectifs',  label: 'Objectifs',        icon: Target },
  { to: '/sites',      label: 'Sites',            icon: MapPin },
  { to: '/utile',      label: 'Utile',            icon: Lightbulb },
]

const clubSubItems = [
  { to: '/membres',   label: 'Membres',         icon: Users },
  { to: '/documents', label: 'Documents',        icon: FileText },
  { to: '/club',      label: 'À propos du club', icon: Info },
]

export function Navbar() {
  const { profile, signOut, isAdmin } = useAuth()
  const { notifications, unreadCount, markAllRead } = useNotifications(profile?.id)
  const [showNotifs, setShowNotifs] = useState(false)
  const [clubOpen, setClubOpen] = useState(false)
  const location = useLocation()

  const isClubActive = clubSubItems.some((i) => location.pathname === i.to)

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-[#0077b6] text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/20">
        <div className="bg-white rounded-full p-1 flex-shrink-0">
          <img src="/logo-cpf.png" alt="CPF" className="h-8 w-8 object-contain" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">CPF</p>
          <p className="text-xs text-blue-200 leading-tight">Club de Plongée Fleurusien</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {mainItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-white text-[#0077b6]' : 'text-blue-100 hover:bg-white/10',
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {label}
            </Link>
          )
        })}

        {/* Le Club — menu dépliable */}
        <div>
          <button
            onClick={() => setClubOpen((v) => !v)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isClubActive ? 'bg-white text-[#0077b6]' : 'text-blue-100 hover:bg-white/10',
            )}
          >
            <Building2 className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-left">Le Club</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', (clubOpen || isClubActive) && 'rotate-180')} />
          </button>

          {(clubOpen || isClubActive) && (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-white/20 pl-3">
              {clubSubItems.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      'flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors',
                      active ? 'bg-white/20 text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Admin */}
      {isAdmin && (
        <div className="px-3 pb-2 border-t border-white/20 pt-2">
          <Link
            to="/admin/approbations"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              location.pathname === '/admin/approbations'
                ? 'bg-white text-[#0077b6]'
                : 'text-blue-100 hover:bg-white/10',
            )}
          >
            <ShieldCheck className="h-5 w-5 flex-shrink-0" />
            Approbations
          </Link>
        </div>
      )}

      {/* Notifications */}
      <div className="px-3 pb-2 relative">
        <button
          onClick={() => { setShowNotifs((v) => !v); if (unreadCount > 0) markAllRead() }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-white/10 transition-colors"
        >
          <div className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          Notifications
        </button>
        {showNotifs && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-72 overflow-y-auto z-50">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucune notification</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div key={n.id} className={`px-4 py-3 border-b border-gray-50 last:border-0 ${!n.read_at ? 'bg-blue-50' : ''}`}>
                  <p className="text-xs font-semibold text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* User section */}
      <div className="px-3 py-4 border-t border-white/20">
        <Link
          to="/profil"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-white/10 transition-colors"
        >
          <User className="h-5 w-5" />
          <div className="overflow-hidden">
            <p className="truncate text-white font-semibold">{profile?.alias || profile?.full_name}</p>
            <p className="text-xs text-blue-200 capitalize">{profile?.role}</p>
          </div>
        </Link>
        <button
          onClick={signOut}
          className="mt-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-white/10 transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
