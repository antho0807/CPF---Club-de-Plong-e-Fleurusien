import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { BREVET_LABELS } from '../../lib/compliance'
import type { BrevetLevel, DiveSite, SiteType } from '../../types/database.types'

const DEFAULT_SAFETY_RULES = `Règles de sécurité LIFRAS applicables sur ce site :
• Certificat médical valide obligatoire pour tous les plongeurs (≥14 ans)
• Palanquée minimum : 2 plongeurs
• Brevet minimum requis respecté (voir fiche site)
• Palier de sécurité à 5m / 3 minutes obligatoire
• Bouée de signalement de surface (SMB) recommandée
• Plongée interdite en cas d'aptitude médicale suspendue
• Après tout accident de plongée, reprise interdite sans nouvel examen médical
• Signalement au responsable de palanquée avant toute descente`

const DEFAULT_EMERGENCY = `Centre hyperbare de référence Belgique :
CHU de Liège — Service de médecine hyperbare
Tel: +32 4 366 71 11
SECOURS : 112`

interface FormData {
  name: string
  site_type: string
  address: string
  gps_lat: string
  gps_lng: string
  country: string
  max_depth: string
  visibility_avg: string
  description: string
  safety_rules: string
  access_instructions: string
  facilities: string
  emergency_contacts: string
  min_brevet: string
  booking_url: string
}

interface Props {
  initial?: Partial<DiveSite>
  createdBy: string
  onSubmit: (data: Partial<DiveSite>) => Promise<void>
  onCancel: () => void
}

export function SiteForm({ initial, createdBy, onSubmit, onCancel }: Props) {
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: {
      name: initial?.name ?? '',
      site_type: initial?.site_type ?? 'carriere',
      address: initial?.address ?? '',
      gps_lat: initial?.gps_lat?.toString() ?? '',
      gps_lng: initial?.gps_lng?.toString() ?? '',
      country: initial?.country ?? 'BE',
      max_depth: initial?.max_depth?.toString() ?? '',
      visibility_avg: initial?.visibility_avg?.toString() ?? '',
      description: initial?.description ?? '',
      safety_rules: initial?.safety_rules ?? DEFAULT_SAFETY_RULES,
      access_instructions: initial?.access_instructions ?? '',
      facilities: initial?.facilities ?? '',
      emergency_contacts: initial?.emergency_contacts ?? DEFAULT_EMERGENCY,
      min_brevet: initial?.min_brevet ?? '',
      booking_url: initial?.booking_url ?? '',
    },
  })

  const siteType = watch('site_type')
  const minBrevet = watch('min_brevet')

  async function submit(data: FormData) {
    if (!data.name) return
    setSubmitting(true)
    await onSubmit({
      name: data.name,
      site_type: data.site_type as SiteType,
      address: data.address || null,
      gps_lat: data.gps_lat ? parseFloat(data.gps_lat) : null,
      gps_lng: data.gps_lng ? parseFloat(data.gps_lng) : null,
      country: data.country || 'BE',
      max_depth: data.max_depth ? parseInt(data.max_depth) : null,
      visibility_avg: data.visibility_avg ? parseInt(data.visibility_avg) : null,
      description: data.description || null,
      safety_rules: data.safety_rules || null,
      access_instructions: data.access_instructions || null,
      facilities: data.facilities || null,
      emergency_contacts: data.emergency_contacts || null,
      min_brevet: (data.min_brevet as BrevetLevel) || null,
      booking_url: data.booking_url || null,
      created_by: createdBy,
    })
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label>Nom du site *</Label>
          <Input className="mt-1" {...register('name', { required: true })} />
        </div>

        <div>
          <Label>Type</Label>
          <Select value={siteType} onValueChange={(v) => setValue('site_type', v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="piscine">Piscine</SelectItem>
              <SelectItem value="mer">Mer</SelectItem>
              <SelectItem value="lac">Lac</SelectItem>
              <SelectItem value="carriere">Carrière</SelectItem>
              <SelectItem value="fosse">Fosse</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Brevet minimum</Label>
          <Select value={minBrevet} onValueChange={(v) => setValue('min_brevet', v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Aucun requis" /></SelectTrigger>
            <SelectContent>
              {(Object.entries(BREVET_LABELS) as [BrevetLevel, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2">
          <Label>Adresse</Label>
          <Input className="mt-1" {...register('address')} />
        </div>

        <div>
          <Label>Latitude GPS</Label>
          <Input type="number" step="any" className="mt-1" {...register('gps_lat')} />
        </div>
        <div>
          <Label>Longitude GPS</Label>
          <Input type="number" step="any" className="mt-1" {...register('gps_lng')} />
        </div>
        <div>
          <Label>Profondeur max (m)</Label>
          <Input type="number" className="mt-1" {...register('max_depth')} />
        </div>
        <div>
          <Label>Visibilité moyenne (m)</Label>
          <Input type="number" className="mt-1" {...register('visibility_avg')} />
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea className="mt-1" rows={3} {...register('description')} />
      </div>

      <div>
        <Label>Accès et stationnement</Label>
        <Textarea className="mt-1" rows={2} {...register('access_instructions')} />
      </div>

      <div>
        <Label>Équipements (parking, vestiaires, douches…)</Label>
        <Textarea className="mt-1" rows={2} {...register('facilities')} />
      </div>

      <div>
        <Label>Règles de sécurité LIFRAS</Label>
        <Textarea className="mt-1" rows={6} {...register('safety_rules')} />
      </div>

      <div>
        <Label>Contacts d'urgence</Label>
        <Textarea className="mt-1" rows={4} {...register('emergency_contacts')} />
      </div>

      <div>
        <Label>URL de réservation en ligne</Label>
        <Input
          type="url"
          className="mt-1"
          placeholder="https://..."
          {...register('booking_url')}
        />
        <p className="text-xs text-gray-400 mt-1">Si renseignée, un bouton "Réserver en ligne" apparaîtra sur la fiche du site.</p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</> : 'Enregistrer'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
      </div>
    </form>
  )
}
