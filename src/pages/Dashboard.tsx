import { Link } from 'react-router-dom'
import { Plus, UserPlus, MapPin, Target, ChevronRight, CheckCircle, AlertTriangle, XCircle, Shield } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCompliance } from '../hooks/useCompliance'
import { ComplianceWidget } from '../components/dashboard/ComplianceWidget'
import { StatsCards } from '../components/dashboard/StatsCards'
import { UpcomingEvents } from '../components/dashboard/UpcomingEvents'
import { ExternalEvents } from '../components/dashboard/ExternalEvents'
import { ObjectivesWidget } from '../components/dashboard/ObjectivesWidget'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { BREVET_LABELS } from '../lib/compliance'
import type { BrevetLevel } from '../types/database.types'

// ── Carte personnelle pour les membres ─────────────────────────
function MemberProfileCard() {
  const { profile } = useAuth()
  const { compliance } = useCompliance(profile?.id, profile?.brevet_level)

  if (!profile) return null

  const medicalInfo = {
    valid:          { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50',  msg: 'Votre certificat est valide 🎉' },
    expiring_soon:  { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50', msg: 'Pensez à renouveler votre certificat bientôt' },
    expired:        { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50',  msg: 'Certificat expiré — à renouveler pour plonger' },
    missing:        { icon: Shield, color: 'text-gray-400', bg: 'bg-gray-50',  msg: 'Ajoutez votre certificat médical' },
  }

  const med = medicalInfo[compliance.medical]
  const MedIcon = med.icon
  const brevetLabel = profile.brevet_level
    ? BREVET_LABELS[profile.brevet_level as BrevetLevel]
    : 'Non breveté'

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-gray-100">
        <CardTitle className="text-sm font-semibold text-gray-700">🤿 Mon espace plongeur</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">

        {/* Brevet */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Niveau</span>
          <span className="text-sm font-bold text-[#0077b6] bg-blue-50 px-3 py-1 rounded-full">
            {brevetLabel}
          </span>
        </div>

        {/* Certificat médical — présenté de façon humaine */}
        <div className={`flex items-start gap-3 p-3 rounded-xl ${med.bg}`}>
          <MedIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${med.color}`} />
          <p className={`text-xs font-medium ${med.color} leading-snug`}>{med.msg}</p>
        </div>

        {/* Lien vers profil */}
        <Link to="/profil">
          <Button variant="outline" size="sm" className="w-full gap-2 text-xs mt-1">
            Voir mon profil <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

// ── Dashboard principal ─────────────────────────────────────────
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

      {/* ── VUE ADMIN / MONITEUR ── */}
      {canManage && (
        <>
          {/* KPIs techniques : membres, médicaux */}
          <StatsCards />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-5">
              <Card>
                <CardHeader className="pb-3 border-b border-gray-100">
                  <CardTitle className="text-sm font-semibold text-gray-700">⚡ Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="pt-3 flex flex-wrap gap-2">
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
              <UpcomingEvents />
              <ExternalEvents />
            </div>

            {/* Colonne latérale admin */}
            <div className="space-y-5">
              <ComplianceWidget profile={profile} />
              <ObjectivesWidget />
            </div>
          </div>
        </>
      )}

      {/* ── VUE MEMBRE ── */}
      {!canManage && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-5">
            <UpcomingEvents />
            <ExternalEvents />
          </div>

          {/* Colonne latérale membre */}
          <div className="space-y-5">
            <MemberProfileCard />
            <ObjectivesWidget />
          </div>
        </div>
      )}

    </div>
  )
}
