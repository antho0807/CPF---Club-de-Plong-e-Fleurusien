// Edge Function : invite-member
// Crée un utilisateur auth + profil pour un nouveau membre du club.
// Nécessite le service role key (côté serveur, jamais exposé au client).
// Appelée uniquement par les admins (vérification du JWT).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface InvitePayload {
  email: string
  full_name: string
  phone?: string | null
  date_naissance?: string | null
  lifras_number?: string | null
  brevet_level?: string | null
  role?: 'admin' | 'moniteur' | 'membre'
  notes?: string | null
}

Deno.serve(async (req: Request) => {
  // Préflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Client standard pour vérifier le JWT de l'appelant
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    )

    // Vérifier que l'appelant est authentifié et est admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Vérifier le rôle admin dans profiles
    const { data: callerProfile } = await anonClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Accès réservé aux administrateurs' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parser le payload
    const payload: InvitePayload = await req.json()

    if (!payload.email || !payload.full_name) {
      return new Response(JSON.stringify({ error: 'email et full_name sont requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Client admin avec service role pour créer l'utilisateur
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    // Créer l'utilisateur auth et lui envoyer un email de définition de mot de passe
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: payload.email,
      email_confirm: true,       // Email confirmé d'emblée
      user_metadata: { full_name: payload.full_name },
      // Le mot de passe sera défini par le membre via le lien de réinitialisation
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!newUser.user) {
      return new Response(JSON.stringify({ error: 'Échec création utilisateur' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Le trigger handle_new_user a déjà créé le profil de base.
    // On met à jour avec les champs additionnels.
    const updates: Record<string, unknown> = {}
    if (payload.phone !== undefined) updates.phone = payload.phone
    if (payload.date_naissance !== undefined) updates.date_naissance = payload.date_naissance
    if (payload.lifras_number !== undefined) updates.lifras_number = payload.lifras_number
    if (payload.brevet_level !== undefined) updates.brevet_level = payload.brevet_level
    if (payload.role !== undefined) updates.role = payload.role
    if (payload.notes !== undefined) updates.notes = payload.notes

    if (Object.keys(updates).length > 0) {
      await adminClient
        .from('profiles')
        .update(updates)
        .eq('id', newUser.user.id)
    }

    // Envoyer un email de réinitialisation de mot de passe (lien d'accès initial)
    await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: payload.email,
    })

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUser.user.id,
        message: `Invitation envoyée à ${payload.email}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('invite-member error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur serveur' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
