import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { StocksTab } from './ca/StocksTab'
import { TreasuryTab } from './ca/TreasuryTab'

export function CA() {
  const { isCA, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-[#0077b6] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isCA) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <ShieldAlert className="h-12 w-12 text-gray-300" />
        <p className="text-gray-500 text-sm">Accès réservé aux membres du Conseil d'Administration.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Espace CA</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestion des stocks buvette et de la trésorerie</p>
      </div>

      <Tabs defaultValue="stocks">
        <TabsList className="w-full">
          <TabsTrigger value="stocks" className="flex-1">📦 Stocks</TabsTrigger>
          <TabsTrigger value="treasury" className="flex-1">💰 Trésorerie</TabsTrigger>
        </TabsList>
        <TabsContent value="stocks" className="pt-4">
          <StocksTab />
        </TabsContent>
        <TabsContent value="treasury" className="pt-4">
          <TreasuryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
