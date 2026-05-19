/**
 * Edge Function — Confirmation de suppression de compte
 * Valide le code, puis supprime définitivement l'utilisateur Supabase Auth.
 * La suppression de auth.users cascade sur profiles et toutes les tables liées.
 *
 * Body : { user_id: string, token: string }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Vérifier le JWT du requérant
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: { user: requester }, error: authErr } = await supabase.auth.getUser(jwt)
  if (authErr || !requester) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }

  const { user_id, token } = await req.json()
  if (!user_id || !token) {
    return new Response(JSON.stringify({ error: 'user_id et token requis' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }

  // Chercher le token valide
  const { data: tokenRecord, error: tokenErr } = await supabase
    .from('account_deletion_tokens')
    .select('*')
    .eq('user_id', user_id)
    .eq('token', token)
    .eq('requested_by', requester.id)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (tokenErr || !tokenRecord) {
    return new Response(JSON.stringify({ error: 'Code invalide ou expiré' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }

  // Vérifier que le compte cible n'est pas un super admin (protection absolue)
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user_id)
    .single()

  if (targetProfile?.is_super_admin) {
    return new Response(
      JSON.stringify({ error: 'Ce compte est protégé et ne peut pas être supprimé.' }),
      { status: 403, headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  }

  // Supprimer le token (nettoyage avant la suppression du compte)
  await supabase.from('account_deletion_tokens').delete().eq('user_id', user_id)

  // Supprimer définitivement l'utilisateur Supabase Auth
  // (cascade sur profiles, registrations, documents, etc.)
  const { error: deleteErr } = await supabase.auth.admin.deleteUser(user_id)
  if (deleteErr) {
    return new Response(JSON.stringify({ error: deleteErr.message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }

  return new Response(
    JSON.stringify({ deleted: true }),
    { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
  )
})
