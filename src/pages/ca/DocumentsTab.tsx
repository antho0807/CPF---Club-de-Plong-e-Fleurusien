import { useState, useCallback, useEffect, useRef } from 'react'
import { Upload, Download, Trash2, FileText, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import type { CADocument, DocumentCategory } from '../../types/database.types'

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  pv: '📋 Compte-rendu',
  statuts: '📜 Statuts',
  contrat: '📝 Contrat',
  finance: '💰 Finance',
  rapport: '📊 Rapport',
  autre: '📄 Autre',
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsTab() {
  const { profile, isAdmin } = useAuth()
  const [docs, setDocs] = useState<CADocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [docTitle, setDocTitle] = useState('')
  const [docCategory, setDocCategory] = useState<DocumentCategory>('autre')
  const fileRef = useRef<HTMLInputElement>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('ca_documents')
      .select('*, profiles(full_name, alias)')
      .order('created_at', { ascending: false })
    setDocs((data ?? []) as unknown as CADocument[])
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (file.size > 20 * 1024 * 1024) { setUploadError('Fichier trop volumineux (max 20 MB)'); return }
    setUploading(true); setUploadError(null)
    try {
      const ext = file.name.split('.').pop() ?? 'pdf'
      const path = `${profile.id}/${Date.now()}_${file.name}`
      const { error: upErr } = await supabase.storage.from('ca-documents').upload(path, file, { upsert: false })
      if (upErr) throw upErr
      const { error: dbErr } = await supabase.from('ca_documents').insert({
        title: docTitle || file.name.replace(/\.[^/.]+$/, ''),
        category: docCategory,
        storage_path: path,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: profile.id,
      })
      if (dbErr) throw dbErr
      setDocTitle(''); setDocCategory('autre')
      if (fileRef.current) fileRef.current.value = ''
      await refetch()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur upload')
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(doc: CADocument) {
    const { data } = await supabase.storage.from('ca-documents')
      .createSignedUrl(doc.storage_path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function handleDelete(doc: CADocument) {
    if (!confirm(`Supprimer "${doc.title}" ?`)) return
    await supabase.storage.from('ca-documents').remove([doc.storage_path])
    await supabase.from('ca_documents').delete().eq('id', doc.id)
    await refetch()
  }

  const filtered = filterCat === 'all' ? docs : docs.filter(d => d.category === filterCat)

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-[#0077b6] border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-5">
      {/* Zone d'upload */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 space-y-3">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Ajouter un document</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Titre</Label>
            <Input className="mt-1 text-sm" value={docTitle} onChange={e => setDocTitle(e.target.value)} placeholder="Laisser vide = nom du fichier" />
          </div>
          <div>
            <Label className="text-xs">Catégorie</Label>
            <Select value={docCategory} onValueChange={v => setDocCategory(v as DocumentCategory)}>
              <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(CATEGORY_LABELS) as [DocumentCategory, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={handleUpload} />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Upload…</> : <><Upload className="h-4 w-4" /> Choisir un fichier</>}
          </Button>
          {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCat('all')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterCat === 'all' ? 'bg-[#0077b6] text-white border-[#0077b6]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Tous ({docs.length})</button>
        {(Object.entries(CATEGORY_LABELS) as [DocumentCategory, string][]).map(([k, v]) => {
          const count = docs.filter(d => d.category === k).length
          if (count === 0) return null
          return <button key={k} onClick={() => setFilterCat(k)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterCat === k ? 'bg-[#0077b6] text-white border-[#0077b6]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>{v} ({count})</button>
        })}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Aucun document.</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => {
            const p = doc.profiles as { full_name?: string; alias?: string } | undefined
            return (
              <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{CATEGORY_LABELS[doc.category]}</Badge>
                    {doc.file_size && <span className="text-[10px] text-gray-400">{formatSize(doc.file_size)}</span>}
                    {p && <span className="text-[10px] text-gray-400">{p.alias || p.full_name}</span>}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => handleDownload(doc)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 transition-colors" title="Télécharger">
                    <Download className="h-4 w-4 text-[#0077b6]" />
                  </button>
                  {isAdmin && (
                    <button onClick={() => handleDelete(doc)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors" title="Supprimer">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
