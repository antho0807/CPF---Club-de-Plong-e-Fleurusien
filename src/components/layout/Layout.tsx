import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { BottomNav } from './BottomNav'

export function Layout() {
  return (
    <div className="flex min-h-screen relative">
      {/* Image de fond fixe */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url('/image.plongée.test.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Overlay sombre pour lisibilité */}
      <div className="fixed inset-0 -z-10 bg-black/50" />

      <Navbar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
