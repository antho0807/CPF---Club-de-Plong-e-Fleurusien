import { useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Briefcase, MoreHorizontal,
  Settings, Info, FileText, Bell, Users, ShieldCheck,
  LogOut, ChevronRight,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { BREVET_LABELS } from '../../lib/compliance'
import { AvatarDisplay } from '../members/AvatarDisplay'
import type { BrevetLevel } from '../../types/database.types'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  moniteur: 'Moniteur',
  membre: 'Membre',
  externe: 'Membre externe',
}

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAdmin, isCA, isExterne, profile, signOut } = useAuth()
  const { unreadCount } = useNotifications(profile?.id)
  const [showMore, setShowMore] = useState(false)
  const startY = useRef<number | null>(null)

  const roleLabel = profile?.role ? (ROLE_LABELS[profile.role] ?? profile.role) : ''
  const brevetLabel = profile?.brevet_level
    ? BREVET_LABELS[profile.brevet_level as BrevetLevel]
    : null
  const displayRole = [roleLabel, brevetLabel].filter(Boolean).join(' · ')

  // Onglets principaux
  const mainTabs = [
    { to: '/', label: 'Accueil', icon: LayoutDashboard },
    { to: '/calendrier', label: 'Calendrier', icon: Calendar },
    ...(isAdmin || isCA ? [{ to: '/ca', label: 'Espace CA', icon: Briefcase }] : []),
  ]

  function isActive(to: string) {
    return location.pathname === to
  }

  function handleMoreClose() {
    setShowMore(false)
  }

  function navigate_and_close(to: string) {
    navigate(to)
    setShowMore(false)
  }

  // Swipe down pour fermer
  function onTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (startY.current === null) return
    const delta = e.changedTouches[0].clientY - startY.current
    if (delta > 60) setShowMore(false)
    startY.current = null
  }

  return (
    <>
      {/* ── Barre de navigation du bas ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex">
          {mainTabs.map(({ to, label, icon: Icon }) => {
            const active = isActive(to)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center pt-2.5 pb-2 gap-0.5 text-[10px] font-semibold tracking-wide transition-colors',
                  active ? 'text-[#0077b6]' : 'text-gray-400',
                )}
              >
                <Icon className={cn('h-5 w-5', active ? 'text-[#0077b6]' : 'text-gray-400')} />
                {label}
              </Link>
            )
          })}

          {/* Bouton Plus */}
          <button
            onClick={() => setShowMore(true)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center pt-2.5 pb-2 gap-0.5 text-[10px] font-semibold tracking-wide transition-colors',
              showMore ? 'text-[#0077b6]' : 'text-gray-400',
            )}
          >
            <MoreHorizontal className={cn('h-5 w-5', showMore ? 'text-[#0077b6]' : 'text-gray-400')} />
            Plus
          </button>
        </div>
      </nav>

      {/* ── Bottom Sheet "Plus" ── */}
      {showMore && (
        <div className="md:hidden fixed inset-0 z-50" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" onClick={handleMoreClose} />

          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[20px] shadow-2xl overflow-hidden"
            style={{
              maxHeight: '80vh',
              animation: 'slideUpSheet 0.3s ease-out',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 24px)' }}>
              {/* ── Bloc profil ── */}
              {profile && (
                <button
                  onClick={() => navigate_and_close('/parametres?tab=account')}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                >
                  <AvatarDisplay
                    avatarUrl={profile.avatar_url}
                    name={profile.full_name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">
                      {profile.alias || profile.full_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{displayRole}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                </button>
              )}

              {/* ── Séparateur ── */}
              <div className="h-px bg-gray-100 mx-5" />

              {/* ── Navigation principale ── */}
              <div className="py-1.5">
                <SheetItem icon={Settings} label="Paramètres" to="/parametres" onNav={navigate_and_close} />
                <SheetItem icon={Info} label="Le Club" to="/club" onNav={navigate_and_close} />
                {!isExterne && (
                  <SheetItem icon={FileText} label="Documents" to="/profil" onNav={navigate_and_close} />
                )}
                <SheetItem
                  icon={Bell}
                  label="Notifications"
                  to="/notifications"
                  onNav={navigate_and_close}
                  badge={unreadCount}
                />
              </div>

              {/* ── Section admin ── */}
              {isAdmin && (
                <>
                  <div className="h-px bg-gray-100 mx-5" />
                  <div className="py-1.5">
                    <SheetItem icon={Users} label="Membres" to="/membres" onNav={navigate_and_close} />
                    <SheetItem icon={ShieldCheck} label="Approbations" to="/admin/approbations" onNav={navigate_and_close} />
                  </div>
                </>
              )}

              {/* ── Déconnexion ── */}
              <div className="h-px bg-gray-100 mx-5" />
              <div className="py-1.5 pb-3">
                <button
                  onClick={async () => { setShowMore(false); await signOut() }}
                  className="w-full flex items-center gap-4 px-5 py-3 hover:bg-red-50 active:bg-red-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <LogOut className="h-4.5 w-4.5 text-red-500" style={{ width: 18, height: 18 }} />
                  </div>
                  <span className="text-sm font-medium text-red-500 flex-1 text-left">Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Composant item du sheet ──────────────────────────────────
function SheetItem({
  icon: Icon, label, to, onNav, badge,
}: {
  icon: React.ElementType
  label: string
  to: string
  onNav: (to: string) => void
  badge?: number
}) {
  return (
    <button
      onClick={() => onNav(to)}
      className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4.5 w-4.5 text-gray-600" style={{ width: 18, height: 18 }} />
      </div>
      <span className="text-sm font-medium text-gray-800 flex-1 text-left">{label}</span>
      {!!badge && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 mr-1">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
    </button>
  )
}
