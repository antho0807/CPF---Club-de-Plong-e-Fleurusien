import { Menu } from 'lucide-react'

interface Props {
  onMenuOpen: () => void
}

export function MobileHeader({ onMenuOpen }: Props) {
  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#0077b6] text-white sticky top-0 z-30">
      <button
        onClick={onMenuOpen}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <img src="/logo-cpf.png" alt="CPF" className="h-7 w-7 object-contain" />
      <span className="font-bold text-sm">CPF Plongée</span>
    </header>
  )
}
