import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables d\'environnement Supabase manquantes. Vérifiez votre fichier .env\n' +
    '  VITE_SUPABASE_URL=https://xxx.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=eyJxxx...',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'cpf-plongee-auth',
  },
  global: {
    headers: { 'x-app-name': 'cpf-plongee' },
  },
})

// ---------------------------------------------------------------
// Utilitaire : URL signée pour le bucket privé member-documents
// Durée par défaut : 1 heure (3600 s)
// ---------------------------------------------------------------
export async function getSignedUrl(
  storagePath: string,
  expiresIn = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('member-documents')
    .createSignedUrl(storagePath, expiresIn)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

// Batch : plusieurs chemins en un seul appel réseau
export async function getSignedUrls(
  paths: string[],
  expiresIn = 3600,
): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const { data, error } = await supabase.storage
    .from('member-documents')
    .createSignedUrls(paths, expiresIn)
  if (error || !data) return {}
  return Object.fromEntries(
    data
      .filter((item) => item.signedUrl)
      .map((item) => [item.path, item.signedUrl]),
  )
}

// Suppression d'un fichier dans Storage
export async function removeStorageFile(storagePath: string): Promise<void> {
  await supabase.storage.from('member-documents').remove([storagePath])
  // Pas de throw : si le fichier n'existe plus, on continue quand même
}

// URL du projet (pour les Edge Functions)
export const SUPABASE_FUNCTIONS_URL =
  import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string | undefined
