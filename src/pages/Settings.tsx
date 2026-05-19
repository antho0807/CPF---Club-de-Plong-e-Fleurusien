import { Settings as SettingsIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { NotificationsTab } from './settings/NotificationsTab'
import { AccountTab } from './settings/AccountTab'

export function Settings() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 text-gray-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-sm text-gray-500 mt-0.5">Notifications, compte et préférences</p>
        </div>
      </div>

      <Tabs defaultValue="notifications">
        <TabsList className="flex-wrap h-auto gap-1 mb-4">
          <TabsTrigger value="notifications">🔔 Notifications</TabsTrigger>
          <TabsTrigger value="account">👤 Mon compte</TabsTrigger>
        </TabsList>
        <TabsContent value="notifications" className="pt-4">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="account" className="pt-4">
          <AccountTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
