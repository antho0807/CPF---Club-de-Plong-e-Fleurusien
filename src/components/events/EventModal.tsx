import { useState, useEffect } from 'react'
import {
  MapPin, Users, Calendar, Info, AlertTriangle, CheckCircle,
  ShieldAlert, Award, Send, Plus, Trash2, Clock,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCompliance } from '../../hooks/useCompliance'
import { useEvents, useEventExercises, useMemberProgress, useEventMessages } from '../../hooks/useEvents'
import {
  getRegistrationBlock, BREVET_LABELS, EVENT_TYPES_REQUIRE_MEDICAL,
  BREVET_ORDER,
} from '../../lib/compliance'
import { EVENT_TYPE_LABELS, formatDateTime, formatDate } from '../../lib/utils'
import { EventForm } from './EventForm'
import type { Event, EventExercise, BrevetLevel } from '../../types/database.types'

interface Props {
  event: Event | null
  open: boolean
  onClose: () => void
}

const BLOCK_ICONS = {
  medical_expired: ShieldAlert,
  medical_missing: ShieldAlert,
  brevet: Award,
  full: Users,
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  refused: 'Refusé',
  cancelled: 'Annulé',
  waitlist: 'Liste d\'attente',
}

const PROGRESS_LABELS: Record<string, string> = {
  pending: 'À faire',
  in_progress: 'En cours',
  done: 'Soumis',
  validated: 'Validé ✓',
  refused: 'Refusé ✗',
}

// Exercices recommandés par niveau (référence LIFRAS)
const RECOMMENDED: Partial<Record<BrevetLevel, { title: string; description: string }[]>> = {
  non_brevet: [
    { title: 'Familiarisation à l\'eau', description: 'Premières respirations avec détendeur' },
    { title: 'Vidage du masque en surface', description: 'Technique de base en surface' },
    { title: 'Palmage ventral 25m', description: 'Coordination et rythme de base' },
  ],
  '1_etoile': [
    { title: 'Vidage du masque à 5m', description: 'Vidage complet à 5m de profondeur' },
    { title: 'Lâcher/reprise d\'embout à 5m', description: 'Lâcher et reprise du détendeur à 5m' },
    { title: 'Palmage ventral et dorsal 25m', description: 'Les deux techniques enchaînées' },
    { title: 'Statique à 3m (30s)', description: 'Maintien en suspension sans bouger' },
    { title: 'Équilibrage au gilet', description: 'Flottabilité neutre à faible profondeur' },
  ],
  '2_etoiles': [
    { title: 'Remontée assistée depuis 20m', description: 'Contrôle de la vitesse de remontée' },
    { title: 'Partage d\'air octopus à 15m', description: 'Simulation de panne d\'air' },
    { title: 'Navigation compas aller-retour', description: 'Cap magnétique sur 50m' },
    { title: 'Palmage sans les mains 15m', description: 'Maîtrise des palmes uniquement' },
    { title: 'Capelage/décapelage sous-marin', description: 'Manipulation du matériel immergé' },
  ],
  '3_etoiles': [
    { title: 'Plongée de contrôle à 40m', description: 'Gestion de paliers et remontée lente' },
    { title: 'Remorquage d\'un plongeur en difficulté', description: 'Technique de sauvetage basique' },
    { title: 'Navigation triangulaire', description: 'Orientation sous-marine avancée' },
    { title: 'Gestion d\'un binôme', description: 'Leadership sur un sous-groupe' },
  ],
  '4_etoiles': [
    { title: 'Plongée technique à 60m', description: 'Deep diving avec gestion des paliers de décompression' },
    { title: 'Sauvetage complet', description: 'De la détection à la surface, jusqu\'aux premiers secours' },
    { title: 'Organisation d\'une sortie', description: 'Planification complète (logistique, sécurité, brevets)' },
  ],
}

