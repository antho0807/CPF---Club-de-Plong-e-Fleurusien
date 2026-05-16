-- ============================================================
-- Données initiales — CPF Club de Plongée Fleurusien
-- Exécuter APRÈS les migrations, en développement local.
-- NE PAS exécuter en production (créer les données via l'interface).
-- ============================================================

-- ---------------------------------------------------------------
-- Conseil d'Administration initial
-- ---------------------------------------------------------------
INSERT INTO ca_members (full_name, role, email, order_index) VALUES
  ('À définir', 'Président',         NULL, 0),
  ('À définir', 'Vice-Président',    NULL, 1),
  ('À définir', 'Secrétaire',        NULL, 2),
  ('À définir', 'Trésorier',         NULL, 3),
  ('À définir', 'Chef-Moniteur',     NULL, 4),
  ('À définir', 'Moniteur Fédéral',  NULL, 5)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------
-- Sites de plongée de référence en Belgique
-- ---------------------------------------------------------------
INSERT INTO dive_sites (
  name, site_type, address, country,
  max_depth, visibility_avg,
  description, safety_rules, emergency_contacts, min_brevet
) VALUES
(
  'Carrière de Dolembreux',
  'carriere',
  'Rue de la Carrière, 4920 Aywaille',
  'BE',
  30, 6,
  'Carrière en eau douce très appréciée des plongeurs belges. Bonne visibilité, site accessible aux débutants dans les zones peu profondes.',
  E'Règles de sécurité LIFRAS applicables sur ce site :\n• Certificat médical valide obligatoire pour tous les plongeurs (≥14 ans)\n• Palanquée minimum : 2 plongeurs\n• Brevet minimum requis respecté (voir fiche site)\n• Palier de sécurité à 5m / 3 minutes obligatoire\n• Bouée de signalement de surface (SMB) recommandée\n• Plongée interdite en cas d\'aptitude médicale suspendue\n• Après tout accident de plongée, reprise interdite sans nouvel examen médical\n• Signalement au responsable de palanquée avant toute descente',
  E'Centre hyperbare de référence Belgique :\nCHU de Liège — Service de médecine hyperbare\nTel: +32 4 366 71 11\nSECOURS : 112',
  'non_brevet'
),
(
  'Lac de Nismes',
  'lac',
  'Rue du Lac, 5670 Nismes',
  'BE',
  12, 4,
  'Petit lac naturel en eau douce, idéal pour les formations et brevets. Profondeur limitée, parfait pour les premières plongées.',
  E'Règles de sécurité LIFRAS applicables sur ce site :\n• Certificat médical valide obligatoire pour tous les plongeurs (≥14 ans)\n• Palanquée minimum : 2 plongeurs\n• Brevet minimum requis respecté (voir fiche site)\n• Palier de sécurité à 5m / 3 minutes obligatoire\n• Bouée de signalement de surface (SMB) recommandée\n• Plongée interdite en cas d\'aptitude médicale suspendue\n• Après tout accident de plongée, reprise interdite sans nouvel examen médical\n• Signalement au responsable de palanquée avant toute descente',
  E'Centre hyperbare de référence Belgique :\nCHU de Liège — Service de médecine hyperbare\nTel: +32 4 366 71 11\nSECOURS : 112',
  'non_brevet'
),
(
  'Piscine de Fleurus (entraînements)',
  'piscine',
  'Rue de la Piscine, 6220 Fleurus',
  'BE',
  4, 10,
  'Piscine communale de Fleurus utilisée pour les entraînements hebdomadaires du club. Accès réservé aux membres CPF lors des créneaux club.',
  E'Règles de sécurité LIFRAS applicables sur ce site :\n• Certificat médical valide obligatoire pour tous les plongeurs (≥14 ans)\n• Palanquée minimum : 2 plongeurs\n• Respect des consignes du maître-nageur en tout temps\n• Plongée interdite en cas d\'aptitude médicale suspendue\n• Après tout accident de plongée, reprise interdite sans nouvel examen médical',
  E'Centre hyperbare de référence Belgique :\nCHU de Liège — Service de médecine hyperbare\nTel: +32 4 366 71 11\nSECOURS : 112',
  'non_brevet'
),
(
  'Mer du Nord — Oostende',
  'mer',
  'Port d''Oostende, 8400 Oostende',
  'BE',
  18, 3,
  'Plongée en mer du Nord depuis le port d''Oostende. Visibilité variable selon les marées et la météo. Épaves remarquables dans la zone.',
  E'Règles de sécurité LIFRAS applicables sur ce site :\n• Certificat médical valide obligatoire pour tous les plongeurs (≥14 ans)\n• Palanquée minimum : 2 plongeurs\n• Brevet minimum P2★ requis pour les sorties mer\n• Palier de sécurité à 5m / 3 minutes obligatoire\n• Bouée de signalement de surface (SMB) OBLIGATOIRE\n• Vérification des horaires de marée avant toute plongée\n• Plongée interdite en cas d''aptitude médicale suspendue\n• Après tout accident de plongée, reprise interdite sans nouvel examen médical\n• Signalement au responsable de palanquée avant toute descente',
  E'Centre hyperbare de référence Belgique :\nCHU de Liège — Service de médecine hyperbare\nTel: +32 4 366 71 11\nGarde côtière belge : +32 59 70 10 00\nSECOURS : 112',
  '2_etoiles'
)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------
-- Note : les utilisateurs auth et profils sont créés via :
-- 1. L'interface d'inscription de l'application
-- 2. L'Edge Function invite-member (pour les admins)
-- Le premier compte créé doit être promu admin manuellement :
--
--   UPDATE profiles SET role = 'admin' WHERE email = 'admin@club.be';
--
-- ---------------------------------------------------------------
