import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error('Missing required environment variables')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const requestClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: { user }, error: userError } = await requestClient.auth.getUser()
    if (userError || !user || !user.email) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const emailLower = user.email.toLowerCase()

    // Ensure a profile exists and is active
    const { data: existingProfile, error: profileFetchError } = await serviceClient
      .from('profiles')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileFetchError) {
      console.error('Failed to fetch profile:', profileFetchError.message)
      return new Response(JSON.stringify({ error: 'Failed to fetch profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Optionally ensure email is in allowed list (idempotent)
    const { data: allowedRow } = await serviceClient
      .from('allowed_users_email')
      .select('email')
      .eq('email', emailLower)
      .maybeSingle()

    if (!allowedRow) {
      const { error: insertAllowedErr } = await serviceClient
        .from('allowed_users_email')
        .insert({ email: emailLower })
      // Ignore duplicate errors
      if (insertAllowedErr) {
        console.warn('allowed_users_email insert warning:', insertAllowedErr.message)
      }
    }

    if (!existingProfile) {
      const role = (typeof user.user_metadata?.role === 'string' && (user.user_metadata.role === 'admin' || user.user_metadata.role === 'contractor'))
        ? user.user_metadata.role
        : 'contractor'

      const { error: insertError } = await serviceClient
        .from('profiles')
        .insert({
          user_id: user.id,
          email: emailLower,
          role,
          status: 'active',
          activated_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Failed to create profile:', insertError.message)
        return new Response(JSON.stringify({ error: 'Failed to create profile' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else if (existingProfile.status !== 'active') {
      const { error: updateError } = await serviceClient
        .from('profiles')
        .update({ status: 'active', activated_at: new Date().toISOString() })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Failed to activate profile:', updateError.message)
        return new Response(JSON.stringify({ error: 'Failed to activate profile' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('activate-profile error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})