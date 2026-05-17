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
    <div
      className="flex min-h-[100dvh] relative"
      style={{
        backgroundImage: "url('/bg-plongee.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="fixed inset-0 -z-10 bg-black/50" />

      <PullToRefreshIndicator refreshing={refreshing} pullDistance={pullDistance} />

      {/* Sidebar desktop */}
      <Navbar />

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

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile avec burger */}
        <MobileHeader onMenuOpen={() => setMobileNavOpen(true)} />

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 pt-0 md:pt-0" key={location.pathname}>
          <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