export function EventModal({ event, open, onClose }: Props) {
  const { profile, isMoniteur, isAdmin } = useAuth()
  const { compliance } = useCompliance(profile?.id, profile?.brevet_level)
  const { validateRegistration, registerToEvent, unregisterFromEvent, cancelEvent, updateEvent } = useEvents()
  const { exercises, addExercise, removeExercise } = useEventExercises(event?.id ?? null)
  const { progress, setStatus: setProgressStatus, validate: validateProgress } = useMemberProgress(
    profile?.id ?? null,
    event?.id ?? null,
  )
  const { messages, sendMessage } = useEventMessages(event?.id ?? null)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [chatText, setChatText] = useState('')
  const [newExTitle, setNewExTitle] = useState('')
  const [newExBrevet, setNewExBrevet] = useState<BrevetLevel | ''>('')
  const [showUnregisterConfirm, setShowUnregisterConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showEditForm, setShowEditForm] = useState(false)
  const [creator, setCreator] = useState<{ full_name: string; alias: string | null } | null>(null)

  // Charger le profil du créateur
  useEffect(() => {
    if (!event?.created_by) return
    supabase.from('profiles').select('full_name, alias').eq('id', event.created_by).maybeSingle()
      .then(({ data }) => data && setCreator(data as { full_name: string; alias: string | null }))
  }, [event?.created_by])

  // Registrations en état local pour mise à jour immédiate après (dé)inscription
  const [localRegs, setLocalRegs] = useState(event?.event_registrations ?? [])
  useEffect(() => {
    setLocalRegs(event?.event_registrations ?? [])
  }, [event?.event_registrations])

  if (!event || !profile) return null

  const ev = event
  const memberId = profile.id
  const isOrganizer = ev.created_by === profile.id || ev.organizer_id === profile.id
  const canManage = isMoniteur || isOrganizer || isAdmin
  const registrations = localRegs
  const myRegistration = registrations.find((r) => r.member_id === memberId)
  const isRegistered = !!myRegistration
  const myStatus = myRegistration?.status ?? null
  const isConfirmed = myStatus === 'confirmed'

  const spotsLeft = ev.max_participants
    ? ev.max_participants - registrations.filter((r) => r.status === 'confirmed').length
    : null

  const block = getRegistrationBlock(
    compliance,
    profile.brevet_level,
    {
      min_brevet: ev.min_brevet,
      max_participants: ev.max_participants,
      event_type: ev.event_type,
      registration_deadline: ev.registration_deadline,
    },
    registrations.filter((r) => r.status === 'confirmed').length,
    isConfirmed,
  )

  const requiresMedical = EVENT_TYPES_REQUIRE_MEDICAL.includes(ev.event_type)
  const deadlinePassed = ev.registration_deadline ? new Date() > new Date(ev.registration_deadline) : false

  // Exercices recommandés pour progresser vers le PROCHAIN niveau
  const memberBrevetOrder = profile.brevet_level ? BREVET_ORDER[profile.brevet_level] : -1
  const nextLevelOrder = memberBrevetOrder + 1
  const recommendedKey = (Object.keys(RECOMMENDED) as BrevetLevel[])
    .find((k) => BREVET_ORDER[k] === nextLevelOrder)
    ?? (Object.keys(RECOMMENDED) as BrevetLevel[])
      .filter((k) => BREVET_ORDER[k] > memberBrevetOrder)
      .sort((a, b) => BREVET_ORDER[a] - BREVET_ORDER[b])[0]
  const recommended = recommendedKey ? RECOMMENDED[recommendedKey] ?? [] : []

  async function handleRegister() {
    setLoading(true)
    setMessage(null)
    try {
      if (isRegistered) {
        await unregisterFromEvent(ev.id, memberId)
        setLocalRegs((prev) => prev.filter((r) => r.member_id !== memberId))
        setMessage('Désinscrit avec succès.')
      } else {
        await registerToEvent(ev.id, memberId, profile?.full_name)
        // Ajouter une registration pending locale immédiatement
        setLocalRegs((prev) => [...prev, { id: 'tmp', event_id: ev.id, member_id: memberId, registered_at: new Date().toISOString(), status: 'pending' } as typeof prev[0]])
        setMessage('Demande envoyée — en attente de validation par l\'organisateur.')
      }
    } catch {
      setMessage('Une erreur est survenue. Réessayez.')
    }
    setLoading(false)
  }

  async function confirmUnregister() {
    setShowUnregisterConfirm(false)
    setLoading(true)
    try {
      await unregisterFromEvent(ev.id, memberId)
      setLocalRegs((prev) => prev.filter((r) => r.member_id !== memberId))
      setMessage('Désinscrit avec succès.')
    } catch {
      setMessage('Une erreur est survenue. Réessayez.')
    }
    setLoading(false)
  }

  async function handleValidate(regMemberId: string, accept: boolean) {
    try {
      await validateRegistration(ev.id, regMemberId, accept)
      // Mise à jour immédiate du statut dans l'état local
      setLocalRegs((prev) =>
        prev.map((r) =>
          r.member_id === regMemberId
            ? { ...r, status: accept ? 'confirmed' : 'refused' }
            : r
        )
      )
    } catch (e: unknown) {
      setMessage('Erreur validation : ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  async function handleSendMessage() {
    if (!chatText.trim()) return
    await sendMessage(memberId, chatText)
    setChatText('')
  }

  async function handleAddExercise() {
    if (!newExTitle.trim()) return
    await addExercise({ title: newExTitle, description: null, min_brevet: newExBrevet || null, created_by: memberId })
    setNewExTitle('')
    setNewExBrevet('')
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div>
            <Badge variant="secondary" className="mb-2 text-xs">
              {EVENT_TYPE_LABELS[ev.event_type]}
            </Badge>
            <DialogTitle className="leading-snug">{ev.title}</DialogTitle>
            {ev.is_cancelled && (
              <p className="text-red-600 text-sm mt-1">Annulé : {ev.cancel_reason}</p>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1 text-xs">Détails</TabsTrigger>
            {canManage && (
              <TabsTrigger value="registrations" className="flex-1 text-xs">
                Inscriptions
                {registrations.filter((r) => r.status === 'pending').length > 0 && (
                  <span className="ml-1.5 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {registrations.filter((r) => r.status === 'pending').length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {canManage && (
              <TabsTrigger value="exercises" className="flex-1 text-xs">Exercices</TabsTrigger>
            )}
            {isConfirmed && !canManage && (
              <TabsTrigger value="exercises" className="flex-1 text-xs">Ma progression</TabsTrigger>
            )}
            {(isConfirmed || canManage) && (
              <TabsTrigger value="messages" className="flex-1 text-xs">Messages</TabsTrigger>
            )}
          </TabsList>

          {/* ── Onglet Détails ── */}
          <TabsContent value="details" className="space-y-3 pt-3">
            {creator && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Créé par <strong>{creator.alias ?? creator.full_name}</strong>
                {' · '}{formatDate(ev.created_at, 'dd/MM/yyyy')}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              {formatDateTime(ev.date_start)}
            </div>
            {(ev as unknown as { meeting_time?: string }).meeting_time && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 text-gray-400" />
                {'📍 RDV sur place : ' + (ev as unknown as { meeting_time: string }).meeting_time.slice(0, 5).replace(':', 'h')}
              </div>
            )}

            {ev.registration_deadline && (
              <div className={`flex items-center gap-2 text-sm ${deadlinePassed ? 'text-red-600' : 'text-orange-600'}`}>
                <Clock className="h-4 w-4" />
                Deadline : {formatDateTime(ev.registration_deadline)}
                {deadlinePassed && <span className="font-semibold">(fermé)</span>}
              </div>
            )}

            {ev.dive_sites && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                {ev.dive_sites.name}
                {ev.dive_sites.address && ` — ${ev.dive_sites.address}`}
              </div>
            )}

            {ev.meeting_point && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                RDV : {ev.meeting_point}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4 text-gray-400" />
              {registrations.filter((r) => r.status === 'confirmed').length} inscrit(s) confirmé(s)
              {ev.max_participants && ` / ${ev.max_participants} places`}
              {spotsLeft !== null && spotsLeft > 0 && !isConfirmed && (
                <span className="text-green-600 font-medium">({spotsLeft} dispo.)</span>
              )}
              {spotsLeft !== null && spotsLeft <= 0 && !isConfirmed && (
                <span className="text-red-600 font-medium">(complet)</span>
              )}
            </div>

            {/* Conditions d'accès */}
            {(ev.min_brevet || requiresMedical) && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conditions</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Votre niveau</span>
                  <Badge variant="outline" className="text-xs">
                    {profile.brevet_level ? BREVET_LABELS[profile.brevet_level] : 'Non breveté'}
                  </Badge>
                </div>
                {ev.min_brevet && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Niveau minimum</span>
                    <Badge variant="outline" className={`text-xs ${block?.type === 'brevet' ? 'border-red-300 text-red-600 bg-red-50' : 'border-green-300 text-green-700 bg-green-50'}`}>
                      {BREVET_LABELS[ev.min_brevet]}
                    </Badge>
                  </div>
                )}
                {requiresMedical && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Certificat médical</span>
                    <span className={`font-medium ${compliance.medical === 'valid' ? 'text-green-600' : compliance.medical === 'expiring_soon' ? 'text-orange-500' : 'text-red-600'}`}>
                      {compliance.medical === 'valid' ? '✓ Valide' : compliance.medical === 'expiring_soon' ? '⚠ Expire bientôt' : compliance.medical === 'expired' ? '✗ Expiré' : '✗ Manquant'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {ev.description && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{ev.description}</p>}
            {ev.equipment_needed && (
              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-blue-900 mb-1 text-xs uppercase">Équipement</p>
                <p className="text-blue-700">{ev.equipment_needed}</p>
              </div>
            )}
            {ev.carpooling_info && (
              <div className="bg-teal-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-teal-900 mb-1 text-xs uppercase">Covoiturage</p>
                <p className="text-teal-700">{ev.carpooling_info}</p>
              </div>
            )}

            {/* Statut de mon inscription */}
            {myStatus && (
              <div className={`flex items-center gap-2 p-2.5 rounded-lg text-sm border ${
                myStatus === 'confirmed' ? 'bg-green-50 border-green-200 text-green-700' :
                myStatus === 'pending' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                myStatus === 'refused' ? 'bg-red-50 border-red-200 text-red-700' :
                'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                {myStatus === 'confirmed' && <CheckCircle className="h-4 w-4 shrink-0" />}
                {myStatus === 'pending' && <Clock className="h-4 w-4 shrink-0" />}
                {myStatus === 'refused' && <AlertTriangle className="h-4 w-4 shrink-0" />}
                <span>
                  {myStatus === 'confirmed' && 'Vous êtes inscrit et validé.'}
                  {myStatus === 'pending' && 'Inscription en attente de validation par l\'organisateur.'}
                  {myStatus === 'refused' && 'Votre inscription a été refusée.'}
                </span>
              </div>
            )}

            {/* Blocage */}
            {block && !isRegistered && (
              <div className="flex gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-xs">
                {(() => { const Icon = BLOCK_ICONS[block.type]; return <Icon className="h-4 w-4 shrink-0 mt-0.5 text-orange-600" /> })()}
                <p>{block.reason}</p>
              </div>
            )}

            {message && (
              <p className={`text-sm font-medium ${message.includes('erreur') ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </p>
            )}

            {!ev.is_cancelled && (
              <div className="flex gap-3 pt-1">
                {!isRegistered && (
                  <Button
                    onClick={handleRegister}
                    disabled={loading || (!!block && !isRegistered)}
                    className="flex-1"
                    title={block ? block.reason : undefined}
                  >
                    {loading ? 'Traitement…' : 'S\'inscrire'}
                  </Button>
                )}
                {isRegistered && (
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    disabled={loading}
                    onClick={() => myStatus === 'refused' ? handleRegister() : setShowUnregisterConfirm(true)}
                  >
                    {loading ? 'Traitement…' : myStatus === 'refused' ? 'Retirer ma candidature' : 'Se désinscrire'}
                  </Button>
                )}
                <Button variant="ghost" onClick={onClose}>Fermer</Button>
              </div>
            )}
            {ev.is_cancelled && <Button variant="ghost" className="w-full" onClick={onClose}>Fermer</Button>}

            {/* Boutons organisateur */}
            {canManage && !ev.is_cancelled && (
              <div className="flex gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={() => setShowEditForm(true)}>
                  ✏️ Modifier
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowCancelConfirm(true)}>
                  🚫 Annuler l'événement
                </Button>
              </div>
            )}

            {/* ── Plongeurs confirmés ── */}
            {(() => {
              const confirmed = registrations.filter((r) => r.status === 'confirmed')
              if (confirmed.length === 0) return null
              const total = ev.max_participants
              return (
                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">🤿 Plongeurs confirmés</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        total && confirmed.length >= total
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {confirmed.length}{total ? `/${total}` : ''} places
                        {total && confirmed.length >= total ? ' — Complet' : ` dispo`}
                      </span>
                    </div>
                  </div>
                  {canManage ? (
                    <div className="space-y-1.5">
                      {confirmed.map((reg) => {
                        const mp = reg.profiles as { full_name?: string; alias?: string; brevet_level?: string } | undefined
                        const name = mp?.alias || mp?.full_name || 'Membre'
                        const initials = name.slice(0, 2).toUpperCase()
                        return (
                          <div key={reg.id} className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-6 rounded-full bg-[#0077b6]/20 text-[#0077b6] text-xs flex items-center justify-center font-semibold flex-shrink-0">
                              {initials}
                            </div>
                            <span className="flex-1 text-gray-800">{name}</span>
                            {mp?.brevet_level && (
                              <span className="text-xs text-gray-400">{BREVET_LABELS[mp.brevet_level as BrevetLevel] ?? mp.brevet_level}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {confirmed.map((reg) => {
                        const mp = reg.profiles as { full_name?: string; alias?: string } | undefined
                        const name = mp?.alias || (mp?.full_name?.split(' ')[0] ?? 'Membre')
                        return (
                          <span key={reg.id} className="text-xs bg-blue-50 text-[#0077b6] px-2 py-0.5 rounded-full">
                            {name}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()}
          </TabsContent>

          {/* ── Onglet Inscriptions (organisateur) ── */}
          {canManage && (
            <TabsContent value="registrations" className="pt-3 space-y-3">
              <p className="text-sm font-semibold text-gray-700">
                {registrations.length} demande(s) — {registrations.filter((r) => r.status === 'confirmed').length} confirmée(s)
              </p>
              {registrations.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucune inscription pour l'instant.</p>
              )}
              {registrations.map((reg) => {
                const memberProfile = reg.profiles as { full_name?: string; brevet_level?: string } | undefined
                return (
                  <div key={reg.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{memberProfile?.full_name ?? 'Membre inconnu'}</p>
                      {memberProfile?.brevet_level && (
                        <p className="text-xs text-gray-500">{BREVET_LABELS[memberProfile.brevet_level as BrevetLevel]}</p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs shrink-0 ${
                        reg.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        reg.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        reg.status === 'refused' ? 'bg-red-100 text-red-700' : ''
                      }`}
                    >
                      {STATUS_LABELS[reg.status] ?? reg.status}
                    </Badge>
                    {reg.status === 'pending' && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => handleValidate(reg.member_id, true)}
                        >
                          Valider
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleValidate(reg.member_id, false)}
                        >
                          Refuser
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </TabsContent>
          )}

          {/* ── Onglet Exercices ── */}
          <TabsContent value="exercises" className="pt-3 space-y-4">
            {/* Section organisateur : ajouter des exercices */}
            {canManage && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ajouter un exercice</p>
                <div className="flex gap-2 flex-wrap">
                  <Input
                    placeholder="Titre de l'exercice…"
                    value={newExTitle}
                    onChange={(e) => setNewExTitle(e.target.value)}
                    className="text-sm flex-1 min-w-0"
                  />
                  <Select
                    value={newExBrevet === '' ? '_all' : newExBrevet}
                    onValueChange={(v) => setNewExBrevet(v === '_all' ? '' : v as BrevetLevel)}
                  >
                    <SelectTrigger className="w-36 text-xs shrink-0">
                      <SelectValue placeholder="Niveau min." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Tous niveaux</SelectItem>
                      {(Object.entries(BREVET_LABELS) as [BrevetLevel, string][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAddExercise} disabled={!newExTitle.trim()} className="gap-1 shrink-0">
                    <Plus className="h-3.5 w-3.5" /> Ajouter
                  </Button>
                </div>

                {exercises.length > 0 && (
                  <div className="space-y-1.5">
                    {exercises.map((ex) => (
                      <div key={ex.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{ex.title}</p>
                          {ex.description && <p className="text-xs text-gray-500">{ex.description}</p>}
                        </div>
                        <button onClick={() => removeExercise(ex.id)} className="text-gray-400 hover:text-red-500 shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Exercices recommandés selon le niveau du membre */}
            {!canManage && recommended.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Exercices recommandés — progression vers {
                    recommendedKey ? (BREVET_LABELS[recommendedKey] ?? recommendedKey) : 'votre prochain niveau'
                  }
                </p>
                {recommended.map((rec, i) => {
                  const ex = exercises.find((e) => e.title === rec.title)
                  const prog = ex ? progress.find((p) => p.exercise_id === ex.id) : null
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{rec.title}</p>
                        <p className="text-xs text-gray-500">{rec.description}</p>
                      </div>
                      {ex && prog && (
                        <Badge variant="outline" className={`text-xs shrink-0 ${
                          prog.status === 'validated' ? 'border-green-300 text-green-700 bg-green-50' :
                          prog.status === 'refused' ? 'border-red-300 text-red-600 bg-red-50' :
                          prog.status === 'done' ? 'border-blue-300 text-blue-700 bg-blue-50' :
                          'border-gray-200 text-gray-500'
                        }`}>
                          {PROGRESS_LABELS[prog.status]}
                        </Badge>
                      )}
                      {ex && !prog && isConfirmed && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs shrink-0"
                          onClick={() => setProgressStatus(ex.id, 'in_progress')}
                        >
                          Commencer
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Exercices ajoutés par l'organisateur */}
            {!canManage && exercises.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Exercices de la séance</p>
                {exercises.map((ex: EventExercise) => {
                  const prog = progress.find((p) => p.exercise_id === ex.id)
                  return (
                    <div key={ex.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{ex.title}</p>
                        {ex.description && <p className="text-xs text-gray-500">{ex.description}</p>}
                      </div>
                      {prog ? (
                        <Badge variant="outline" className={`text-xs shrink-0 ${
                          prog.status === 'validated' ? 'border-green-300 text-green-700 bg-green-50' :
                          prog.status === 'done' ? 'border-blue-300 text-blue-700 bg-blue-50' : ''
                        }`}>
                          {PROGRESS_LABELS[prog.status]}
                        </Badge>
                      ) : isConfirmed ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs shrink-0"
                          onClick={() => setProgressStatus(ex.id, 'done')}
                        >
                          Marquer fait
                        </Button>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}

            {exercises.length === 0 && recommended.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Aucun exercice défini pour cet événement.</p>
            )}
          </TabsContent>

          {/* ── Onglet Messages ── */}
          {(isConfirmed || canManage) && (
            <TabsContent value="messages" className="pt-3 space-y-3">
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {messages.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">Aucun message pour l'instant.</p>
                )}
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === memberId
                  const p = msg.profiles as { full_name?: string; alias?: string } | undefined
                  const displayName = p?.alias || p?.full_name || 'Membre'
                  const initials = displayName.slice(0, 2).toUpperCase()
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {!isOwn && (
                        <div className="w-7 h-7 rounded-full bg-[#0077b6] text-white text-xs flex items-center justify-center flex-shrink-0 mt-auto">
                          {initials}
                        </div>
                      )}
                      <div className={`max-w-[72%] rounded-xl px-3 py-2 text-sm ${isOwn ? 'bg-[#0077b6] text-white' : 'bg-gray-100 text-gray-900'}`}>
                        {!isOwn && <p className="text-xs font-semibold mb-0.5 text-[#0077b6]">{displayName}</p>}
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-0.5 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                          {formatDate(msg.created_at, 'dd/MM HH:mm')}
                        </p>
                      </div>
                      {isOwn && (
                        <div className="w-7 h-7 rounded-full bg-gray-300 text-gray-700 text-xs flex items-center justify-center flex-shrink-0 mt-auto">
                          {(profile.alias || profile.full_name).slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2 pt-1 border-t border-gray-100">
                <Input
                  placeholder="Votre message…"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSendMessage() }}
                  className="text-sm"
                />
                <Button size="sm" onClick={handleSendMessage} disabled={!chatText.trim()} className="shrink-0 gap-1">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>

    {/* ── Dialog modification événement ── */}
    <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[200]">
        <DialogHeader>
          <DialogTitle>Modifier l'événement</DialogTitle>
        </DialogHeader>
        <EventForm
          initial={ev}
          createdBy={memberId}
          creatorRole={profile?.role}
          creatorBrevet={profile?.brevet_level}
          onSubmit={async (data) => {
            await updateEvent(ev.id, data)
            setShowEditForm(false)
          }}
          onCancel={() => setShowEditForm(false)}
        />
      </DialogContent>
    </Dialog>

    {/* ── Dialog annulation événement ── */}
    <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
      <DialogContent className="max-w-sm z-[200]">
        <DialogHeader>
          <DialogTitle className="text-red-600">Annuler l'événement ?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">Cette action est visible par tous les participants.</p>
        <Input
          placeholder="Raison de l'annulation (optionnel)"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          className="mt-2"
        />
        {message && (
          <p className="text-xs text-red-500 mt-1">{message}</p>
        )}
        <div className="flex gap-3 justify-end mt-2">
          <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>Annuler</Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={async () => {
              try {
                await cancelEvent(ev.id, cancelReason || 'Annulé par l\'organisateur')
                setShowCancelConfirm(false)
                onClose()
              } catch (e) {
                setMessage('Erreur : ' + (e instanceof Error ? e.message : String(e)))
              }
            }}
          >
            Confirmer l'annulation
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* ── Dialog confirmation désinscription ── */}
    <Dialog open={showUnregisterConfirm} onOpenChange={setShowUnregisterConfirm}>
      <DialogContent className="max-w-sm z-[200]">
        <DialogHeader>
          <DialogTitle>Se désinscrire ?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          Êtes-vous sûr de vouloir vous désinscrire de <strong>{ev.title}</strong> ?
        </p>
        <div className="flex gap-3 justify-end mt-2">
          <Button variant="outline" onClick={() => setShowUnregisterConfirm(false)}>Annuler</Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmUnregister}>
            Confirmer
          </Button>
        </div>
      </DialogContent>
      </Dialog>
    </>
  )
}
