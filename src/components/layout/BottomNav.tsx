import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Calendar, Users, Target, User } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'

export function BottomNav() {
  const location = useLocation()
  const { isAdmin, isMoniteur, isExterne } = useAuth()
  const canManage = isAdmin || isMoniteur

  const tabs = isExterne
    ? [
        { to: '/', label: 'Accueil', icon: LayoutDashboard },
        { to: '/calendrier', label: 'Agenda', icon: Calendar },
        { to: '/profil', label: 'Profil', icon: User },
      ]
    : [
        { to: '/', label: 'Accueil', icon: LayoutDashboard },
        { to: '/calendrier', label: 'Agenda', icon: Calendar },
        ...(canManage ? [{ to: '/membres', label: 'Membres', icon: Users }] : []),
        { to: '/objectifs', label: 'Objectifs', icon: Target },
        { to: '/profil', label: 'Profil', icon: User },
      ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors',
                active ? 'text-[#0077b6]' : 'text-gray-500',
              )}
            >
              <Icon className={cn('h-5 w-5 mb-0.5', active && 'text-[#0077b6]')} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
