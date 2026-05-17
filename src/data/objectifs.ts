export interface Exercice {
  id: string
  label: string
  detail?: string
}

export interface Categorie {
  id: string
  label: string
  exercices: Exercice[]
}

export interface NiveauObjectifs {
  niveau: string
  label: string
  description: string
  categories: Categorie[]
}

export const OBJECTIFS: NiveauObjectifs[] = [
  {
    niveau: '1_etoile',
    label: '1★ — Plongeur 1 étoile',
    description: 'Plongée encadrée jusqu\'à 6 m. Découverte du milieu subaquatique.',
    categories: [
      {
        id: 'piscine',
        label: 'Exercices piscine',
        exercices: [
          { id: 'mise_eau_equipee',   label: 'Mise à l\'eau équipée depuis le bord' },
          { id: 'palmage_surface',    label: 'Palmage en surface (25 m sans interruption)' },
          { id: 'nage_dos',           label: 'Nage sur le dos avec palmes (25 m)' },
          { id: 'apnee_statique',     label: 'Apnée statique (30 secondes minimum)' },
          { id: 'vidage_masque',      label: 'Vidage de masque en surface' },
          { id: 'reprise_embout',     label: 'Lâcher et reprise d\'embout' },
          { id: 'descente_controlee', label: 'Descente contrôlée (équilibrage des oreilles)' },
          { id: 'flottabilite',       label: 'Maîtrise de la flottabilité à 3 m' },
          { id: 'remontee_passive',   label: 'Remontée passive gilet gonflé' },
          { id: 'deshabillage',       label: 'Déshabillage / rhabillage complet en surface' },
        ],
      },
      {
        id: 'plongees',
        label: 'Plongées validées (min. 4)',
        exercices: [
          { id: 'plongee_1', label: 'Plongée d\'exploration 1 (max 6 m, encadrée)' },
          { id: 'plongee_2', label: 'Plongée d\'exploration 2 (max 6 m, encadrée)' },
          { id: 'plongee_3', label: 'Plongée d\'exploration 3 (max 6 m, encadrée)' },
          { id: 'plongee_4', label: 'Plongée d\'exploration 4 (max 6 m, encadrée)' },
        ],
      },
    ],
  },
  {
    niveau: '2_etoiles',
    label: '2★ — Plongeur 2 étoiles',
    description: 'Plongée encadrée jusqu\'à 20 m. Acquiert l\'autonomie progressive.',
    categories: [
      {
        id: 'piscine',
        label: 'Exercices piscine',
        exercices: [
          { id: 'palmage_200m',       label: 'Palmage en surface (200 m sans interruption)' },
          { id: 'apnee_1min',         label: 'Apnée statique (1 minute)' },
          { id: 'apnee_15m',          label: 'Apnée dynamique (15 m)' },
          { id: 'remontee_passive',   label: 'Remontée passive depuis 5 m' },
          { id: 'vidage_5m',          label: 'Vidage de masque à 5 m de profondeur' },
          { id: 'octopus',            label: 'Ravitaillement en air (octopus / détendeur de secours)' },
          { id: 'lacher_embout_fond', label: 'Lâcher et reprise d\'embout au fond' },
          { id: 'maitrise_remontee',  label: 'Maîtrise d\'une remontée lente et contrôlée' },
          { id: 'palmage_fond',       label: 'Palmage horizontal au fond (20 m)' },
          { id: 'signes_commu',       label: 'Communication par signes sous l\'eau' },
        ],
      },
      {
        id: 'plongees',
        label: 'Plongées validées',
        exercices: [
          { id: 'total_20',    label: '20 plongées au minimum validées dans le carnet' },
          { id: 'en_mer_10',   label: 'Dont 10 plongées en mer ou en plan d\'eau naturel' },
          { id: 'prof_20m',    label: 'Au moins 1 plongée validée à 20 m' },
          { id: 'palier_5m',   label: 'Exécution d\'un palier de sécurité à 5 m (3 min)' },
        ],
      },
    ],
  },
  {
    niveau: '3_etoiles',
    label: '3★ — Plongeur 3 étoiles',
    description: 'Plongée autonome jusqu\'à 40 m. Peut être directeur de palanquée jusqu\'à 20 m.',
    categories: [
      {
        id: 'piscine',
        label: 'Exercices piscine',
        exercices: [
          { id: 'remorquage',           label: 'Remorquage d\'un plongeur en surface (50 m)' },
          { id: 'assistance_panne',     label: 'Assistance à un plongeur en panne d\'air' },
          { id: 'remontee_libre_20m',   label: 'Remontée en plongée libre depuis 20 m' },
          { id: 'mise_en_securite',     label: 'Mise en sécurité d\'un plongeur inconscient en surface' },
          { id: 'vidage_masque_10m',    label: 'Vidage de masque à 10 m' },
          { id: 'flottabilite_fine',    label: 'Flottabilité fine (stationnaire à ±20 cm)' },
        ],
      },
      {
        id: 'plongees',
        label: 'Plongées validées',
        exercices: [
          { id: 'total_50',  label: '50 plongées au minimum dans le carnet' },
          { id: 'mer_30',    label: 'Dont 30 plongées en mer ou plan d\'eau naturel' },
          { id: 'prof_40m',  label: 'Au moins 1 plongée validée à 40 m' },
          { id: 'orientation', label: 'Navigation / orientation sous-marine au compas' },
        ],
      },
      {
        id: 'dp',
        label: 'Direction de palanquée (DP)',
        exercices: [
          { id: 'dp_moins_10m',  label: 'DP validée à moins de 10 m (palanquée de 2)' },
          { id: 'dp_10_20m',     label: 'DP validée entre 10 et 20 m', detail: 'Planification, briefing, gestion des plongeurs' },
          { id: 'serre_file_1',  label: 'Rôle de serre-file lors d\'une plongée encadrée' },
          { id: 'serre_file_2',  label: '2e rôle de serre-file validé' },
          { id: 'gestion_urgence', label: 'Gestion d\'une situation d\'urgence simulée' },
        ],
      },
    ],
  },
  {
    niveau: '4_etoiles',
    label: '4★ — Guide de palanquée',
    description: 'Plongée autonome jusqu\'à 60 m. Directeur de palanquée sans restriction de profondeur.',
    categories: [
      {
        id: 'plongees',
        label: 'Plongées validées',
        exercices: [
          { id: 'total_100',     label: '100 plongées au minimum dans le carnet' },
          { id: 'mer_50',        label: 'Dont 50 plongées en mer' },
          { id: 'prof_60m',      label: 'Au moins 1 plongée validée à 60 m (encadrée)' },
          { id: 'nitrox',        label: 'Certification Nitrox (recommandée)', detail: 'Permet de plonger avec des mélanges enrichis' },
          { id: 'nuit_2',        label: '2 plongées de nuit validées' },
        ],
      },
      {
        id: 'dp',
        label: 'Direction de palanquée',
        exercices: [
          { id: 'dp_20_40m',       label: 'DP validée entre 20 et 40 m' },
          { id: 'dp_40_60m',       label: 'DP validée entre 40 et 60 m (encadrée par instructeur)' },
          { id: 'dp_groupe_4',     label: 'DP d\'une palanquée de 4 plongeurs ou plus' },
          { id: 'planification',   label: 'Planification complète d\'une sortie club', detail: 'Briefing, tables de plongée, gestion des risques' },
          { id: 'gestion_urgence', label: 'Gestion d\'accident de plongée (ADD simulé)' },
          { id: 'premiers_secours', label: 'Formation premiers secours à jour (BLS / DEA)' },
        ],
      },
    ],
  },
]

export function getObjectifsForNiveau(niveau: string): NiveauObjectifs | undefined {
  return OBJECTIFS.find((o) => o.niveau === niveau)
}

export function countTotal(objectifs: NiveauObjectifs): number {
  return objectifs.categories.reduce((sum, c) => sum + c.exercices.length, 0)
}
