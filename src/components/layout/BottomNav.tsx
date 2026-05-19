import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Bell, MoreHorizontal, X,
  Settings, User, Info, FileText, Users, Shield, Briefcase,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'

export function BottomNav() {
  const location = useLocation()
  const { isAdmin, isCA, isExterne, profile } = useAuth()
  const { unreadCount } = useNotifications(profile?.id)
  const [showMore, setShowMore] = useState(false)

  // Onglets principaux (tous les rôles)
  const mainTabs = [
    { to: '/', label: 'Accueil', icon: LayoutDashboard },
    { to: '/calendrier', label: 'Calendrier', icon: Calendar },
    { to: '/parametres?tab=notifications', label: 'Notifs', icon: Bell, badge: unreadCount },
  ]

  // Items du "Plus" — selon le rôle
  const moreItems = [
    { to: '/parametres?tab=account', label: 'Mon profil', icon: User },
    { to: '/club', label: 'Le Club', icon: Info },
    { to: '/parametres', label: 'Paramètres', icon: Settings },
    ...(!isExterne ? [{ to: '/profil', label: 'Documents', icon: FileText }] : []),
    ...(isAdmin ? [
      { to: '/membres', label: 'Membres', icon: Users },
      { to: '/admin/approbations', label: 'Approbations', icon: Shield },
    ] : []),
    ...(isCA ? [{ to: '/ca', label: 'Espace CA', icon: Briefcase }] : []),
  ]

  function isActive(to: string) {
    const [path, query] = to.split('?')
    if (query) {
      return location.pathname === path && location.search.includes(query.split('=')[1])
    }
    return location.pathname === path
  }

  return (
    <>
      {/* Barre du bas */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
        <div className="flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {mainTabs.map(({ to, label, icon: Icon, badge }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2.5 text-xs font-medium transition-colors',
                  active ? 'text-[#0077b6]' : 'text-gray-400',
                )}
              >
                <div className="relative mb-0.5">
                  <Icon className="h-5 w-5" />
                  {!!badge && badge > 0 && (
                    <span className="absolute -top-1 -right-1.5 bg-orange-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold leading-none">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                {label}
              </Link>
            )
          })}

          {/* Bouton Plus */}
          <button
            onClick={() => setShowMore(true)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2.5 text-xs font-medium transition-colors',
              showMore ? 'text-[#0077b6]' : 'text-gray-400',
            )}
          >
            <MoreHorizontal className="h-5 w-5 mb-0.5" />
            Plus
          </button>
        </div>
      </nav>

      {/* Bottom sheet "Plus" */}
      {showMore && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end"
          onClick={() => setShowMore(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white w-full rounded-t-2xl shadow-2xl overflow-hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="font-semibold text-gray-900 text-sm">Menu</p>
              <button
                onClick={() => setShowMore(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="py-2 max-h-[60vh] overflow-y-auto">
              {moreItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors active:bg-gray-100"
                  onClick={() => setShowMore(false)}
                >
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
