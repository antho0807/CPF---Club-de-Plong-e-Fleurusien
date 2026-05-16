import { useState } from 'react'
import { Upload, AlertTriangle, Loader2, CalendarCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useDocuments } from '../../hooks/useDocuments'
import { canUseCaci, requiresMedicalDoctor } from '../../lib/compliance'
import { computeMedicalExpiry, formatDate } from '../../lib/utils'
import type { BrevetLevel, DocumentType } from '../../types/database.types'

interface Props {
  memberId: string
  brevet: BrevetLevel | null
  uploadedBy: string
  onUploaded: () => void
}

export function DocumentUpload({ memberId, brevet, uploadedBy, onUploaded }: Props) {
  const { uploadDocument } = useDocuments(memberId)
  const [type, setType] = useState<DocumentType>('certificat_medical')
  const [certDate, setCertDate] = useState('')       // date de la visite médicale
  const [expiryDate, setExpiryDate] = useState('')   // date d'expiration (manuelle pour non-médical)
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const caci = canUseCaci(brevet)
  const needsDoctor = requiresMedicalDoctor(brevet)
  const isMedical = type === 'certificat_medical' || type === 'caci'

  // Expiration calculée automatiquement pour les documents médicaux
  const computedExpiry = isMedical && certDate ? computeMedicalExpiry(certDate) : null

  function handleTypeChange(v: DocumentType) {
    setType(v)
    setCertDate('')
    setExpiryDate('')
    setError(null)
  }

  async function handleUpload() {
    if (!file) { setError('Sélectionnez un fichier.'); return }

    if (isMedical && !certDate) {
      setError('La date du certificat / de la visite médicale est obligatoire.')
      return
    }
    if (!isMedical && type !== 'carte_lifras' && !expiryDate) {
      setError("La date d'expiration est requise.")
      return
    }

    const finalExpiry = isMedical ? computedExpiry : expiryDate || null

    setError(null)
    setUploading(true)
    try {
      await uploadDocument(file, memberId, type, finalExpiry, notes || null, uploadedBy)
      setFile(null)
      setCertDate('')
      setExpiryDate('')
      setNotes('')
      onUploaded()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du téléversement.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-5 w-5 text-[#0077b6]" />
          Ajouter un document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Type de document</Label>
            <Select value={type} onValueChange={(v) => handleTypeChange(v as DocumentType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="carte_lifras">Carte de membre LIFRAS</SelectItem>
                <SelectItem value="certificat_medical">Attestation médicale (médecin)</SelectItem>
                {caci && <SelectItem value="caci">CACI auto-déclaratif (NB/P1★)</SelectItem>}
                <SelectItem value="autre">Autre document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isMedical ? (
            <div>
              <Label>Date du certificat / visite médicale *</Label>
              <Input
                type="date"
                className="mt-1"
                value={certDate}
                onChange={(e) => setCertDate(e.target.value)}
              />
            </div>
          ) : type === 'carte_lifras' ? null : (
            <div>
              <Label>Date d'expiration</Label>
              <Input
                type="date"
                className="mt-1"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Affichage de l'expiration calculée */}
        {computedExpiry && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
            <CalendarCheck className="h-4 w-4 flex-shrink-0 text-blue-600" />
            <span>
              Expiration calculée automatiquement : <strong>{formatDate(computedExpiry)}</strong>
            </span>
          </div>
        )}

        {type === 'caci' && needsDoctor && (
          <div className="flex gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200 text-sm text-orange-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Attention :</strong> Le formulaire CACI est réservé aux NB et P1★.
              À partir de P2★, une attestation médicale d'un médecin est obligatoire selon les règles LIFRAS.
            </p>
          </div>
        )}

        {needsDoctor && type === 'certificat_medical' && (
          <div className="flex gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>Ce membre (P2★ et supérieur) doit fournir une attestation établie par un médecin.</p>
          </div>
        )}

        <div>
          <Label>Fichier (PDF, JPG, PNG)</Label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#0077b6] file:text-white file:text-sm file:cursor-pointer hover:file:bg-[#005f8e]"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div>
          <Label>Notes (optionnel)</Label>
          <Input
            className="mt-1"
            placeholder="Remarques…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button onClick={handleUpload} disabled={uploading || !file} className="gap-2">
          {uploading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Téléversement…</>
            : <><Upload className="h-4 w-4" /> Téléverser</>}
        </Button>
      </CardContent>
    </Card>
  )
}
