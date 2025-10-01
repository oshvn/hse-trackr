import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPER_ADMIN_EMAIL = Deno.env.get('SUPER_ADMIN_EMAIL')?.toLowerCase() ?? 'admin@osh.vn'

const errorResponse = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed')
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error('Missing Supabase environment variables')
      return errorResponse(500, 'Server configuration error')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse(401, 'Unauthorized')
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
      return errorResponse(401, 'Unauthorized')
    }

    const { data: requesterProfile, error: profileError } = await serviceClient
      .from('profiles')
      .select('role, email')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError || !requesterProfile || requesterProfile.role !== 'admin') {
      return errorResponse(403, 'Forbidden')
    }

    const body = await req.json()
    const action = body?.action

    if (action !== 'delete_user') {
      return errorResponse(400, 'Unsupported action')
    }

    const targetUserId = body?.targetUserId as string | undefined
    const targetEmailInput = (body?.email as string | undefined)?.toLowerCase().trim()

    if (!targetUserId && !targetEmailInput) {
      return errorResponse(400, 'Missing target user identifier')
    }

    const profileQuery = serviceClient
      .from('profiles')
      .select('id, user_id, email')

    let targetProfile = null
    if (targetUserId) {
      const { data, error } = await profileQuery.eq('user_id', targetUserId).maybeSingle()
      if (error) {
        console.error('Failed to fetch target profile by user_id', error)
        return errorResponse(500, 'Failed to load target profile')
      }
      targetProfile = data
    }

    if (!targetProfile && targetEmailInput) {
      const { data, error } = await profileQuery.eq('email', targetEmailInput).maybeSingle()
      if (error) {
        console.error('Failed to fetch target profile by email', error)
        return errorResponse(500, 'Failed to load target profile')
      }
      targetProfile = data
    }

    if (!targetProfile) {
      return errorResponse(404, 'User profile not found')
    }

    const targetEmail = (targetProfile.email ?? targetEmailInput ?? '').toLowerCase()
    if (targetEmail === SUPER_ADMIN_EMAIL) {
      return errorResponse(403, 'Cannot modify super admin')
    }

    const { error: deleteProfileError } = await serviceClient
      .from('profiles')
      .delete()
      .eq('id', targetProfile.id)

    if (deleteProfileError) {
      console.error('Failed to delete profile', deleteProfileError)
      return errorResponse(500, 'Failed to delete profile')
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

    let authUserId = targetProfile.user_id ?? targetUserId ?? null

    if (authUserId) {
      const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(authUserId)

      if (authDeleteError && !(authDeleteError.message?.includes('User not found') || (authDeleteError as any)?.status === 404)) {
        console.error('Failed to delete auth user', authDeleteError)
        return errorResponse(500, 'Failed to delete auth user')
      }
    } else if (targetEmail) {
      const { data: listData, error: listError } = await serviceClient.auth.admin.listUsers()
      if (!listError) {
        const authUser = (listData.users ?? []).find((u: any) => u.email?.toLowerCase() === targetEmail)
        if (authUser) {
          const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(authUser.id)
          if (authDeleteError && !(authDeleteError.message?.includes('User not found') || (authDeleteError as any)?.status === 404)) {
            console.error('Failed to delete auth user', authDeleteError)
            return errorResponse(500, 'Failed to delete auth user')
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('manage-users error', err)
    return errorResponse(500, 'Internal server error')
  }
})
