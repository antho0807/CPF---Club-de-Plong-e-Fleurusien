-- ============================================================
-- Migration 007 — Calendrier des activités CPF 2026
-- Source : CALENDRIER DES ACTIVITES 2026 DU CPF
-- Note : toutes les dates et activités sont sujettes à confirmation
-- ============================================================

INSERT INTO public.events (title, event_type, date_start, date_end, description, is_cancelled)
VALUES
  -- ── Janvier ──────────────────────────────────────────────
  ('Galette des Rois',           'autre',              '2026-01-06 10:00:00+01', NULL,                      'Événement social du club', false),
  ('NEMO 33',                    'sortie_lac',         '2026-01-21 09:00:00+01', '2026-01-21 18:00:00+01',  'Sortie plongée à NEMO 33 (Bruxelles)', false),

  -- ── Février ──────────────────────────────────────────────
  ('Todi',                       'sortie_lac',         '2026-02-21 09:00:00+01', '2026-02-21 18:00:00+01',  'Sortie plongée à Todi', false),

  -- ── Mars ─────────────────────────────────────────────────
  ('Jeux piscine',               'entrainement_piscine','2026-03-03 19:00:00+01', NULL,                     'Jeux en piscine', false),
  ('Photo de groupe',            'autre',              '2026-03-10 19:00:00+01', NULL,                      'Photo de groupe du club', false),
  ('Mardi Gras',                 'autre',              '2026-03-17 19:00:00+01', NULL,                      'Événement Mardi Gras', false),
  ('Duiktank',                   'sortie_lac',         '2026-03-21 09:00:00+01', '2026-03-21 18:00:00+01',  'Sortie plongée au Duiktank', false),

  -- ── Avril ────────────────────────────────────────────────
  ('Cinéma',                     'autre',              '2026-04-10 19:00:00+02', NULL,                      'Sortie cinéma du club', false),

  -- ── Mai ──────────────────────────────────────────────────
  ('Tir ou photo sous-marine',   'competition',        '2026-05-05 09:00:00+02', NULL,                      'Tir ou photo sous-marine', false),
  ('Soviet Fun Fest',            'autre',              '2026-05-09 09:00:00+02', NULL,                      'Soviet Fun Fest', false),
  ('Assemblée Générale',         'reunion',            '2026-05-12 19:00:00+02', NULL,                      'Assemblée Générale annuelle du club CPF', false),
  ('Paintball / Karting',        'autre',              '2026-05-23 10:00:00+02', NULL,                      'Activité Paintball ou Karting', false),

  -- ── Juin ─────────────────────────────────────────────────
  ('BBQ Club',                   'autre',              '2026-06-27 12:00:00+02', NULL,                      'BBQ annuel du club', false),

  -- ── Septembre ────────────────────────────────────────────
  ('Souper club',                'autre',              '2026-09-05 19:00:00+02', NULL,                      'Souper du club', false),
  ('La Gravière du Fort',        'sortie_carriere',    '2026-09-18 09:00:00+02', '2026-09-20 18:00:00+02',  'Plongée à La Gravière du Fort (week-end de 3 jours)', false),

  -- ── Octobre ──────────────────────────────────────────────
  ('Voyage club',                'sortie_mer',         '2026-10-17 08:00:00+02', '2026-10-23 20:00:00+02',  'Voyage de plongée du club (7 jours)', false),

  -- ── Novembre ─────────────────────────────────────────────
  ('Cinéma',                     'autre',              '2026-11-20 19:00:00+01', NULL,                      'Sortie cinéma du club', false)

ON CONFLICT DO NOTHING;
