import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'

export function Layout() {
  const location = useLocation()

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
            backgroundImage: "linear-gradient(rgba(8,28,60,0.52),rgba(8,28,60,0.52)),url('/image-plongee.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'local',
            overscrollBehaviorY: 'contain',
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
