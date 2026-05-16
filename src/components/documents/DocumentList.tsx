import { FileText, Trash2, ExternalLink, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ComplianceBadge } from '../members/ComplianceBadge'
import { getMedicalExpiryStatus } from '../../lib/compliance'
import { formatDate } from '../../lib/utils'
import type { MemberDocument } from '../../types/database.types'

const TYPE_LABELS: Record<MemberDocument['type'], string> = {
  carte_lifras: 'Carte LIFRAS',
  certificat_medical: 'Attestation médicale',
  caci: 'CACI auto-déclaratif',
  autre: 'Autre',
}

interface Props {
  documents: MemberDocument[]
  onDelete?: (id: string) => Promise<void>
}

export function DocumentList({ documents, onDelete }: Props) {
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500 text-sm">
          Aucun document enregistré.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5 text-[#0077b6]" />
          Documents ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {documents.map((doc) => {
          const isMedical = doc.type === 'certificat_medical' || doc.type === 'caci'
          const status = isMedical && doc.expiry_date
            ? getMedicalExpiryStatus(new Date(doc.expiry_date))
            : null

          return (
            <div key={doc.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">
                    {TYPE_LABELS[doc.type]}
                  </p>
                  {status && <ComplianceBadge status={status} />}
                </div>
                {doc.filename && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.filename}</p>
                )}
                {doc.expiry_date && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    Expire le {formatDate(doc.expiry_date)}
                  </div>
                )}
                {doc.notes && (
                  <p className="text-xs text-gray-500 mt-1 italic">{doc.notes}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Téléversé le {formatDate(doc.uploaded_at)}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
