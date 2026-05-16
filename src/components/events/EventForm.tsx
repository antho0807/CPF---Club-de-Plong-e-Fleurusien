import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { BREVET_LABELS, getCreatableEventTypes } from '../../lib/compliance'
import { EVENT_TYPE_LABELS } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import type { BrevetLevel, DiveSite, Event, EventType, UserRole } from '../../types/database.types'

interface FormData {
  title: string
  event_type: string
  date_start: string
  date_end: string
  registration_deadline: string
  location_id: string
  max_participants: string
  min_brevet: string
  description: string
  meeting_point: string
  carpooling_info: string
  equipment_needed: string
}

interface Props {
  initial?: Partial<Event>
  createdBy: string
  creatorRole?: UserRole
  creatorBrevet?: BrevetLevel | null
  onSubmit: (data: Partial<Event>) => Promise<void>
  onCancel: () => void
}

export function EventForm({ initial, createdBy, creatorRole = 'membre', creatorBrevet = null, onSubmit, onCancel }: Props) {
  const [sites, setSites] = useState<DiveSite[]>([])
  const [submitting, setSubmitting] = useState(false)
  const allowedTypes = getCreatableEventTypes(creatorRole, creatorBrevet)

  useEffect(() => {
    supabase.from('dive_sites').select('*').order('name')
      .then(({ data }) => setSites((data ?? []) as DiveSite[]))
  }, [])

  const { register, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: {
      title: initial?.title ?? '',
      event_type: initial?.event_type ?? 'sortie_mer',
      date_start: initial?.date_start ? initial.date_start.slice(0, 16) : '',
      date_end: initial?.date_end ? initial.date_end.slice(0, 16) : '',
      registration_deadline: initial?.registration_deadline ? initial.registration_deadline.slice(0, 16) : '',
      location_id: initial?.location_id ?? '',
      max_participants: initial?.max_participants?.toString() ?? '',
      min_brevet: initial?.min_brevet ?? '',
      description: initial?.description ?? '',
      meeting_point: initial?.meeting_point ?? '',
      carpooling_info: initial?.carpooling_info ?? '',
      equipment_needed: initial?.equipment_needed ?? '',
    },
  })

  const eventType = watch('event_type')
  const locationId = watch('location_id')
  const minBrevet = watch('min_brevet')

  async function submit(data: FormData) {
    if (!data.title || !data.date_start) return
    setSubmitting(true)
    await onSubmit({
      title: data.title,
      event_type: data.event_type as EventType,
      date_start: new Date(data.date_start).toISOString(),
      date_end: data.date_end ? new Date(data.date_end).toISOString() : null,
      registration_deadline: data.registration_deadline ? new Date(data.registration_deadline).toISOString() : null,
      location_id: data.location_id || null,
      max_participants: data.max_participants ? parseInt(data.max_participants) : null,
      min_brevet: (data.min_brevet as BrevetLevel) || null,
      description: data.description || null,
      meeting_point: data.meeting_point || null,
      carpooling_info: data.carpooling_info || null,
      equipment_needed: data.equipment_needed || null,
      created_by: createdBy,
    })
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label>Titre *</Label>
          <Input className="mt-1" {...register('title', { required: true })} />
        </div>

        <div>
          <Label>Type d'événement</Label>
          <Select value={eventType} onValueChange={(v) => setValue('event_type', v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][])
                .filter(([k]) => allowedTypes.includes(k))
                .map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Site de plongée</Label>
          <Select value={locationId} onValueChange={(v) => setValue('location_id', v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner un site..." /></SelectTrigger>
            <SelectContent>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Début *</Label>
          <Input type="datetime-local" className="mt-1" {...register('date_start', { required: true })} />
        </div>

        <div>
          <Label>Fin</Label>
          <Input type="datetime-local" className="mt-1" {...register('date_end')} />
        </div>

        <div className="sm:col-span-2">
          <Label>Deadline d'inscription</Label>
          <Input
            type="datetime-local"
            className="mt-1"
            {...register('registration_deadline')}
          />
          <p className="text-xs text-gray-400 mt-1">Après cette date, les inscriptions seront fermées automatiquement.</p>
        </div>

        <div>
          <Label>Places max</Label>
          <Input type="number" min="1" className="mt-1" {...register('max_participants')} />
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

        <div>
          <Label>Lieu de rendez-vous</Label>
          <Input className="mt-1" placeholder="Adresse du parking, entrée..." {...register('meeting_point')} />
        </div>

        <div>
          <Label>Covoiturage</Label>
          <Input className="mt-1" placeholder="Infos covoiturage..." {...register('carpooling_info')} />
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea className="mt-1" rows={3} {...register('description')} />
      </div>

      <div>
        <Label>
          {eventType === 'entrainement_piscine' ? 'Exercices prévus' : 'Équipement requis'}
        </Label>
        <Textarea
          className="mt-1"
          rows={2}
          placeholder={eventType === 'entrainement_piscine' ? 'Ex: travail des palmes, apnée dynamique...' : 'Ex: combinaison 5mm, palmes de plongée...'}
          {...register('equipment_needed')}
        />
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
