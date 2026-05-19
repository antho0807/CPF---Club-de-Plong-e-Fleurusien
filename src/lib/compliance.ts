import type { BrevetLevel, ComplianceStatus, DocumentType, EventType, MemberDocument, MedicalStatus, UserRole } from '../types/database.types'

export function getMedicalExpiryStatus(expiryDate: Date): MedicalStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)
  if (diffDays < 0) return 'expired'
  if (diffDays <= 30) return 'expiring_soon'
  return 'valid'
}

export function getMemberComplianceStatus(
  documents: MemberDocument[],
  brevet: BrevetLevel | null,
): ComplianceStatus {
  const medicalDocs = documents.filter(
    (d) => d.type === 'certificat_medical' || d.type === 'caci',
  )

  if (medicalDocs.length === 0) {
    return { medical: 'missing', expiryDate: null, documentType: null }
  }

  // Sort by expiry date descending to get most recent valid one
  const sorted = [...medicalDocs].sort((a, b) => {
    if (!a.expiry_date) return 1
    if (!b.expiry_date) return -1
    return new Date(b.expiry_date).getTime() - new Date(a.expiry_date).getTime()
  })

  const latest = sorted[0]
  if (!latest.expiry_date) {
    return { medical: 'missing', expiryDate: null, documentType: latest.type as DocumentType }
  }

  const expiryDate = new Date(latest.expiry_date)
  const status = getMedicalExpiryStatus(expiryDate)

  return {
    medical: status,
    expiryDate,
    documentType: latest.type as DocumentType,
  }
}

export function canUseCaci(brevet: BrevetLevel | null): boolean {
  return brevet === null || brevet === 'non_brevet' || brevet === '1_etoile'
}

export function requiresMedicalDoctor(brevet: BrevetLevel | null): boolean {
  if (!brevet) return false
  const higherLevels: BrevetLevel[] = [
    '2_etoiles', '3_etoiles', '4_etoiles',
    'moniteur_club', 'moniteur_federal', 'instructeur',
  ]
  return higherLevels.includes(brevet)
}

// Types d'événements qui nécessitent un certificat médical valide (règle LIFRAS)
export const EVENT_TYPES_REQUIRE_MEDICAL: EventType[] = [
  'sortie_mer',
  'sortie_lac',
  'sortie_carriere',
  'entrainement_piscine',
  'formation',
  'competition',
]

// Types d'événements qu'un niveau P3★+ peut créer
const SORTIE_TYPES: EventType[] = ['sortie_mer', 'sortie_lac', 'sortie_carriere', 'competition']
const TRAINING_TYPES: EventType[] = ['entrainement_piscine', 'formation']

/**
 * Renvoie true si le membre peut s'inscrire à un événement du type donné.
 * Pour réunion/autre → pas de vérification médicale.
 */
export function canRegisterToEvent(compliance: ComplianceStatus, eventType?: EventType): boolean {
  if (eventType && !EVENT_TYPES_REQUIRE_MEDICAL.includes(eventType)) return true
  return compliance.medical === 'valid' || compliance.medical === 'expiring_soon'
}

export interface RegistrationBlock {
  type: 'medical_expired' | 'medical_missing' | 'brevet' | 'full'
  reason: string
}

/**
 * Renvoie la raison exacte qui bloque l'inscription, ou null si aucune.
 */
