import { Link } from 'react-router-dom'
import { Plus, UserPlus, MapPin, Target, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { ComplianceWidget } from '../components/dashboard/ComplianceWidget'
import { StatsCards } from '../components/dashboard/StatsCards'
import { UpcomingEvents } from '../components/dashboard/UpcomingEvents'
import { ExternalEvents } from '../components/dashboard/ExternalEvents'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export function Dashboard() {
  const { profile, isAdmin, isMoniteur } = useAuth()

  if (!profile) return null

  const firstName = profile.full_name.split(' ')[0]
  const canManage = isAdmin || isMoniteur

  return (
    <div className="space-y-5">

      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bonjour {firstName} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">CPF — Club de Plongée Fleurusien · LIFRAS/CMAS</p>
      </div>

      {/* Cartes KPI — admin/moniteur */}
      {canManage && <StatsCards />}

      {/* Layout 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Colonne principale (2/3) */}
        <div className="lg:col-span-2 space-y-5">

          {/* Actions rapides */}
          {canManage && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">⚡ Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex flex-wrap gap-2">
                {isAdmin && (
                  <Link to="/membres?action=new">
                    <Button size="sm" className="gap-2">
                      <UserPlus className="h-4 w-4" /> Ajouter un membre
                    </Button>
                  </Link>
                )}
                <Link to="/calendrier?action=new">
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" /> Créer un événement
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/sites?action=new">
                    <Button size="sm" variant="outline" className="gap-2">
                      <MapPin className="h-4 w-4" /> Ajouter un site
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Prochains événements */}
          <UpcomingEvents />

          {/* Événements externes */}
          <ExternalEvents />
        </div>

        {/* Colonne latérale (1/3) */}
        <div className="space-y-5">

          {/* Conformité médicale */}
          <ComplianceWidget profile={profile} />

          {/* Objectifs — membres uniquement */}
          {!canManage && (
            <Card className="border-blue-100 bg-blue-50/40">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0077b6]/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-[#0077b6]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Mes objectifs</p>
                    <p className="text-xs text-gray-500">Progressez vers votre prochain brevet</p>
                  </div>
                </div>
                <Link to="/objectifs">
                  <Button variant="ghost" size="sm" className="gap-1 text-[#0077b6]">
                    Voir <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
