import { X, Smartphone } from 'lucide-react'

interface Props {
  onGuide: () => void
  onDismiss: () => void
}

export function PWABanner({ onGuide, onDismiss }: Props) {
  return (
    <div
      className="md:hidden fixed left-0 right-0 z-[55] bg-[#0077b6] text-white flex items-center gap-3 px-4 shadow-lg"
      style={{
        bottom: 'calc(60px + env(safe-area-inset-bottom))',
        height: '48px',
        animation: 'slideUpSheet 0.3s ease-out',
      }}
    >
      <Smartphone className="h-4 w-4 flex-shrink-0 opacity-90" />
      <span className="text-sm font-medium flex-1 truncate">📲 Installe l'app CPF !</span>
      <button
        onClick={onGuide}
        className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors flex-shrink-0"
      >
        Guide
      </button>
      <button
        onClick={onDismiss}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
