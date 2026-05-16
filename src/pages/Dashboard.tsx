import { Link } from 'react-router-dom'
import { Plus, UserPlus, Calendar, MapPin } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { ComplianceWidget } from '../components/dashboard/ComplianceWidget'
import { StatsCards } from '../components/dashboard/StatsCards'
import { UpcomingEvents } from '../components/dashboard/UpcomingEvents'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

export function Dashboard() {
  const { profile, isAdmin } = useAuth()

  if (!profile) return null

  const firstName = profile.full_name.split(' ')[0]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour {firstName} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            CPF — Club de Plongée Fleurusien · LIFRAS/CMAS
          </p>
        </div>
      </div>

      {/* Admin stats */}
      {isAdmin && <StatsCards />}

      {/* Admin quick actions */}
      {isAdmin && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Actions rapides</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/membres?action=new">
                <Button size="sm" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Ajouter un membre
                </Button>
              </Link>
              <Link to="/calendrier?action=new">
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Créer un événement
                </Button>
              </Link>
              <Link to="/sites?action=new">
                <Button size="sm" variant="outline" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  Ajouter un site
                </Button>
              </Link>
              <Link to="/calendrier">
                <Button size="sm" variant="ghost" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Voir le calendrier
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance widget */}
      <ComplianceWidget profile={profile} />

      {/* Upcoming events */}
      <UpcomingEvents />
    </div>
  )
}
