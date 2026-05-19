import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { BREVET_LABELS } from '../../lib/compliance'
import type { BrevetLevel, Profile, UserRole } from '../../types/database.types'

const schema = z.object({
  full_name: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  date_naissance: z.string().optional(),
  lifras_number: z.string().optional(),
  brevet_level: z.string().optional(),
  alias: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relation: z.string().optional(),
  role: z.enum(['admin', 'moniteur', 'membre', 'externe']),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  initial?: Partial<Profile>
  onSubmit: (data: Partial<Profile>) => Promise<void>
  onCancel: () => void
  isAdmin?: boolean
}

export function MemberForm({ initial, onSubmit, onCancel, isAdmin = false }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: initial?.full_name ?? '',
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      date_naissance: initial?.date_naissance ?? '',
      lifras_number: initial?.lifras_number ?? '',
      brevet_level: initial?.brevet_level ?? '',
      alias: initial?.alias ?? '',
      emergency_contact_name: initial?.emergency_contact_name ?? '',
      emergency_contact_phone: initial?.emergency_contact_phone ?? '',
      emergency_contact_relation: initial?.emergency_contact_relation ?? '',
      role: initial?.role ?? 'membre',
      notes: initial?.notes ?? '',
    },
  })

  const brevet = watch('brevet_level')
  const role = watch('role')

  async function submit(data: FormData) {
    await onSubmit({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      date_naissance: data.date_naissance || null,
      lifras_number: data.lifras_number || null,
      brevet_level: (data.brevet_level as BrevetLevel) || null,
      alias: data.alias || null,
      emergency_contact_name: data.emergency_contact_name || null,
      emergency_contact_phone: data.emergency_contact_phone || null,
      emergency_contact_relation: data.emergency_contact_relation || null,
      role: data.role as UserRole,
      notes: data.notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Nom complet *</Label>
          <Input className="mt-1" {...register('full_name')} />
          {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
        </div>
        <div>
          <Label>Email *</Label>
          <Input type="email" className="mt-1" {...register('email')} />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label>Téléphone</Label>
          <Input className="mt-1" {...register('phone')} />
        </div>
        <div>
          <Label>Date de naissance</Label>
          <Input type="date" className="mt-1" {...register('date_naissance')} />
        </div>
        <div>
          <Label>N° LIFRAS</Label>
          <Input className="mt-1" {...register('lifras_number')} />
        </div>
        <div>
          <Label>Brevet</Label>
          <Select value={brevet} onValueChange={(v) => setValue('brevet_level', v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="non_brevet">Non breveté</SelectItem>
              {(Object.entries(BREVET_LABELS) as [BrevetLevel, string][])
                .filter(([k]) => k !== 'non_brevet')
                .map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Alias / Pseudo <span className="text-gray-400 text-xs">(optionnel — affiché dans le chat des événements)</span></Label>
          <Input className="mt-1" placeholder="ex: DiveMaster06" {...register('alias')} />
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">🚨 Contact d'urgence</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Nom</Label>
            <Input className="mt-1" placeholder="Marie Dupont" {...register('emergency_contact_name')} />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input className="mt-1" placeholder="+32 XXX XX XX XX" {...register('emergency_contact_phone')} />
          </div>
          <div>
            <Label>Lien</Label>
            <Input className="mt-1" placeholder="Conjoint(e), parent…" {...register('emergency_contact_relation')} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isAdmin && (
          <div>
            <Label>Rôle</Label>
            <Select value={role} onValueChange={(v) => setValue('role', v as UserRole)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="externe">Membre externe</SelectItem>
                <SelectItem value="membre">Membre effectif</SelectItem>
                <SelectItem value="moniteur">Moniteur</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea className="mt-1" rows={3} {...register('notes')} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</> : 'Enregistrer'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
      </div>
    </form>
  )
}
