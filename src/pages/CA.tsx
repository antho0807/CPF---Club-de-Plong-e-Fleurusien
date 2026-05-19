import { useAuth } from '../hooks/useAuth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { DashboardTab } from './ca/DashboardTab'
import { StocksTab } from './ca/StocksTab'
import { TreasuryTab } from './ca/TreasuryTab'
import { MeetingsTab } from './ca/MeetingsTab'
import { DocumentsTab } from './ca/DocumentsTab'
import { VotesTab } from './ca/VotesTab'

export function CA() {
  const { isCA, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-[#0077b6] border-t-transparent rounded-full" />
      </div>
    )
  }

  // Le ProtectedCARoute dans App.tsx redirige les non-CA avant même de monter ce composant.
  // Cette vérification est une sécurité supplémentaire côté affichage.
  if (!isCA) return null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Espace CA</h1>
        <p className="text-sm text-gray-500 mt-0.5">Conseil d'Administration — accès restreint</p>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="flex-wrap h-auto gap-1 mb-2">
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="meetings">📅 Réunions</TabsTrigger>
          <TabsTrigger value="votes">✅ Votes</TabsTrigger>
          <TabsTrigger value="documents">📄 Documents</TabsTrigger>
          <TabsTrigger value="stocks">📦 Stocks</TabsTrigger>
          <TabsTrigger value="treasury">💰 Trésorerie</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="pt-2"><DashboardTab /></TabsContent>
        <TabsContent value="meetings"  className="pt-2"><MeetingsTab /></TabsContent>
        <TabsContent value="votes"     className="pt-2"><VotesTab /></TabsContent>
        <TabsContent value="documents" className="pt-2"><DocumentsTab /></TabsContent>
        <TabsContent value="stocks"    className="pt-2"><StocksTab /></TabsContent>
        <TabsContent value="treasury"  className="pt-2"><TreasuryTab /></TabsContent>
      </Tabs>
    </div>
  )
}
