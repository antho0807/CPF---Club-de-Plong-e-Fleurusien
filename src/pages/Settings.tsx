import { useSearchParams, Link } from 'react-router-dom'
import { Settings as SettingsIcon, Smartphone, CheckCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { NotificationsTab } from './settings/NotificationsTab'
import { AccountTab } from './settings/AccountTab'
import { SecurityTab } from './settings/SecurityTab'
import { usePWAInstall } from '../hooks/usePWAInstall'

export function Settings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'account'
  const { isStandalone, openGuide, showGuide, closeGuide, confirmInstalled, remindLater } = usePWAInstall()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 text-gray-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-sm text-gray-500 mt-0.5">Compte, notifications et sécurité</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })}>
        <TabsList className="flex-wrap h-auto gap-1 mb-4">
          <TabsTrigger value="account">👤 Mon compte</TabsTrigger>
          <TabsTrigger value="notifications">🔔 Notifications</TabsTrigger>
          <TabsTrigger value="security">🔒 Sécurité</TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="pt-2">
          <AccountTab />
        </TabsContent>
        <TabsContent value="notifications" className="pt-2">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="security" className="pt-2">
          <SecurityTab />
        </TabsContent>
      </Tabs>

      {/* Section Application */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
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
              <p className="text-xs text-gray-400">Guide étape par étape pour iOS et Android</p>
            </div>
            <span className="text-gray-300 text-sm">›</span>
          </Link>
        )}
      </div>

      {showGuide && (
        <div className="fixed inset-0 z-50">
          {/* Guide rendered from PWAInstall hook */}
        </div>
      )}
    </div>
  )
}
