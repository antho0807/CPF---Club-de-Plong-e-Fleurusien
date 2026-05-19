export function MobileHeader() {
  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#0077b6] text-white sticky top-0 z-30">
      <img src="/logo-cpf.png" alt="CPF" className="h-7 w-7 object-contain" />
      <span className="font-bold text-sm">CPF Plongée</span>
    </header>
  )
}
