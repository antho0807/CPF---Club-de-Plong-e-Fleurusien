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

// Référentiel LIFRAS/CMAS Belgique
// Chaque niveau affiche les objectifs pour OBTENIR le niveau SUIVANT
export const OBJECTIFS: NiveauObjectifs[] = [
  {
    niveau: '1_etoile',
    label: 'Objectifs pour obtenir 2★ (P2)',
    description: 'Exercices à valider pour passer du niveau 1★ au niveau 2★ LIFRAS/CMAS.',
    categories: [
      {
        id: 'equipement',
        label: 'Maîtrise de l\'équipement',
        exercices: [
          { id: 'capelage_decapelage',   label: 'Capelage et décapelage complet (surface)', detail: 'Mise en place et retrait de l\'équipement en surface' },
          { id: 'capelage_eau',          label: 'Capelage / décapelage en eau peu profonde', detail: 'À 1-2 m de profondeur' },
          { id: 'rinçage_entretien',     label: 'Rinçage et entretien du matériel après plongée' },
          { id: 'lestage',              label: 'Calcul et ajustement du lestage personnel' },
        ],
      },
      {
        id: 'piscine',
        label: 'Exercices piscine',
        exercices: [
          { id: 'palmage_ventral',       label: 'Palmage ventral (200 m sans interruption)' },
          { id: 'palmage_dorsal',        label: 'Palmage dorsal (50 m)' },
          { id: 'apnee_surface',         label: 'Tour du bassin en apnée (25 m minimum)' },
          { id: 'vidage_masque_5m',      label: 'Vidage de masque à 5 m de profondeur', detail: 'Technique complète, maîtrise de la respiration' },
          { id: 'lacher_reprise',        label: 'Lâcher et reprise d\'embout à 5 m' },
          { id: 'remontee_sans_embout',  label: 'Remontée sans embout depuis 5 m', detail: 'Expiration continue et contrôlée' },
          { id: 'equilibrage_gilet',     label: 'Équilibrage au gilet (flottabilité neutre à 5 m)', detail: 'Position horizontale stable sans effort' },
          { id: 'statique_5m',          label: 'Station immobile à 5 m pendant 1 minute' },
          { id: 'partage_air',          label: 'Partage d\'air avec embout de secours (octopus)', detail: 'Simulation de panne d\'air — donner et recevoir' },
        ],
      },
      {
        id: 'securite',
        label: 'Procédures de sécurité',
        exercices: [
          { id: 'remontee_controlee',   label: 'Remontée lente et contrôlée (≤ 10 m/min)', detail: 'Contrôle de la vitesse de remontée' },
          { id: 'palier_securite',      label: 'Exécution du palier de sécurité à 5 m (3 min)' },
          { id: 'signaux_plongee',      label: 'Maîtrise des signaux de plongée (OK, problème, remonter…)' },
          { id: 'procedure_urgence',    label: 'Procédures d\'urgence en surface (signal, position)' },
        ],
      },
      {
        id: 'mer',
        label: 'Exercices en mer / eau libre',
        exercices: [
          { id: 'mise_eau_echelle',     label: 'Mise à l\'eau depuis une échelle / plongeon' },
          { id: 'serre_file',           label: 'Rôle de serre-file lors d\'une plongée encadrée', detail: 'Suivre la palanquée, surveiller les membres' },
          { id: 'retour_bateau',        label: 'Retour au bateau / au bord en autonomie' },
          { id: 'navigation_basique',   label: 'Orientation basique sous l\'eau (cap, repères visuels)' },
        ],
      },
      {
        id: 'plongees',
        label: 'Plongées validées (minimum)',
        exercices: [
          { id: 'p20_plongees',         label: '20 plongées minimum inscrites dans le carnet LIFRAS' },
          { id: 'p10_naturel',          label: 'Dont 10 plongées en milieu naturel (mer, lac, carrière)' },
          { id: 'p_prof_20m',           label: 'Au moins 2 plongées validées jusqu\'à 20 m de profondeur' },
        ],
      },
    ],
  },
  {
    niveau: '2_etoiles',
    label: 'Objectifs pour obtenir 3★ (P3)',
    description: 'Exercices à valider pour passer du niveau 2★ au niveau 3★ LIFRAS/CMAS.',
    categories: [
      {
        id: 'dp',
        label: 'Direction de palanquée (DP)',
        exercices: [
          { id: 'dp_1',                 label: 'DP validée n°1 (moins de 10 m)', detail: 'Briefing, conduite de 2 plongeurs, débriefing' },
          { id: 'dp_2',                 label: 'DP validée n°2 (10 à 20 m)', detail: 'Gestion de la profondeur, respect des limites' },
          { id: 'dp_3',                 label: 'DP validée n°3 (10 à 20 m)', detail: 'Minimum 3 DP validées par un moniteur' },
          { id: 'briefing_dp',          label: 'Réalisation d\'un briefing complet avant immersion', detail: 'Profil de plongée, signaux, procédures urgence' },
          { id: 'debriefing_dp',        label: 'Réalisation d\'un débriefing après plongée' },
        ],
      },
      {
        id: 'serre_file',
        label: 'Rôle de serre-file avancé',
        exercices: [
          { id: 'sf_avance_1',          label: 'Serre-file lors d\'une DP avec 3 plongeurs ou plus' },
          { id: 'sf_avance_2',          label: 'Gestion d\'un incident mineur en tant que serre-file', detail: 'Perte d\'un plongeur, gestion du niveau de gaz' },
        ],
      },
      {
        id: 'navigation',
        label: 'Navigation sous-marine',
        exercices: [
          { id: 'nav_aller_retour',     label: 'Navigation au compas aller-retour (50 m)', detail: 'Retour au point de départ sans visibilité' },
          { id: 'nav_triangulaire',     label: 'Navigation triangulaire au compas' },
          { id: 'retour_bateau',        label: 'Retour autonome au bateau / à la bouée' },
        ],
      },
      {
        id: 'incidents',
        label: 'Gestion des incidents',
        exercices: [
          { id: 'panne_air_fond',       label: 'Simulation de panne d\'air au fond (partage octopus)', detail: 'Donner et recevoir l\'embout de secours à 15-20 m' },
          { id: 'panne_air_remontee',   label: 'Remontée en binôme sur une seule source d\'air' },
          { id: 'remorquage_surface',   label: 'Remorquage d\'un plongeur en difficulté en surface (50 m)' },
          { id: 'plongeur_inconscient', label: 'Mise en sécurité d\'un plongeur inconscient en surface', detail: 'Position, signal, appel des secours' },
        ],
      },
      {
        id: 'plongees',
        label: 'Plongées validées (minimum)',
        exercices: [
          { id: 'p50_plongees',         label: '50 plongées minimum dans le carnet LIFRAS' },
          { id: 'p30_naturel',          label: 'Dont 30 plongées en milieu naturel' },
          { id: 'p_prof_30m',           label: 'Au moins 2 plongées validées à 30 m ou plus' },
          { id: 'p_prof_40m',           label: 'Au moins 1 plongée validée à 40 m (encadrée)' },
        ],
      },
    ],
  },
  {
    niveau: '3_etoiles',
    label: 'Objectifs pour obtenir 4★ / Guide de Palanquée',
    description: 'Exercices à valider pour passer du niveau 3★ au niveau 4★ (Guide de palanquée) LIFRAS/CMAS.',
    categories: [
      {
        id: 'planification',
        label: 'Planification de plongées autonomes',
        exercices: [
          { id: 'plan_profil',          label: 'Planification d\'un profil de plongée complet', detail: 'Tables LIFRAS / ordinateur, paliers obligatoires, intervalles' },
          { id: 'plan_logistique',      label: 'Organisation logistique d\'une sortie club', detail: 'Transport, matériel, liste membres, contacts urgence' },
          { id: 'plan_meteo',           label: 'Analyse météo et conditions avant une sortie', detail: 'Vent, courant, visibilité, marées' },
          { id: 'plan_securite',        label: 'Rédaction d\'un plan de sécurité de plongée', detail: 'Procédures urgence, centre hyperbare, moyens de secours' },
        ],
      },
      {
        id: 'gestion_palanquee',
        label: 'Gestion complète d\'une palanquée',
        exercices: [
          { id: 'dp_4_plongeurs',       label: 'DP validée avec 4 plongeurs ou plus' },
          { id: 'dp_profonde',          label: 'DP validée à 40 m ou plus (profondeur maximale P3)', detail: 'Gestion de la narcose, paliers, remontée groupe' },
          { id: 'dp_nuit',             label: 'DP validée en conditions de faible visibilité ou nuit' },
          { id: 'gestion_groupe',       label: 'Gestion d\'un groupe hétérogène (niveaux mixtes)' },
        ],
      },
      {
        id: 'sauvetage',
        label: 'Sauvetage et assistance',
        exercices: [
          { id: 'sauvetage_complet',    label: 'Sauvetage complet : détection → remontée → surface', detail: 'Simulation complète d\'un accident de plongée' },
          { id: 'rcp_surface',         label: 'RCP en surface sur un plongeur sorti de l\'eau' },
          { id: 'oxygene_therapeutique', label: 'Administration d\'oxygène thérapeutique', detail: 'Formation obligatoire (bouteille O2, masque) ' },
          { id: 'dea',                 label: 'Utilisation d\'un DEA (défibrillateur)', detail: 'Formation BLS + DEA à jour' },
          { id: 'evacuation',          label: 'Coordination d\'une évacuation et contact centre hyperbare' },
        ],
      },
      {
        id: 'theorie',
        label: 'Théorie avancée',
        exercices: [
          { id: 'physique_plongee',     label: 'Physique de la plongée : pression, gaz, lois', detail: 'Loi de Boyle-Mariotte, Dalton, Henry' },
          { id: 'physiologie',          label: 'Physiologie : effets de la pression, narcose, ADD', detail: 'Accident de décompression, barotraumatismes' },
          { id: 'tables_plongee',       label: 'Maîtrise des tables de plongée LIFRAS', detail: 'Calcul de plongées consécutives, intervalles de surface' },
          { id: 'nitrox',              label: 'Initiation Nitrox (recommandé)', detail: 'Mélange enrichi, MOD, équivalent d\'air' },
        ],
      },
      {
        id: 'plongees',
        label: 'Plongées validées (minimum)',
        exercices: [
          { id: 'p100_plongees',        label: '100 plongées minimum dans le carnet LIFRAS' },
          { id: 'p50_mer',             label: 'Dont 50 plongées en mer ou milieu naturel' },
          { id: 'p_prof_60m',          label: 'Au moins 1 plongée validée à 60 m (encadrée instructeur)' },
          { id: 'p_2_nuits',           label: '2 plongées de nuit validées' },
        ],
      },
    ],
  },
  {
    niveau: '4_etoiles',
    label: 'Niveau maximum atteint',
    description: 'Vous êtes Guide de Palanquée 4★ LIFRAS/CMAS. Continuez à progresser vers les formations de moniteur.',
    categories: [],
  },
]

export function getObjectifsForNiveau(niveau: string): NiveauObjectifs | undefined {
  return OBJECTIFS.find((o) => o.niveau === niveau)
}

export function countTotal(objectifs: NiveauObjectifs): number {
  return objectifs.categories.reduce((sum, c) => sum + c.exercices.length, 0)
}
