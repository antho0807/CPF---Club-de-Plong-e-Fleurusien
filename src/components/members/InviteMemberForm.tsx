import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, Mail, Info } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { BREVET_LABELS } from '../../lib/compliance'
import type { BrevetLevel, UserRole } from '../../types/database.types'

interface FormData {
  email: string
  full_name: string
  phone: string
  lifras_number: string
  brevet_level: string
  role: string
}

interface Props {
  onSubmit: (data: {
    email: string
    full_name: string
    phone?: string | null
    lifras_number?: string | null
    brevet_level?: BrevetLevel | null
    role?: UserRole
  }) => Promise<void>
  onCancel: () => void
}

export function InviteMemberForm({ onSubmit, onCancel }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: {
      email: '',
      full_name: '',
      phone: '',
      lifras_number: '',
      brevet_level: '',
      role: 'membre',
    },
  })

  const brevet = watch('brevet_level')
  const role = watch('role')

  async function submit(data: FormData) {
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        email: data.email,
        full_name: data.full_name,
        phone: data.phone || null,
        lifras_number: data.lifras_number || null,
        brevet_level: (data.brevet_level as BrevetLevel) || null,
        role: (data.role as UserRole) || 'membre',
      })
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'invitation.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="text-4xl">✅</div>
        <p className="font-semibold text-gray-900">Invitation envoyée !</p>
        <p className="text-sm text-gray-500">
          Le membre recevra un email avec un lien pour définir son mot de passe et accéder à l'application.
        </p>
        <Button onClick={onCancel}>Fermer</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex gap-2 text-sm text-blue-700">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          Un email d'invitation sera envoyé au membre pour qu'il définisse son mot de passe.
          Le profil sera créé automatiquement avec les informations ci-dessous.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label>Email *</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="email"
              className="pl-9"
              placeholder="membre@exemple.be"
              {...register('email', { required: true })}
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <Label>Nom complet *</Label>
          <Input
            className="mt-1"
            placeholder="Jean Dupont"
            {...register('full_name', { required: true })}
          />
        </div>

        <div>
          <Label>Téléphone</Label>
          <Input className="mt-1" placeholder="+32 4 xx xx xx xx" {...register('phone')} />
        </div>

        <div>
          <Label>N° LIFRAS</Label>
          <Input className="mt-1" {...register('lifras_number')} />
        </div>

        <div>
          <Label>Brevet</Label>
          <Select value={brevet} onValueChange={(v) => setValue('brevet_level', v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionner…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="non_brevet">Non breveté</SelectItem>
              {(Object.entries(BREVET_LABELS) as [BrevetLevel, string][])
                .filter(([k]) => k !== 'non_brevet')
                .map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Rôle</Label>
          <Select value={role} onValueChange={(v) => setValue('role', v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="membre">Membre</SelectItem>
              <SelectItem value="moniteur">Moniteur</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours…</>
            : <><Mail className="h-4 w-4" /> Envoyer l'invitation</>
          }
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
      </div>
    </form>
  )
}
