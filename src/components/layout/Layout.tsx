import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'
import { PullToRefreshIndicator } from '../PullToRefresh'
import { usePullToRefresh } from '../../hooks/usePullToRefresh'

export function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()

  // Pull-to-refresh : recharge la page active
  const { refreshing, pullDistance } = usePullToRefresh(async () => {
    window.dispatchEvent(new CustomEvent('cpf:refresh'))
  })

  return (
    <div className="flex h-[100dvh] overflow-hidden">

      <PullToRefreshIndicator refreshing={refreshing} pullDistance={pullDistance} />

      {/* Sidebar desktop — flex item fixe, ne participe pas au scroll */}
      <div className="hidden md:flex w-64 shrink-0 h-[100dvh]">
        <Navbar />
      </div>

      {/* Overlay mobile nav */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar mobile (drawer) */}
      <div className={`
        fixed top-0 left-0 h-full z-50 md:hidden transition-transform duration-300
        ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Navbar onClose={() => setMobileNavOpen(false)} />
      </div>

      {/* Contenu principal — scrolle indépendamment de la sidebar */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
        {/* Header mobile avec burger */}
        <MobileHeader onMenuOpen={() => setMobileNavOpen(true)} />

        <main
          className="flex-1 overflow-y-auto pb-20 md:pb-0"
          key={location.pathname}
          style={{
            backgroundImage: "linear-gradient(rgba(8,28,60,0.52),rgba(8,28,60,0.52)),url('/image-plongee.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'local',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
