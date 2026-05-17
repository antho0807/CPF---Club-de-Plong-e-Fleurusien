-- ============================================================
-- Migration 009 — Sites de plongée vérifiés (région Charleroi/Fleurus)
-- ============================================================

INSERT INTO public.dive_sites (
  name, site_type, address, gps_lat, gps_lng, country,
  max_depth, visibility_avg, min_brevet,
  description, facilities, safety_rules, access_instructions, emergency_contacts
) VALUES

-- ── 1. Carrière de Vodelée ───────────────────────────────────
(
  'Carrière de Vodelée',
  'carriere',
  'Route de Gimnée, 5600 Vodelée (Philippeville)',
  50.1665, 4.7284, 'BE',
  40, 6, 'non_brevet',
  'Ancienne carrière de marbre rose et gris, gérée par le RCAS (affilié LIFRAS). Eau claire avec visibilité moyenne de 6 m. Curiosités immergées : voilier, silo, char militaire. Faune : esturgeons, carpes, brochets, anguilles. Réservation obligatoire avant la visite.',
  'Gonflage air et nitrox sur place · Club-house · Vestiaires et sanitaires · Parking · Buvette',
  E'Règles LIFRAS applicables :\n• Certificat médical valide obligatoire\n• Palanquée minimum 2 plongeurs\n• Brevet minimum respecté selon la profondeur visée\n• Palier de sécurité 5 m / 3 min obligatoire\n• SMB recommandé\n• Réservation obligatoire via le RCAS',
  'Depuis Charleroi (~25 km) : N5 direction Philippeville, puis direction Vodelée. Réservation obligatoire : contacter le RCAS.',
  E'Centre hyperbare de référence :\nCHU Charleroi – Hôpital Vésale\nTél : 071/92.34.61\nSECOURS : 112'
),

-- ── 2. Carrière de La Croisette (Vodecée) ───────────────────
(
  'Carrière de La Croisette (Vodecée)',
  'carriere',
  'Vodecée, 5600 Philippeville',
  50.1698, 4.7198, 'BE',
  16, 8, 'non_brevet',
  'Ancienne carrière de marbre rouge, idéale pour débutants et niveaux intermédiaires. Eau cristalline avec murs de marbre rose. Faune abondante : carpes (très présentes), brochets. Site calme et sécurisé. Machines d''époque conservées dans le club-house.',
  'Vestiaires · Club-house avec machines d''époque · Parking · Site sans gonflage sur place',
  E'Règles LIFRAS applicables :\n• Certificat médical valide obligatoire\n• Palanquée minimum 2 plongeurs\n• Site adapté aux débutants (profondeur max 16 m)\n• Palier de sécurité 5 m / 3 min recommandé\n• SMB recommandé',
  'Depuis Charleroi (~25 km) : N5 direction Philippeville, puis direction Vodecée. Site proche de la Carrière de Vodelée.',
  E'Centre hyperbare de référence :\nCHU Charleroi – Hôpital Vésale\nTél : 071/92.34.61\nSECOURS : 112'
),

-- ── 3. Carrière de Roche Fontaine ───────────────────────────
(
  'Carrière de Roche Fontaine',
  'carriere',
  'Rue Terne des Coris, 5600 Philippeville',
  50.183085, 4.642207, 'BE',
  50, 5, '2_etoiles',
  'Site profond avec multiples plateaux : -22 m, -26 m, -36 m, -40 m, -43 m et -52 m. Parois abruptes de marbre blanc. Réservé aux plongeurs intermédiaires et avancés. Infrastructure complète sur site avec restauration et services médicaux.',
  'Vestiaires et sanitaires · Buvette et restauration · Barbecue · Gonflage air, nitrox et O2 · Pharmacie de secours · Parking',
  E'Règles LIFRAS applicables :\n• Certificat médical valide obligatoire\n• Brevet minimum P2★ recommandé (profondeurs importantes)\n• Palanquée minimum 2 plongeurs\n• Palier de sécurité 5 m / 3 min obligatoire\n• SMB OBLIGATOIRE pour plongées > 20 m\n• Planification des paliers obligatoire pour plongées > 40 m',
  'Depuis Charleroi (~30 km) : N5 direction Philippeville, suivre fléchage Roche Fontaine.',
  E'Centre hyperbare le plus proche :\nCHU Charleroi – Hôpital Vésale\nTél : 071/92.34.61\nSECOURS : 112'
),

-- ── 4. Carrière V2E (Villers-Deux-Églises) ──────────────────
(
  'Carrière V2E (Villers-Deux-Églises)',
  'carriere',
  'Rue du Traigneaux 105, 5630 Villers-Deux-Eglises',
  50.185051, 4.497018, 'BE',
  28, 7, 'non_brevet',
  'Carrière aménagée avec décors immergés variés. Faune impressionnante : silures, esturgeons, carpes. Site accessible tous niveaux avec gonflage sur place. Idéal pour les sorties club régulières depuis Charleroi. Site web : carrierev2e.be',
  'Gonflage air sur place · Parking · Sanitaires · Accès PMR partiel',
  E'Règles LIFRAS applicables :\n• Certificat médical valide obligatoire\n• Palanquée minimum 2 plongeurs\n• Palier de sécurité 5 m / 3 min obligatoire\n• SMB recommandé\n• Respect de la faune immergée (ne pas nourrir les poissons)',
  'Depuis Charleroi (~20 km) : N5 direction Philippeville, sortie Villers-Deux-Églises, suivre Rue du Traigneaux. Site le plus proche de Fleurus.',
  E'Centre hyperbare de référence :\nCHU Charleroi – Hôpital Vésale\nTél : 071/92.34.61\nSECOURS : 112'
),

