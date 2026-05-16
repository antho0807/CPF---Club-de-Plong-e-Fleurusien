import { useCallback, useEffect, useState } from 'react'
import { supabase, getSignedUrls, removeStorageFile } from '../lib/supabase'
import type { MemberDocument } from '../types/database.types'

// Durée de validité des signed URLs (1 heure)
const SIGNED_URL_EXPIRY = 3600

export function useDocuments(memberId: string | undefined) {
  const [documents, setDocuments] = useState<MemberDocument[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!memberId) {
      setLoading(false)
      return
    }
    setLoading(true)

    const { data: docs, error } = await supabase
      .from('member_documents')
      .select('*')
      .eq('member_id', memberId)
      .order('uploaded_at', { ascending: false })

    if (error || !docs) {
      setDocuments([])
      setLoading(false)
      return
    }

    // Générer des signed URLs fraîches pour tous les fichiers du bucket privé
    const paths = docs
      .map((d) => d.storage_path)
      .filter((p): p is string => !!p)

    const signedUrls = await getSignedUrls(paths, SIGNED_URL_EXPIRY)

    // Injecter la signed URL dans file_url pour l'affichage
    const docsWithUrls: MemberDocument[] = docs.map((doc) => ({
      ...doc,
      file_url: (doc.storage_path && signedUrls[doc.storage_path])
        ? signedUrls[doc.storage_path]
        : doc.file_url,
    }))

    setDocuments(docsWithUrls)
    setLoading(false)
  }, [memberId])

  useEffect(() => {
    fetch()
  }, [fetch])

  async function uploadDocument(
    file: File,
    targetMemberId: string,
    type: MemberDocument['type'],
    expiryDate: string | null,
    notes: string | null,
    uploadedBy: string,
  ): Promise<void> {
    const ext = file.name.split('.').pop() ?? 'bin'
    const storagePath = `${targetMemberId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    // 1. Upload du fichier dans le bucket privé
    const { error: uploadError } = await supabase.storage
      .from('member-documents')
      .upload(storagePath, file, {
        upsert: false,
        contentType: file.type,
      })
    if (uploadError) throw uploadError

    // 2. Générer une signed URL initiale pour file_url (valable 1h)
    //    → sera régénérée à chaque rechargement via fetch()
    const { data: urlData } = await supabase.storage
      .from('member-documents')
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY)

    const fileUrl = urlData?.signedUrl ?? storagePath // fallback sur le chemin brut

    // 3. Enregistrement en base
    const { error: dbError } = await supabase.from('member_documents').insert({
      member_id: targetMemberId,
      type,
      file_url: fileUrl,
      storage_path: storagePath,
      filename: file.name,
      expiry_date: expiryDate,
      notes,
      uploaded_by: uploadedBy,
    })

    if (dbError) {
      // Nettoyage du fichier Storage en cas d'échec DB
      await removeStorageFile(storagePath)
      throw dbError
    }

    await fetch()
  }

  async function deleteDocument(id: string): Promise<void> {
    // Récupérer le storage_path avant de supprimer l'enregistrement
    const doc = documents.find((d) => d.id === id)

    // 1. Supprimer le fichier dans Storage
    if (doc?.storage_path) {
      await removeStorageFile(doc.storage_path)
      // Pas de throw si le fichier n'existe plus dans Storage
    }

    // 2. Supprimer l'enregistrement en base
    const { error } = await supabase
      .from('member_documents')
      .delete()
      .eq('id', id)

    if (error) throw error
    await fetch()
  }

  return {
    documents,
    loading,
    refetch: fetch,
    uploadDocument,
    deleteDocument,
  }
}
