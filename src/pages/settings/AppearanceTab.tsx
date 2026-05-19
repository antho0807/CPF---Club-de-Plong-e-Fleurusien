import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { useAppearance, WALLPAPER_OPTIONS, type Theme, type Wallpaper } from '../../hooks/useAppearance'
import { cn } from '../../lib/utils'

const THEMES: { id: Theme; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'light', label: 'Clair',       description: 'Toujours en mode clair', icon: Sun     },
  { id: 'dark',  label: 'Sombre',      description: 'Toujours en mode sombre', icon: Moon    },
  { id: 'auto',  label: 'Automatique', description: 'Suit les préférences système', icon: Monitor },
]

export function AppearanceTab() {
  const { settings, update } = useAppearance()

  return (
    <div className="space-y-8 max-w-2xl">

      {/* ── Thème ── */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Thème</h2>
        <p className="text-sm text-gray-500 mb-4">Choisissez l'apparence de l'interface.</p>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(t => {
            const Icon = t.icon
            const active = settings.theme === t.id
            return (
              <button
                key={t.id}
                onClick={() => update({ theme: t.id })}
                className={cn(
                  'relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center',
                  active
                    ? 'border-[#0077b6] bg-blue-50/60 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                )}
              >
                {active && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-[#0077b6] rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  active ? 'bg-[#0077b6]' : 'bg-gray-100',
                )}>
                  <Icon className={cn('h-5 w-5', active ? 'text-white' : 'text-gray-500')} />
                </div>
                <div>
                  <p className={cn('text-sm font-semibold', active ? 'text-[#0077b6]' : 'text-gray-800')}>{t.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{t.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Fond d'écran ── */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Fond d'écran</h2>
        <p className="text-sm text-gray-500 mb-4">Personnalisez l'arrière-plan de l'application.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {WALLPAPER_OPTIONS.map(w => {
            const active = settings.wallpaper === w.id
            return (
              <button
                key={w.id}
                onClick={() => update({ wallpaper: w.id as Wallpaper })}
                className={cn(
                  'relative rounded-2xl border-2 overflow-hidden transition-all',
                  active ? 'border-[#0077b6] shadow-lg scale-[1.02]' : 'border-gray-200 hover:border-gray-300',
                )}
              >
                {/* Aperçu */}
                <div
                  className="h-24 w-full"
                  style={w.style}
                />
                {/* Label */}
                <div className={cn(
                  'flex items-center justify-between px-3 py-2',
                  active ? 'bg-blue-50' : 'bg-white',
                )}>
                  <span className={cn('text-sm font-medium', active ? 'text-[#0077b6]' : 'text-gray-700')}>
                    {w.label}
                  </span>
                  {active && (
                    <div className="w-5 h-5 bg-[#0077b6] rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">Le fond s'applique à la zone de contenu principale sur toutes les pages.</p>
      </div>

      {/* ── Aperçu live ── */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Aperçu</h2>
        <div
          className="h-36 rounded-2xl overflow-hidden border border-gray-200 relative shadow-inner"
          style={WALLPAPER_OPTIONS.find(w => w.id === settings.wallpaper)?.style}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 shadow-sm border border-white/50 text-center">
              <p className="text-sm font-semibold text-gray-900">CPF Plongée</p>
              <p className="text-xs text-gray-500 mt-0.5">Club de Plongée Fleurusien</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
