import { Shield, AlertTriangle, XCircle, CheckCircle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { useCompliance } from '../../hooks/useCompliance'
import { canUseCaci } from '../../lib/compliance'
import { formatDate } from '../../lib/utils'
import type { Profile } from '../../types/database.types'

interface Props {
  profile: Profile
}

export function ComplianceWidget({ profile }: Props) {
  const { compliance } = useCompliance(profile.id, profile.brevet_level)
  const caci = canUseCaci(profile.brevet_level)

  const statusConfig = {
    valid: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50 border-green-200',
      title: 'Certificat médical valide',
      message: compliance.expiryDate
        ? `Valable jusqu'au ${formatDate(compliance.expiryDate)}`
        : 'Document en règle',
    },
    expiring_soon: {
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50 border-orange-200',
      title: 'Certificat expirant bientôt',
      message: compliance.expiryDate
        ? `Expire le ${formatDate(compliance.expiryDate)} — pensez à le renouveler`
        : 'Expire dans moins de 30 jours',
    },
    expired: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50 border-red-200',
      title: 'Certificat expiré — plongée interdite',
      message: 'Selon les règles LIFRAS, vous ne pouvez pas participer aux séances tant que votre certificat n\'est pas renouvelé.',
    },
    missing: {
      icon: Shield,
      color: 'text-gray-500',
      bg: 'bg-gray-50 border-gray-200',
      title: 'Aucun certificat médical',
      message: 'Veuillez télécharger votre certificat médical ou formulaire CACI.',
    },
  }

  const config = statusConfig[compliance.medical]
  const Icon = config.icon

  return (
    <Card className={`border ${config.bg}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-5 w-5 ${config.color}`} />
          Conformité médicale LIFRAS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className={`font-semibold text-sm ${config.color}`}>{config.title}</p>
          <p className="text-sm text-gray-600 mt-0.5">{config.message}</p>
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex gap-2">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700">
            <p className="font-semibold mb-1">Règles LIFRAS :</p>
            <p>
              Tout plongeur doit être en possession d'un certificat médical valide avant toute séance piscine ou eau libre.{' '}
              {caci
                ? 'En tant que NB ou P1★, vous pouvez utiliser le formulaire CACI auto-déclaratif (depuis 2024).'
                : 'À partir de P2★, la visite médicale chez un médecin est obligatoire.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
