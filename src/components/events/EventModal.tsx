import { useState } from 'react'
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
import { useAuth } from '../../hooks/useAuth'
import { useCompliance } from '../../hooks/useCompliance'
import { useEvents, useEventExercises, useMemberProgress, useEventMessages } from '../../hooks/useEvents'
import {
  getRegistrationBlock, BREVET_LABELS, EVENT_TYPES_REQUIRE_MEDICAL,
  BREVET_ORDER,
} from '../../lib/compliance'
import { EVENT_TYPE_LABELS, formatDateTime, formatDate } from '../../lib/utils'
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
  const { profile, isMoniteur } = useAuth()
  const { compliance } = useCompliance(profile?.id, profile?.brevet_level)
  const { validateRegistration, registerToEvent, unregisterFromEvent } = useEvents()
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

  if (!event || !profile) return null

  const ev = event
  const memberId = profile.id
  const registrations = ev.event_registrations ?? []
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
        setMessage('Désinscrit avec succès.')
      } else {
        await registerToEvent(ev.id, memberId, profile?.full_name)
        setMessage('Demande envoyée — en attente de validation par l\'organisateur.')
      }
    } catch {
      setMessage('Une erreur est survenue. Réessayez.')
    }
    setLoading(false)
  }

  async function handleValidate(regMemberId: string, accept: boolean) {
    await validateRegistration(ev.id, regMemberId, accept)
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
            {isMoniteur && (
              <TabsTrigger value="registrations" className="flex-1 text-xs">
                Inscriptions
                {registrations.filter((r) => r.status === 'pending').length > 0 && (
                  <span className="ml-1.5 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {registrations.filter((r) => r.status === 'pending').length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {isMoniteur && (
              <TabsTrigger value="exercises" className="flex-1 text-xs">Exercices</TabsTrigger>
            )}
            {isConfirmed && !isMoniteur && (
              <TabsTrigger value="exercises" className="flex-1 text-xs">Ma progression</TabsTrigger>
            )}
            {(isConfirmed || isMoniteur) && (
              <TabsTrigger value="messages" className="flex-1 text-xs">Messages</TabsTrigger>
            )}
          </TabsList>

          {/* ── Onglet Détails ── */}
          <TabsContent value="details" className="space-y-3 pt-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              {formatDateTime(ev.date_start)}
              {ev.date_end && <> → {formatDateTime(ev.date_end)}</>}
            </div>

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
                  <Button variant="outline" onClick={handleRegister} disabled={loading} className="flex-1">
                    {loading ? 'Traitement…' : myStatus === 'refused' ? 'Retirer ma candidature' : 'Se désinscrire'}
                  </Button>
                )}
                <Button variant="ghost" onClick={onClose}>Fermer</Button>
              </div>
            )}
            {ev.is_cancelled && <Button variant="ghost" className="w-full" onClick={onClose}>Fermer</Button>}
          </TabsContent>

          {/* ── Onglet Inscriptions (organisateur) ── */}
          {isMoniteur && (
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
            {isMoniteur && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ajouter un exercice</p>
                <div className="flex gap-2 flex-wrap">
                  <Input
                    placeholder="Titre de l'exercice…"
                    value={newExTitle}
                    onChange={(e) => setNewExTitle(e.target.value)}
                    className="text-sm flex-1 min-w-0"
                  />
                  <Select value={newExBrevet} onValueChange={(v) => setNewExBrevet(v as BrevetLevel | '')}>
                    <SelectTrigger className="w-36 text-xs shrink-0">
                      <SelectValue placeholder="Niveau min." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous niveaux</SelectItem>
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
            {!isMoniteur && recommended.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Exercices recommandés — progression vers {
                    profile.brevet_level
                      ? BREVET_LABELS[Object.keys(BREVET_ORDER).find((k) => BREVET_ORDER[k as BrevetLevel] === memberBrevetOrder + 1) as BrevetLevel ?? profile.brevet_level]
                      : 'votre prochain niveau'
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
            {!isMoniteur && exercises.length > 0 && (
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
          {(isConfirmed || isMoniteur) && (
            <TabsContent value="messages" className="pt-3 space-y-3">
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {messages.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">Aucun message pour l'instant.</p>
                )}
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === memberId
                  const senderName = (msg.profiles as { full_name?: string } | undefined)?.full_name ?? 'Membre'
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${isOwn ? 'bg-[#0077b6] text-white' : 'bg-gray-100 text-gray-900'}`}>
                        {!isOwn && <p className="text-xs font-semibold mb-0.5 opacity-70">{senderName}</p>}
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-0.5 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                          {formatDate(msg.created_at, 'dd/MM HH:mm')}
                        </p>
                      </div>
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
  )
}
