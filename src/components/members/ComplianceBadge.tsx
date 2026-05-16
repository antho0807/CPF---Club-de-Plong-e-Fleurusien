import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react'
import type { MedicalStatus } from '../../types/database.types'
import { cn } from '../../lib/utils'

interface Props {
  status: MedicalStatus
  expiryDate?: Date | null
  className?: string
}

export function ComplianceBadge({ status, expiryDate, className }: Props) {
  const configs = {
    valid: {
      icon: CheckCircle,
      text: 'Valide',
      className: 'bg-green-100 text-green-700',
    },
    expiring_soon: {
      icon: AlertTriangle,
      text: 'Expire bientôt',
      className: 'bg-orange-100 text-orange-700',
    },
    expired: {
      icon: XCircle,
      text: 'Expiré',
      className: 'bg-red-100 text-red-700',
    },
    missing: {
      icon: HelpCircle,
      text: 'Manquant',
      className: 'bg-gray-100 text-gray-600',
    },
  }

  const { icon: Icon, text, className: statusClass } = configs[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        statusClass,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {text}
      {expiryDate && status !== 'missing' && (
        <span className="ml-0.5 opacity-75">
          ({expiryDate.toLocaleDateString('fr-BE')})
        </span>
      )}
    </span>
  )
}
