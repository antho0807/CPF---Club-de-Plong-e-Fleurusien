-- ============================================================
-- Migration 013 — Sites de plongée supplémentaires (Belgique)
-- + RLS profiles pour organisateurs d'événements
-- ============================================================

-- ── Policy RLS : organisateur peut lire profils des inscrits ─

CREATE POLICY "profiles_read_event_organizer"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_registrations er
      JOIN public.events e ON e.id = er.event_id
      WHERE er.member_id = profiles.id
        AND e.created_by = (SELECT auth.uid())
    )
  );

-- ── Nouveaux sites de plongée ─────────────────────────────────

INSERT INTO public.dive_sites (
  name, site_type, address, gps_lat, gps_lng, country,
  max_depth, visibility_avg, min_brevet,
  description, facilities, safety_rules, access_instructions,
  emergency_contacts, booking_url
) VALUES

-- 1. Put van Ekeren (Muisbroek)
(
  'Put van Ekeren – Muisbroek',
  'lac',
  'Ekersedijk, 2030 Ekeren (Antwerpen)',
  51.2842, 4.4197, 'BE',
  20, 4, 'non_brevet',
  'Ancien site industriel reconverti en plan d''eau de loisirs, géré par l''AVOS depuis 1997. Situé dans un parc boisé de 12 ha. Profondeur maximale ~20 m avec thermocline marquée. Statues sous-marines, bouée à 18 m pour exercices de remontée, herbiers riches. Faune : carpes, perches, tanches. Zone pêche séparée de la zone plongée.',
  'Vestiaires · Sanitaires · Bouées de surface · Statue sous-marine · Zone réservée plongée séparée des pêcheurs',
  E'Règles LIFRAS + règlement AVOS :\n• Permis de plongée AVOS OBLIGATOIRE (QR code sur téléphone)\n• Palanquée minimum 2 plongeurs\n• Respect de la zone de plongée délimitée (pêcheurs présents)\n• Palier de sécurité 5 m / 3 min obligatoire\n• SMB recommandé\n• Certif médical valide obligatoire',
  'Depuis Anvers (~15 km) : Ring d''Anvers direction Ekeren, suivre Ekersedijk. Permis obligatoire via le site AVOS (avos.be) avant la visite — QR code à présenter à l''entrée.',
  E'Centre hyperbare de référence :\nCHU Anvers (UZA)\nTél : +32 3 821 30 00\nSECOURS : 112',
  'https://www.avos.be'
),

-- 2. Carrière de Barges (Tournai)
(
  'Carrière de Barges',
  'carriere',
  'Rue du Pont à Rieu, 7500 Tournai',
  50.5911, 3.3948, 'BE',
  40, 6, '2_etoiles',
  'Ancienne carrière de pierre noyée, gérée par l''Association Tournaisienne de Plongée (ATP ASBL). Profondeur physique jusqu''à 50 m mais limitée à 40 m par la réglementation LIFRAS. Plateformes immergées à 20, 30 et 40 m pour les exercices. 3 plates-formes de mise à l''eau avec escalier sécurisé. Site très aménagé, idéal pour la progression.',
  'Vestiaires · Oxygène thérapeutique sur site · Défibrillateur · Escalier sécurisé · 3 plates-formes · Carte du site disponible',
  E'Règles LIFRAS applicables :\n• Certificat médical valide obligatoire\n• Palanquée de sécurité O2 + bloc de réserve OBLIGATOIRE sur site\n• Brevet P2★ minimum recommandé (profondeurs importantes)\n• Profondeur max autorisée : 40 m (réglementation LIFRAS)\n• Palier de sécurité 5 m / 3 min obligatoire\n• SMB OBLIGATOIRE',
  'Depuis Charleroi (~65 km) : E19 direction Tournai, sortie Tournai-Ouest, Rue du Pont à Rieu. Réservation via l''ATP ASBL (Association Tournaisienne de Plongée).',
  E'Centre hyperbare le plus proche :\nCHRU de Lille (France, ~60 km)\nTél : 0033 3 20 44 55 50\nSECOURS : 112',
  NULL
),

-- 3. Carrière de Dour
(
  'Carrière de Dour',
  'carriere',
  'Rue d''Elouges, 7370 Dour',
  50.4170, 3.7630, 'BE',
  20, 5, 'non_brevet',
  'Ancienne carrière de calcaire gérée par le club Hainosaurus (depuis 2011). Plan d''eau de 2 ha à l''eau bleue turquoise, avec plateaux et pentes douces. Objets immergés : 4 voitures, 2 vedettes, 2 voiliers, 1 moto, 2 vélos, pontons, fûts, souches. Faune : écrevisses en grand nombre. Adapté à tous niveaux de la plongée découverte à l''exploration.',
  'Parking · Accès facilité · Site géré par club Hainosaurus · Objets immergés variés',
  E'Règles LIFRAS applicables :\n• Certificat médical valide obligatoire\n• Palanquée minimum 2 plongeurs\n• Site accessible tous niveaux (max 20 m)\n• Palier de sécurité 5 m / 3 min recommandé\n• SMB recommandé',
  'Depuis Charleroi (~45 km) : E19 direction Mons, puis N549 direction Dour, Rue d''Elouges. Contact : club Hainosaurus Boussudour (hainosaurusboussudour.be).',
  E'Centre hyperbare de référence :\nCHRU de Lille (France)\nTél : 0033 3 20 44 55 50\nSECOURS : 112',
  NULL
)

ON CONFLICT DO NOTHING;
