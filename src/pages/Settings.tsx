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
        <TabsList className="w-full">
          <TabsTrigger value="notifications" className="flex-1">🔔 Notifications</TabsTrigger>
          <TabsTrigger value="account" className="flex-1">👤 Mon compte</TabsTrigger>
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
