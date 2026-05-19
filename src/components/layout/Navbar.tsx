import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, MapPin, Info, LogOut, User,
  ShieldCheck, Target, Lightbulb, Briefcase, Settings,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/',           label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/calendrier', label: 'Calendrier',       icon: Calendar },
  { to: '/objectifs',  label: 'Objectifs',        icon: Target },
  { to: '/sites',      label: 'Sites',            icon: MapPin },
  { to: '/utile',      label: 'Utile',            icon: Lightbulb },
  { to: '/club',       label: 'Le Club',          icon: Info },
]

interface NavbarProps { onClose?: () => void }

export function Navbar({ onClose }: NavbarProps = {}) {
  const { profile, signOut, isAdmin, isCA } = useAuth()
  const location = useLocation()

  return (
    <aside className="flex flex-col w-64 h-full overflow-y-auto bg-[#0077b6] text-white">
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
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to === '/club' && location.pathname.startsWith('/club'))
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
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
      </nav>

      {/* CA + Admin */}
      {(isCA || isAdmin) && (
        <div className="px-3 pb-2 border-t border-white/20 pt-2 space-y-1">
          {isCA && (
            <Link
              to="/ca"
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname === '/ca' ? 'bg-white text-[#0077b6]' : 'text-blue-100 hover:bg-white/10',
              )}
            >
              <Briefcase className="h-5 w-5 flex-shrink-0" />
              Espace CA
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin/approbations"
              onClick={onClose}
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
          )}
        </div>
      )}

      {/* Paramètres */}
      <div className="px-3 pb-2">
        <Link
          to="/parametres"
          onClick={onClose}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            location.pathname === '/parametres' ? 'bg-white text-[#0077b6]' : 'text-blue-100 hover:bg-white/10',
          )}
        >
          <Settings className="h-5 w-5" />
          Paramètres
        </Link>
      </div>

      {/* User section */}
      <div className="px-3 py-4 border-t border-white/20">
        <Link
          to="/parametres?tab=account"
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
