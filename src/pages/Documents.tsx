import { useAuth } from '../hooks/useAuth'
import { useDocuments } from '../hooks/useDocuments'
import { DocumentUpload } from '../components/documents/DocumentUpload'
import { DocumentList } from '../components/documents/DocumentList'

export function Documents() {
  const { profile } = useAuth()
  const { documents, refetch, uploadDocument, deleteDocument } = useDocuments(profile?.id)

  if (!profile) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes documents</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Gérez vos certificats médicaux et documents LIFRAS.
        </p>
      </div>

      <DocumentUpload
        memberId={profile.id}
        brevet={profile.brevet_level}
        uploadedBy={profile.id}
        onUploaded={refetch}
      />

      <DocumentList
        documents={documents}
        onDelete={deleteDocument}
      />
    </div>
  )
}