export function getRegistrationBlock(
  compliance: ComplianceStatus,
  memberBrevet: BrevetLevel | null,
  ev: {
    min_brevet: BrevetLevel | null
    max_participants: number | null
    event_type: EventType
    registration_deadline?: string | null
  },
  registrationsCount: number,
  isRegistered: boolean,
): RegistrationBlock | null {
  // Deadline dépassée
  if (!isRegistered && ev.registration_deadline) {
    if (new Date() > new Date(ev.registration_deadline)) {
      return { type: 'full', reason: 'La deadline d\'inscription est dépassée.' }
    }
  }
  if (EVENT_TYPES_REQUIRE_MEDICAL.includes(ev.event_type)) {
    // P2★+ avec un CACI : le CACI n'est pas valable, certificat médecin obligatoire
    if (requiresMedicalDoctor(memberBrevet) && compliance.documentType === 'caci') {
      return {
        type: 'medical_expired',
        reason: 'Votre niveau P2★ ou supérieur requiert un certificat médical officiel délivré par un médecin. Le formulaire CACI auto-déclaratif n\'est valable qu\'en NB et P1★. Consultez un médecin avant de plonger.',
      }
    }
    if (compliance.medical === 'expired') {
      return {
        type: 'medical_expired',
        reason: requiresMedicalDoctor(memberBrevet)
          ? 'Votre certificat médical (médecin) est expiré. Renouvelez-le avant de pouvoir plonger (règle LIFRAS P2★+).'
          : 'Votre auto-déclaration médicale (CACI) est expirée. Veuillez la renouveler avant de vous inscrire.',
      }
    }
    if (compliance.medical === 'missing') {
      return {
        type: 'medical_missing',
        reason: requiresMedicalDoctor(memberBrevet)
          ? 'Aucun certificat médical officiel enregistré. À votre niveau (P2★+), une visite chez le médecin est obligatoire avant de plonger.'
          : 'Aucun document médical enregistré. Téléversez votre formulaire CACI dans « Mes documents ».',
      }
    }
  }

  if (!meetsMinBrevet(memberBrevet, ev.min_brevet)) {
    const memberLabel = memberBrevet ? BREVET_LABELS[memberBrevet] : 'Non breveté'
    const minLabel = ev.min_brevet ? BREVET_LABELS[ev.min_brevet] : ''
    return { type: 'brevet', reason: `Votre niveau (${memberLabel}) est insuffisant. Ce plongée requiert minimum : ${minLabel}.` }
  }

  if (!isRegistered && ev.max_participants !== null && registrationsCount >= ev.max_participants) {
    return { type: 'full', reason: 'Toutes les places sont prises.' }
  }

  return null
}

/**
 * Renvoie true si le membre peut voir le bouton "Créer un événement".
 * Règles :
 *   - admin ou moniteur (rôle) → toujours
 *   - P3★ et au-dessus (BREVET_ORDER ≥ 3) → oui (peuvent créer des sorties)
 *   - en dessous de P3★ → non
 */
export function canCreateAnyEvent(role: UserRole, brevet: BrevetLevel | null): boolean {
  if (role === 'admin') return true
  if (role === 'externe') return false
  // Moniteur = brevet, pas rôle. P2★ et au-dessus peuvent créer des events.
  if (role === 'moniteur') return true // rétrocompatibilité données existantes
  if (!brevet) return false
  return BREVET_ORDER[brevet] >= BREVET_ORDER['2_etoiles']
}

/**
 * Renvoie les types d'événements qu'un membre est autorisé à créer.
 */
export function getCreatableEventTypes(role: UserRole, brevet: BrevetLevel | null): EventType[] {
  const ALL: EventType[] = ['sortie_mer', 'sortie_lac', 'sortie_carriere', 'entrainement_piscine', 'formation', 'competition', 'reunion', 'social', 'voyage', 'autre']
  if (role === 'admin' || role === 'moniteur') return ALL

  const order = brevet ? BREVET_ORDER[brevet] : -1

  if (order >= BREVET_ORDER['2_etoiles']) return ALL
  return ['reunion', 'autre']
}

// LIFRAS brevet display names
export const BREVET_LABELS: Record<BrevetLevel, string> = {
  non_brevet: 'Non breveté',
  '1_etoile': 'P1 ★',
  '2_etoiles': 'P2 ★★',
  '3_etoiles': 'P3 ★★★',
  '4_etoiles': 'P4 ★★★★',
  moniteur_club: 'Moniteur Club',
  moniteur_federal: 'Moniteur Fédéral',
  instructeur: 'Instructeur',
}

export const BREVET_ORDER: Record<BrevetLevel, number> = {
  non_brevet: 0,
  '1_etoile': 1,
  '2_etoiles': 2,
  '3_etoiles': 3,
  '4_etoiles': 4,
  moniteur_club: 5,
  moniteur_federal: 6,
  instructeur: 7,
}

export function meetsMinBrevet(
  memberBrevet: BrevetLevel | null,
  minBrevet: BrevetLevel | null,
): boolean {
  if (!minBrevet) return true
  if (!memberBrevet) return false
  return BREVET_ORDER[memberBrevet] >= BREVET_ORDER[minBrevet]
}

export function formatMedicalStatus(status: MedicalStatus): string {
  switch (status) {
    case 'valid': return 'Valide'
    case 'expiring_soon': return 'Expire bientôt'
    case 'expired': return 'Expiré'
    case 'missing': return 'Manquant'
  }
}
