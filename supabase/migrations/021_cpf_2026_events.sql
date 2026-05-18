-- ============================================================
-- Migration 021 — Événements CPF 2026 + types social/voyage/ferie
-- ============================================================

-- 1. Étendre la contrainte event_type avec les nouveaux types
DO $$
BEGIN
  EXECUTE (
    SELECT 'ALTER TABLE public.events DROP CONSTRAINT ' || conname
    FROM pg_constraint
    WHERE conrelid = 'public.events'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%event_type%'
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.events ADD CONSTRAINT events_event_type_check CHECK (
  event_type IN (
    'entrainement_piscine','sortie_mer','sortie_lac','sortie_carriere',
    'formation','reunion','competition','social','voyage','ferie','autre'
  )
);

-- 2. Insérer les événements CPF 2026
DO $$
DECLARE aid uuid;
BEGIN
  SELECT id INTO aid FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1;

  -- ── JANVIER ──
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Galette des Rois' AND DATE(date_start) = '2026-01-06') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,is_recurring,is_cancelled,created_by)
    VALUES ('Galette des Rois','social','2026-01-06T20:00:00+01:00','2026-01-06T22:00:00+01:00',false,false,aid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'NEMO 33' AND DATE(date_start) = '2026-01-21') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,description,meeting_time,is_recurring,is_cancelled,created_by)
    VALUES ('NEMO 33','sortie_lac','2026-01-21T08:00:00+01:00','2026-01-21T18:00:00+01:00','Plongée au NEMO 33 — le lac souterrain de Wielewaal','07:00',false,false,aid);
  END IF;

  -- ── FÉVRIER ──
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Todi' AND DATE(date_start) = '2026-02-21') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,description,meeting_time,is_recurring,is_cancelled,created_by)
    VALUES ('Todi','sortie_lac','2026-02-21T08:00:00+01:00','2026-02-21T18:00:00+01:00','Centre de plongée Todi','07:00',false,false,aid);
  END IF;

  -- ── MARS ──
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Jeux piscine' AND DATE(date_start) = '2026-03-03') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,meeting_point,is_recurring,is_cancelled,created_by)
    VALUES ('Jeux piscine','entrainement_piscine','2026-03-03T20:00:00+01:00','2026-03-03T21:30:00+01:00','Piscine de Fleurus, Rue de Fleurjoux 50, 6220 Fleurus',false,false,aid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Photo de groupe' AND DATE(date_start) = '2026-03-10') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,description,meeting_point,is_recurring,is_cancelled,created_by)
    VALUES ('Photo de groupe','reunion','2026-03-10T20:00:00+01:00','2026-03-10T21:30:00+01:00','Photo officielle du club — tenue de club recommandée','Piscine de Fleurus, Rue de Fleurjoux 50, 6220 Fleurus',false,false,aid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Mardi Gras' AND DATE(date_start) = '2026-03-17') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,description,meeting_point,is_recurring,is_cancelled,created_by)
    VALUES ('Mardi Gras 🎭','social','2026-03-17T20:00:00+01:00','2026-03-17T21:30:00+01:00','Soirée Mardi Gras à la piscine — déguisements encouragés !','Piscine de Fleurus, Rue de Fleurjoux 50, 6220 Fleurus',false,false,aid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Duiktank' AND DATE(date_start) = '2026-03-21') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,description,meeting_time,is_recurring,is_cancelled,created_by)
    VALUES ('Duiktank','sortie_lac','2026-03-21T08:00:00+01:00','2026-03-21T18:00:00+01:00','Plongée au Duiktank','07:00',false,false,aid);
  END IF;

  -- ── AVRIL ──
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Jour férié — Pâques' AND DATE(date_start) = '2026-04-06') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,is_recurring,is_cancelled,created_by)
    VALUES ('Jour férié — Pâques','ferie','2026-04-06T00:00:00+02:00','2026-04-06T23:59:00+02:00',false,false,aid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Cinéma' AND DATE(date_start) = '2026-04-10') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,is_recurring,is_cancelled,created_by)
    VALUES ('Cinéma 🎬','social','2026-04-10T19:30:00+02:00','2026-04-10T22:30:00+02:00',false,false,aid);
  END IF;

  -- ── MAI ──
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Jour férié — Fête du Travail' AND DATE(date_start) = '2026-05-01') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,is_recurring,is_cancelled,created_by)
    VALUES ('Jour férié — Fête du Travail','ferie','2026-05-01T00:00:00+02:00','2026-05-01T23:59:00+02:00',false,false,aid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Tir ou photo' AND DATE(date_start) = '2026-05-05') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,meeting_point,is_recurring,is_cancelled,created_by)
    VALUES ('Tir ou photo 📸','social','2026-05-05T20:00:00+02:00','2026-05-05T21:30:00+02:00','Piscine de Fleurus, Rue de Fleurjoux 50, 6220 Fleurus',false,false,aid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title LIKE '%Soviet Fun Fest%' AND DATE(date_start) = '2026-05-09') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,description,is_recurring,is_cancelled,created_by)
    VALUES ('Soviet Fun Fest 🎉','social','2026-05-09T10:00:00+02:00','2026-05-09T22:00:00+02:00','Événement social — date à confirmer',false,false,aid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Assemblée Générale' AND DATE(date_start) = '2026-05-12') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,description,meeting_point,is_recurring,is_cancelled,created_by)
    VALUES ('Assemblée Générale','reunion','2026-05-12T19:30:00+02:00','2026-05-12T22:00:00+02:00','AG annuelle du CPF — présence souhaitée pour tous les membres','Piscine de Fleurus, Rue de Fleurjoux 50, 6220 Fleurus',false,false,aid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Jour férié — Ascension' AND DATE(date_start) = '2026-05-14') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,is_recurring,is_cancelled,created_by)
    VALUES ('Jour férié — Ascension','ferie','2026-05-14T00:00:00+02:00','2026-05-14T23:59:00+02:00',false,false,aid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title LIKE '%Paintball%' AND DATE(date_start) = '2026-05-23') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,description,is_recurring,is_cancelled,created_by)
    VALUES ('Paintball / Karting 🏎️','social','2026-05-23T10:00:00+02:00','2026-05-23T18:00:00+02:00','Sortie team building — lieu à confirmer',false,false,aid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Jour férié — Pentecôte' AND DATE(date_start) = '2026-05-25') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,is_recurring,is_cancelled,created_by)
    VALUES ('Jour férié — Pentecôte','ferie','2026-05-25T00:00:00+02:00','2026-05-25T23:59:00+02:00',false,false,aid);
  END IF;

  -- ── JUIN ──
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'BBQ club' AND DATE(date_start) = '2026-06-27') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,description,is_recurring,is_cancelled,created_by)
    VALUES ('BBQ club 🍖','social','2026-06-27T18:00:00+02:00','2026-06-27T23:00:00+02:00','Barbecue annuel du club — à confirmer',false,false,aid);
  END IF;

  -- ── JUILLET ──
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Jour férié — Fête Nationale belge' AND DATE(date_start) = '2026-07-21') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,is_recurring,is_cancelled,created_by)
    VALUES ('Jour férié — Fête Nationale belge 🇧🇪','ferie','2026-07-21T00:00:00+02:00','2026-07-21T23:59:00+02:00',false,false,aid);
  END IF;

  -- ── AOÛT ──
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Jour férié — Assomption' AND DATE(date_start) = '2026-08-15') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,is_recurring,is_cancelled,created_by)
    VALUES ('Jour férié — Assomption','ferie','2026-08-15T00:00:00+02:00','2026-08-15T23:59:00+02:00',false,false,aid);
  END IF;

  -- ── SEPTEMBRE ──
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Souper club' AND DATE(date_start) = '2026-09-05') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,description,is_recurring,is_cancelled,created_by)
    VALUES ('Souper club 🍽️','social','2026-09-05T19:00:00+02:00','2026-09-05T23:00:00+02:00','Repas annuel du club — lieu à confirmer',false,false,aid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'La Gravière du Fort' AND DATE(date_start) = '2026-09-18') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,description,meeting_time,is_recurring,is_cancelled,created_by)
    VALUES ('La Gravière du Fort — J1','sortie_carriere','2026-09-18T08:00:00+02:00','2026-09-18T18:00:00+02:00','Week-end plongée La Gravière du Fort — jour 1','07:00',false,false,aid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title LIKE '%Gravière du Fort%J2%' AND DATE(date_start) = '2026-09-19') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,description,meeting_time,is_recurring,is_cancelled,created_by)
    VALUES ('La Gravière du Fort — J2','sortie_carriere','2026-09-19T08:00:00+02:00','2026-09-19T18:00:00+02:00','Week-end plongée La Gravière du Fort — jour 2','07:00',false,false,aid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title LIKE '%Gravière du Fort%J3%' AND DATE(date_start) = '2026-09-20') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,description,meeting_time,is_recurring,is_cancelled,created_by)
    VALUES ('La Gravière du Fort — J3','sortie_carriere','2026-09-20T08:00:00+02:00','2026-09-20T18:00:00+02:00','Week-end plongée La Gravière du Fort — jour 3','07:00',false,false,aid);
  END IF;

  -- ── OCTOBRE ──
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title LIKE '%Voyage club%' AND DATE(date_start) = '2026-10-17') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,description,is_recurring,is_cancelled,created_by)
    VALUES ('Voyage club 2026 ✈️','voyage','2026-10-17T08:00:00+02:00','2026-10-23T22:00:00+02:00','Voyage annuel du club (7 jours) — destination à confirmer',false,false,aid);
  END IF;

  -- ── NOVEMBRE ──
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Jour férié — Armistice' AND DATE(date_start) = '2026-11-11') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,is_recurring,is_cancelled,created_by)
    VALUES ('Jour férié — Armistice','ferie','2026-11-11T00:00:00+01:00','2026-11-11T23:59:00+01:00',false,false,aid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title LIKE 'Cinéma%' AND DATE(date_start) = '2026-11-20') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,is_recurring,is_cancelled,created_by)
    VALUES ('Cinéma 🎬','social','2026-11-20T19:30:00+01:00','2026-11-20T22:30:00+01:00',false,false,aid);
  END IF;

  -- ── DÉCEMBRE ──
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Jour férié — Noël' AND DATE(date_start) = '2026-12-25') THEN
    INSERT INTO public.events (title,event_type,date_start,date_end,is_recurring,is_cancelled,created_by)
    VALUES ('Jour férié — Noël 🎄','ferie','2026-12-25T00:00:00+01:00','2026-12-25T23:59:00+01:00',false,false,aid);
  END IF;

END $$;
