import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'
import { PWABanner } from '../pwa/PWABanner'
import { PWAGuide } from '../pwa/PWAGuide'
import { usePWAInstall } from '../../hooks/usePWAInstall'
import { useAppearance } from '../../hooks/useAppearance'

export function Layout() {
  const location = useLocation()
  const pwa = usePWAInstall()
  const { mainBgStyle } = useAppearance()

  return (
    <div className="flex h-[100dvh] overflow-hidden">

      {/* Sidebar desktop uniquement */}
      <div className="hidden md:flex w-64 shrink-0 h-[100dvh]">
        <Navbar />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
        <MobileHeader />

        <main
          className="flex-1 overflow-y-auto pb-20 md:pb-0"
          key={location.pathname}
          style={{
            ...mainBgStyle,
            backgroundAttachment: 'local',
            overscrollBehaviorY: 'contain',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {pwa.showBanner && (
        <PWABanner onGuide={pwa.openGuide} onDismiss={pwa.dismiss} />
      )}
      {pwa.showGuide && (
        <PWAGuide
          onConfirm={pwa.confirmInstalled}
          onRemindLater={pwa.remindLater}
          onClose={pwa.closeGuide}
        />
      )}
      <BottomNav />
    </div>
  )
}
