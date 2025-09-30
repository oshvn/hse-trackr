import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPER_ADMIN_EMAIL = Deno.env.get('SUPER_ADMIN_EMAIL')?.toLowerCase() ?? 'admin@osh.vn'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const {
      data: { user },
      error: userError,
    } = await requestClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: requesterProfile, error: profileError } = await serviceClient
      .from('profiles')
      .select('role, email')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError || !requesterProfile || requesterProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const action = body?.action

    if (action !== 'delete_user') {
      return new Response(
        JSON.stringify({ error: 'Unsupported action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const targetUserId = body?.targetUserId as string | undefined

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing target user id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: targetProfile, error: targetProfileError } = await serviceClient
      .from('profiles')
      .select('id, user_id, email')
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (targetProfileError) {
      console.error('Failed to fetch target profile', targetProfileError)
      return new Response(
        JSON.stringify({ error: 'Failed to load target profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!targetProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const targetEmail = targetProfile.email?.toLowerCase()
    if (targetEmail === SUPER_ADMIN_EMAIL) {
      return new Response(
        JSON.stringify({ error: 'Cannot modify super admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: deleteProfileError } = await serviceClient
      .from('profiles')
      .delete()
      .eq('user_id', targetUserId)

    if (deleteProfileError) {
      console.error('Failed to delete profile', deleteProfileError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (targetEmail) {
      const { error: allowedError } = await serviceClient
        .from('allowed_users_email')
        .delete()
        .eq('email', targetEmail)

      if (allowedError) {
        console.error('Failed to remove allowed email', allowedError)
      }
    }

    const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(targetUserId)

    if (authDeleteError) {
      console.error('Failed to delete auth user', authDeleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete auth user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('manage-users error', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
