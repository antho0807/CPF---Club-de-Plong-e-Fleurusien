# CPF — Club de Plongée Fleurusien

Application PWA officielle du CPF, club affilié LIFRAS/CMAS Belgium.

## Technologies

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: TailwindCSS v4 + composants custom (Radix UI)
- **Backend**: Supabase (Auth + PostgreSQL + Storage)
- **PWA**: vite-plugin-pwa + Workbox
- **Calendrier**: react-big-calendar
- **Formulaires**: react-hook-form + Zod

## Installation

### 1. Prérequis

- Node.js ≥ 18
- Compte Supabase (gratuit sur [supabase.com](https://supabase.com))

### 2. Cloner et installer

```bash
git clone <repo-url>
cd cpf-plongee
npm install
```

### 3. Configuration Supabase

Créez un projet sur [app.supabase.com](https://app.supabase.com), puis :

1. Dans **SQL Editor**, exécutez le fichier `supabase/migrations/001_initial_schema.sql`
2. Récupérez votre **URL** et **anon key** dans Settings → API

### 4. Variables d'environnement

```bash
cp .env.example .env
```

Remplissez `.env` avec vos clés Supabase :

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxx...
```

### 5. Storage Supabase

Le bucket `member-documents` est créé par la migration SQL.
Vérifiez qu'il est bien configuré en **privé** (non public).

### 6. Premier utilisateur admin

Après inscription du premier utilisateur, dans Supabase → Table Editor → profiles :
Mettez manuellement `role = 'admin'` pour votre compte.

### 7. Lancer en développement

```bash
npm run dev
```

## Déploiement

### Vercel

```bash
npm install -g vercel
vercel --prod
```

Variables à configurer dans Vercel Dashboard :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Netlify

```bash
npm run build
# Déployer le dossier dist/
```

## Structure du projet

```
src/
├── components/
│   ├── layout/        # Navbar, BottomNav, Layout
│   ├── dashboard/     # ComplianceWidget, StatsCards, UpcomingEvents
│   ├── events/        # EventModal, EventForm
│   ├── members/       # MemberForm, ComplianceBadge
│   ├── documents/     # DocumentUpload, DocumentList
│   ├── sites/         # SiteForm
│   └── ui/            # Button, Input, Card, Dialog, etc.
├── pages/
│   ├── auth/          # Login, Register
│   ├── Dashboard.tsx
│   ├── Calendar.tsx
│   ├── Members.tsx
│   ├── MemberProfile.tsx
│   ├── DiveSites.tsx
│   ├── Documents.tsx
│   ├── ClubInfo.tsx
│   └── Profile.tsx
├── hooks/             # useAuth, useEvents, useMembers, useDocuments, useCompliance
├── lib/               # supabase.ts, compliance.ts, utils.ts
└── types/             # database.types.ts
```

## Rôles et permissions

| Fonctionnalité | Membre | Moniteur | Admin |
|---|---|---|---|
| Voir le calendrier | ✅ | ✅ | ✅ |
| S'inscrire aux événements | ✅ | ✅ | ✅ |
| Uploader ses documents | ✅ | ✅ | ✅ |
| Créer des événements | ❌ | ✅ | ✅ |
| Gérer les sites | ❌ | ✅ | ✅ |
| Voir tous les membres | ❌ | ✅ | ✅ |
| Ajouter/modifier membres | ❌ | ❌ | ✅ |
| Gérer le CA | ❌ | ❌ | ✅ |
| Export CSV | ❌ | ❌ | ✅ |

## Règles LIFRAS intégrées

- **CACI auto-déclaratif** : accepté pour NB et P1★ (depuis janvier 2024)
- **Attestation médicale médecin** : obligatoire pour P2★ et supérieur
- **Validité** : jusqu'au 31/01/N+1 (délivré janv.–août) ou 31/01/N+2 (délivré sept.–déc.)
- **Blocage inscription** : automatique si certificat expiré
- **Centre hyperbare** : CHU de Liège (+32 4 366 71 11) pré-rempli sur chaque fiche site

## Icônes PWA

Créez les icônes dans `public/icons/` :
- `icon-192.png` (192×192px)
- `icon-512.png` (512×512px)

Utilisez un logo du club ou un pictogramme plongée aux couleurs CPF (#0077b6).

## Licence

Usage exclusif CPF — Club de Plongée Fleurusien.
