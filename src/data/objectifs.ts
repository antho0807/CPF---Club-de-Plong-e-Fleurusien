export interface Exercice {
  id: string
  label: string
  detail?: string
  requiresValidation?: boolean
}

export interface Categorie {
  id: string
  label: string
  exercices: Exercice[]
}

export interface NiveauObjectifs {
  niveau: string          // brevet actuel du membre
  niveauCible: string     // brevet visé
  label: string
  description: string
  categories: Categorie[]
}

// Référentiel LIFRAS/CMAS
// Chaque entrée = exercices que le membre doit réaliser pour PASSER AU NIVEAU SUIVANT
export const OBJECTIFS: NiveauObjectifs[] = [
  // ─── NB → P1★ ───────────────────────────────────────────────
  {
    niveau: 'non_brevet',
    niveauCible: '1_etoile',
    label: 'Objectifs pour obtenir P1★',
    description: 'Exercices à valider pour passer du niveau Non-Breveté au brevet P1★ LIFRAS/CMAS.',
    categories: [
      {
        id: 'piscine',
        label: 'Exercices en piscine (EAR)',
        exercices: [
          { id: 'aisance_aquatique',   label: 'Aisance aquatique de base en piscine', detail: 'Nager sans équipement, se sentir à l\'aise dans l\'eau' },
          { id: 'materiel',           label: 'Prise en main du matériel', detail: 'Détendeur, masque, palmes, stab (gilet), lestage' },
          { id: 'respiration_det',    label: 'Respiration avec détendeur et tuba', detail: 'Alterner tuba et détendeur, maintenir un rythme régulier' },
          { id: 'vidage_masque',      label: 'Vidage de masque complet en surface et sous l\'eau' },
          { id: 'egalisation',        label: 'Égalisation des oreilles en descente', detail: 'Manœuvre de Valsalva ou Frenzel' },
          { id: 'canard',             label: 'Canard : entrée dans l\'eau et immersion' },
          { id: 'regles_securite',    label: 'Règles de sécurité et signalétique sous-marine', detail: 'Signaux OK, problème, remontée, stop, niveaux de gaz' },
        ],
      },
      {
        id: 'eau_libre',
        label: 'Plongées en milieu naturel',
        exercices: [
          { id: 'plongees_encadrees', label: '5 plongées en milieu naturel encadrées', detail: 'Palanquée encadrée par un moniteur ou P3★ minimum', requiresValidation: true },
        ],
      },
    ],
  },

  // ─── P1★ → P2★ ──────────────────────────────────────────────
  {
    niveau: '1_etoile',
    niveauCible: '2_etoiles',
    label: 'Objectifs pour obtenir P2★',
    description: 'Exercices à valider pour passer du brevet P1★ au brevet P2★ LIFRAS/CMAS.',
    categories: [
      {
        id: 'ear',
        label: 'Exercices en piscine (EAR)',
        exercices: [
          { id: 'nage_200m',          label: 'Nager 200 m sans équipement', detail: 'Style libre ou dos, sans interruption' },
          { id: 'flottaison_10min',   label: 'Se maintenir en surface 10 min sans déplacement', detail: 'Gilet, palmage sur place' },
          { id: 'saut_apnee',         label: 'Saut avant droit + apnée dynamique 18 m minimum', detail: 'Depuis le bord de la piscine, palmage en apnée' },
          { id: 'apnee_statique',     label: 'Apnée statique en surface', detail: 'Durée minimale : 45 secondes' },
          { id: 'canard_vidage',      label: 'Canard + vidage de masque complet en profondeur' },
          { id: 'combinaison_bloc',   label: 'Mise en place de l\'équipement complet avec bloc', detail: 'Capelage/décapelage, stabilisation flottabilité' },
        ],
      },
      {
        id: 'eao',
        label: 'Exercices en eau libre (EAO)',
        exercices: [
          { id: 'palmage_tuba',       label: 'Palmage au tuba en équipement complet', detail: 'Rythme régulier, position horizontale' },
          { id: 'serre_file_1',       label: 'Rôle de serre-file : aider le chef de palanquée avant/pendant/après la plongée', requiresValidation: true },
          { id: 'serre_file_2',       label: 'Rôle de serre-file : veiller que la palanquée reste groupée', requiresValidation: true },
          { id: 'serre_file_3',       label: 'Rôle de serre-file : se mettre à l\'eau en dernier, sortir en premier', requiresValidation: true },
          { id: 'serre_file_4',       label: 'Rôle de serre-file : reprendre le rôle de DP si chef séparé', requiresValidation: true },
          { id: 'serre_file_5',       label: 'Rôle de serre-file : utiliser le parachute pendant le palier', requiresValidation: true },
        ],
      },
      {
        id: 'dp',
        label: '3 Directions de palanquée (DP)',
        exercices: [
          { id: 'dp1',               label: 'DP1 : plongée normale (briefing, conduite, débriefing)', requiresValidation: true },
          { id: 'dp2',               label: 'DP2 : orientation au compas, parcours ≥ 50 m sans repère visible', requiresValidation: true },
          { id: 'dp3',               label: 'DP3 : parachute obligatoire au palier de sécurité', requiresValidation: true },
        ],
      },
      {
        id: 'sauvetage',
        label: 'Techniques de sauvetage',
        exercices: [
          { id: 'remontee_assistee',  label: 'Remontée assistée en air depuis 20 m (partage d\'embout)', requiresValidation: true },
          { id: 'remontee_tech',      label: 'Remontée technique plongeur en difficulté depuis 20 m', requiresValidation: true },
          { id: 'remorquage',         label: 'Sauvetage + remorquage 50 m depuis 5 m de profondeur', requiresValidation: true },
          { id: 'rcr',               label: 'RCR — Réanimation Cardio-Respiratoire (formation validée)', requiresValidation: true },
        ],
      },
    ],
  },

  // ─── P2★ → P3★ ──────────────────────────────────────────────
  {
    niveau: '2_etoiles',
    niveauCible: '3_etoiles',
    label: 'Objectifs pour obtenir P3★',
    description: 'Exercices à valider pour passer du brevet P2★ au brevet P3★ LIFRAS/CMAS.',
    categories: [
      {
        id: 'prerequis',
        label: 'Prérequis (carnet de plongée)',
        exercices: [
          { id: 'pre_60_plongees',    label: '60 plongées en eau libre minimum', requiresValidation: true },
          { id: 'pre_nuit',          label: '5 plongées de nuit validées', requiresValidation: true },
          { id: 'pre_mer',           label: '20 plongées en mer minimum', requiresValidation: true },
          { id: 'pre_30h',           label: '30 heures de plongée cumulées', requiresValidation: true },
          { id: 'pre_40p',           label: 'Depuis P2★ : 40 plongées dont 20 à min 30 m', requiresValidation: true },
          { id: 'pre_profond',       label: 'Depuis P2★ : 10 plongées entre 35 et 40 m', requiresValidation: true },
          { id: 'pre_age',           label: 'Âge minimum 18 ans', requiresValidation: true },
          { id: 'pre_cfps',          label: 'CFPS (Certificat de Formation aux Premiers Secours) valide', requiresValidation: true },
        ],
      },
      {
        id: 'dp_eao',
        label: '5 Directions de palanquée complètes (EAO)',
        exercices: [
          { id: 'dp_briefing',       label: 'DP avec briefing complet : orientation, déco, débriefing', requiresValidation: true },
          { id: 'dp_parachute',      label: 'DP avec parachute obligatoire sur au moins une plongée', requiresValidation: true },
          { id: 'dp_encadrement',    label: 'Encadrement d\'un plongeur P1★ (plongée ≤ 15 m)', requiresValidation: true },
        ],
      },
      {
        id: 'sauvetage',
        label: 'Techniques de sauvetage avancées',
        exercices: [
          { id: 'remontee_ass_30',   label: 'Remontée assistée en air depuis 30 m', requiresValidation: true },
          { id: 'remorquage_100',    label: 'Sauvetage + remorquage 100 m depuis 10 m de profondeur', requiresValidation: true },
          { id: 'remontee_tech_30',  label: 'Remontée technique depuis 30 m (stabilisation obligatoire à 10 m, ±2 m de marge)', requiresValidation: true },
          { id: 'rcr_jour',         label: 'RCR le jour même de l\'épreuve sauvetage', requiresValidation: true },
        ],
      },
    ],
  },

  // ─── P3★ → P4★/GP ───────────────────────────────────────────
  {
    niveau: '3_etoiles',
    niveauCible: '4_etoiles',
    label: 'Objectifs pour obtenir P4★ / Guide de Palanquée',
    description: 'Exercices à valider pour passer du brevet P3★ au niveau P4★ (Guide de Palanquée) LIFRAS/CMAS.',
    categories: [
      {
        id: 'planification',
        label: 'Planification et organisation',
        exercices: [
          { id: 'plan_profil',       label: 'Planification d\'un profil de plongée complet', detail: 'Tables LIFRAS, paliers, intervalles, décompression' },
          { id: 'plan_logistique',   label: 'Organisation logistique d\'une sortie club', detail: 'Transport, matériel, membres, contacts d\'urgence' },
          { id: 'plan_securite',     label: 'Rédaction d\'un plan de sécurité de plongée', detail: 'Procédures urgence, centre hyperbare, moyens secours' },
        ],
      },
      {
        id: 'dp_avancee',
        label: 'Direction de palanquée avancée',
        exercices: [
          { id: 'dp_groupe',         label: 'DP avec 4 plongeurs ou plus', requiresValidation: true },
          { id: 'dp_profonde',       label: 'DP à 40 m ou plus (gestion narcose, paliers, remontée groupe)', requiresValidation: true },
          { id: 'dp_nuit',          label: 'DP en conditions de faible visibilité ou nuit', requiresValidation: true },
          { id: 'gestion_groupe',    label: 'Gestion d\'un groupe hétérogène (niveaux mixtes)', requiresValidation: true },
        ],
      },
      {
        id: 'sauvetage',
        label: 'Sauvetage et assistance',
        exercices: [
          { id: 'sauvetage_complet', label: 'Sauvetage complet : détection → remontée → surface', requiresValidation: true },
          { id: 'o2_therapeutique',  label: 'Administration d\'oxygène thérapeutique (formation O₂)', requiresValidation: true },
          { id: 'dea',              label: 'Utilisation d\'un DEA (défibrillateur) — BLS à jour', requiresValidation: true },
          { id: 'evacuation',       label: 'Coordination d\'une évacuation + contact centre hyperbare', requiresValidation: true },
        ],
      },
    ],
  },

  // ─── P4★ — Niveau max ────────────────────────────────────────
  {
    niveau: '4_etoiles',
    niveauCible: '',
    label: 'Niveau maximum',
    description: 'Vous êtes Guide de Palanquée 4★ LIFRAS/CMAS.',
    categories: [],
  },
]

export function getObjectifsForNiveau(brevet: string | null | undefined): NiveauObjectifs | undefined {
  return OBJECTIFS.find((o) => o.niveau === (brevet ?? 'non_brevet'))
}

export function countTotal(objectifs: NiveauObjectifs): number {
  return objectifs.categories.reduce((sum, c) => sum + c.exercices.length, 0)
}
