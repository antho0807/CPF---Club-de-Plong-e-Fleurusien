import { useSearchParams, Link } from 'react-router-dom'
import {
  Settings as SettingsIcon, User, Bell, Shield,
  Smartphone, CheckCircle, Sun, Moon, Monitor,
  Palette, ChevronRight,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { NotificationsTab } from './settings/NotificationsTab'
import { AccountTab } from './settings/AccountTab'
import { SecurityTab } from './settings/SecurityTab'
import { AppearanceTab } from './settings/AppearanceTab'
import { usePWAInstall } from '../hooks/usePWAInstall'
import { useAppearance } from '../hooks/useAppearance'
import { cn } from '../lib/utils'

const SECTIONS = [
  { id: 'appearance', label: 'Apparence',    icon: Palette  },
  { id: 'account',    label: 'Mon compte',   icon: User     },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security',   label: 'Sécurité',     icon: Shield   },
]

export function Settings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'appearance'
  const { isStandalone } = usePWAInstall()
  const { settings } = useAppearance()

  const themeIcon = settings.theme === 'dark' ? Moon : settings.theme === 'light' ? Sun : Monitor

  function setTab(t: string) { setSearchParams({ tab: t }) }

  return (
    <div className="space-y-4">
      {/* ── En-tête ── */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 text-gray-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-sm text-gray-500 mt-0.5">Apparence, compte et préférences</p>
        </div>
      </div>

      {/* ── Layout desktop : 2 colonnes / mobile : tabs ── */}

      {/* Mobile : tabs compactes */}
      <div className="md:hidden">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto gap-1 mb-4">
            <TabsTrigger value="appearance">🎨 Apparence</TabsTrigger>
            <TabsTrigger value="account">👤 Mon compte</TabsTrigger>
            <TabsTrigger value="notifications">🔔 Notifications</TabsTrigger>
            <TabsTrigger value="security">🔒 Sécurité</TabsTrigger>
          </TabsList>
          <TabsContent value="appearance"    className="pt-2"><AppearanceTab /></TabsContent>
          <TabsContent value="account"       className="pt-2"><AccountTab /></TabsContent>
          <TabsContent value="notifications" className="pt-2"><NotificationsTab /></TabsContent>
          <TabsContent value="security"      className="pt-2"><SecurityTab /></TabsContent>
        </Tabs>

        {/* App section mobile */}
        <div className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Application</p>
          </div>
          {isStandalone ? (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-800">App déjà installée</p>
                <p className="text-xs text-gray-400">Tu utilises l'app depuis ton écran d'accueil.</p>
              </div>
            </div>
          ) : (
            <Link to="/installer-app" className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
              <Smartphone className="h-5 w-5 text-[#0077b6] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Installer l'app sur mon téléphone</p>
                <p className="text-xs text-gray-400">Guide iOS et Android</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </Link>
          )}
        </div>
      </div>

      {/* Desktop : 2 colonnes */}
      <div className="hidden md:flex gap-6 min-h-[600px]">
        {/* Colonne gauche — nav */}
        <div className="w-56 shrink-0 space-y-1">
          {SECTIONS.map(s => {
            const Icon = s.icon
            return (
              <button
                key={s.id}
                onClick={() => setTab(s.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                  tab === s.id
                    ? 'bg-[#0077b6] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                <Icon className="h-4.5 w-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
                {s.label}
              </button>
            )
          })}

          <div className="pt-4 border-t border-gray-100 mt-2 space-y-1">
            {/* Thème actuel — raccourci */}
            <button
              onClick={() => setTab('appearance')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {settings.theme === 'dark' ? <Moon className="h-4 w-4" /> : settings.theme === 'light' ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
              <span>{settings.theme === 'auto' ? 'Thème auto' : settings.theme === 'dark' ? 'Mode sombre' : 'Mode clair'}</span>
            </button>

            {/* Installer l'app */}
            {!isStandalone ? (
              <Link to="/installer-app" className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-100 transition-colors">
                <Smartphone className="h-4 w-4" />
                Installer l'app
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2 text-xs text-green-600">
                <CheckCircle className="h-4 w-4" />
                App installée
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite — contenu */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {tab === 'appearance'    && <div className="p-6"><AppearanceTab /></div>}
          {tab === 'account'       && <div className="p-6"><AccountTab /></div>}
          {tab === 'notifications' && <div className="p-6"><NotificationsTab /></div>}
          {tab === 'security'      && <div className="p-6"><SecurityTab /></div>}
        </div>
      </div>
    </div>
  )
}