-- ── 5. Barrage de l'Eau d'Heure (Plate-Taille) ─────────────
(
  'Barrage de l''Eau d''Heure – Plate-Taille',
  'lac',
  'Lac de la Plate-Taille, 5630 Cerfontaine',
  50.1833, 4.5167, 'BE',
  30, 4, 'non_brevet',
  'Plus grande zone aquatique de Belgique (5 lacs interconnectés). Biotope sous-marin unique avec objets immergés variés. Faune : brochet, sandre, écrevisses. Centre labellisé LIFRAS (géré par le CPBEH). Accès journalier à 5€, sans réservation préalable.',
  'Accès direct au lac · Parking · Sanitaires · Centre LIFRAS labellisé (CPBEH) · Pas de gonflage sur place',
  E'Règles LIFRAS applicables :\n• Certificat médical valide obligatoire\n• Palanquée minimum 2 plongeurs\n• Palier de sécurité 5 m / 3 min obligatoire\n• SMB OBLIGATOIRE (navigation sur les lacs)\n• Respecter les zones de plongée délimitées\n• Droit d''accès journalier : 5€/plongeur',
  'Depuis Charleroi (~35 km) : A54 puis N5 direction Philippeville, sortie Cerfontaine. Lac de la Plate-Taille bien indiqué. Sans réservation, 5€/personne.',
  E'Centre hyperbare de référence :\nCHU Charleroi – Hôpital Vésale\nTél : 071/92.34.61\nSECOURS : 112'
),

-- ── 6. Carrière de Floreffe "Car Sambre" ────────────────────
(
  'Carrière de Floreffe – Car Sambre',
  'carriere',
  'Rue Euriette, 5150 Floreffe',
  50.425291, 4.741664, 'BE',
  20, 6, 'non_brevet',
  'Carrière gérée par l''École de Plongée de Namur. Site accessible et sécurisé, idéal pour formations, baptêmes et premiers niveaux. Profondeur modérée (max 20 m) adaptée aux débutants. Pas de réservation nécessaire.',
  'Vestiaires disponibles · Parking · Site sans gonflage sur place',
  E'Règles LIFRAS applicables :\n• Certificat médical valide obligatoire\n• Palanquée minimum 2 plongeurs\n• Site adapté débutants (max 20 m)\n• Palier de sécurité 5 m / 3 min recommandé\n• SMB recommandé',
  'Depuis Charleroi (~15 km) : E420/A15 direction Namur, sortie Floreffe, suivre Rue Euriette. Site le plus proche de Charleroi.',
  E'Centre hyperbare de référence :\nCHU de Liège – Service hyperbare\nTél : +32 4 366 71 11\nSECOURS : 112'
),

-- ── 7. La Gombe (Esneux) ────────────────────────────────────
(
  'La Gombe (Esneux)',
  'carriere',
  'Esneux, Province de Liège',
  NULL, NULL, 'BE',
  31, 5, 'non_brevet',
  'Ancienne carrière de grès dans un cadre verdoyant et calme, à ~20 km de Liège. Eau claire, environnement naturel préservé. Centre labellisé LIFRAS. Idéal pour plongées découverte et niveaux tous brevets.',
  'Centre labellisé LIFRAS · Parking · Sanitaires',
  E'Règles LIFRAS applicables :\n• Certificat médical valide obligatoire\n• Palanquée minimum 2 plongeurs\n• Palier de sécurité 5 m / 3 min obligatoire\n• SMB recommandé',
  'Depuis Charleroi (~65 km) : E42 direction Liège, puis direction Esneux. Contacter le centre LIFRAS local pour les horaires d''accès.',
  E'Centre hyperbare de référence :\nCHU de Liège – Service hyperbare\nTél : +32 4 366 71 11\nSECOURS : 112'
),

-- ── 8. NEMO33 (Bruxelles) ────────────────────────────────────
(
  'NEMO33 (Bruxelles)',
  'fosse',
  'Rue de Stalle 333, 1180 Uccle (Bruxelles)',
  50.8052, 4.3401, 'BE',
  35, 10, 'non_brevet',
  'Fosse de plongée intérieure avec eau de source chauffée à 33°C — plongée en maillot possible. Ancienne plus profonde fosse de plongée d''Europe (35 m). Ouverte 365 jours/an. Idéale pour formations techniques, photos sous-marines et plongées hivernales. Salles de cours, location de matériel, restaurant.',
  'Eau chauffée 33°C · Accès 365j/an · Location de matériel · Salle de cours · Restaurant · Vestiaires et douches · Stationnement · Bouteilles disponibles à la location',
  E'Règles NEMO33 :\n• Certificat médical valide obligatoire\n• Réservation recommandée aux heures de pointe\n• Palanquée minimum 2 plongeurs\n• Toutes profondeurs accessibles selon brevet\n• Plongée en maillot autorisée (eau à 33°C)',
  'Depuis Charleroi (~80 km) : E19 direction Bruxelles, sortie Uccle, suivre Rue de Stalle. Site web : nemo33.com. Réservation en ligne recommandée.',
  E'Urgence médicale (Bruxelles) :\nCHU Saint-Pierre — Service des urgences\nTél : 02/535.31.11\nSECOURS : 112'
)

ON CONFLICT DO NOTHING;
