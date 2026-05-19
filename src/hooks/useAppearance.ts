import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'auto'
export type Wallpaper = 'diving' | 'gradient' | 'clean' | 'ocean_dark' | 'white'

export interface AppearanceSettings {
  theme: Theme
  wallpaper: Wallpaper
}

const DEFAULTS: AppearanceSettings = { theme: 'auto', wallpaper: 'diving' }
const KEY = 'cpf_appearance'

export const WALLPAPER_OPTIONS: { id: Wallpaper; label: string; preview: string; style: React.CSSProperties }[] = [
  {
    id: 'diving',
    label: 'Plongée',
    preview: '🤿',
    style: {
      backgroundImage: "linear-gradient(rgba(8,28,60,0.52),rgba(8,28,60,0.52)),url('/image-plongee.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'gradient',
    label: 'Bleu marin',
    preview: '🌊',
    style: { background: 'linear-gradient(135deg, #0a3d62 0%, #0077b6 50%, #00b4d8 100%)' },
  },
  {
    id: 'ocean_dark',
    label: 'Océan profond',
    preview: '🌑',
    style: { background: 'linear-gradient(160deg, #03045e 0%, #023e8a 40%, #0077b6 100%)' },
  },
  {
    id: 'clean',
    label: 'Épuré',
    preview: '☁️',
    style: { background: '#f1f5f9' },
  },
  {
    id: 'white',
    label: 'Blanc pur',
    preview: '⬜',
    style: { background: '#ffffff' },
  },
]

function load(): AppearanceSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* */ }
  return DEFAULTS
}

function save(s: AppearanceSettings) {
  localStorage.setItem(KEY, JSON.stringify(s))
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'auto' && prefersDark)
  root.classList.toggle('dark', isDark)
  root.setAttribute('data-theme', isDark ? 'dark' : 'light')
}

function getMainBgStyle(wallpaper: Wallpaper): React.CSSProperties {
  return WALLPAPER_OPTIONS.find(w => w.id === wallpaper)?.style ?? DEFAULTS_STYLE
}
const DEFAULTS_STYLE: React.CSSProperties = {}

export function useAppearance() {
  const [settings, setSettings] = useState<AppearanceSettings>(load)

  useEffect(() => {
    applyTheme(settings.theme)
  }, [settings.theme])

  // Écouter les changements de préférence système
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => { if (settings.theme === 'auto') applyTheme('auto') }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.theme])

  const update = useCallback((patch: Partial<AppearanceSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      save(next)
      return next
    })
  }, [])

  return {
    settings,
    mainBgStyle: getMainBgStyle(settings.wallpaper),
    update,
  }
}

// Singleton pour le Layout (pour éviter plusieurs instances)
let _cachedSettings: AppearanceSettings | null = null
export function getStoredAppearance(): AppearanceSettings {
  if (!_cachedSettings) _cachedSettings = load()
  return _cachedSettings
}
