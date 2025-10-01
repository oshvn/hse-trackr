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

function generateSecurePassword(length = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const digits = '0123456789'
  const special = '!@#$%^&*()-_=+[]{}|;:,.<>?'
  const allChars = uppercase + lowercase + digits + special

  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  let password = ''
  password += uppercase[array[0] % uppercase.length]
  password += lowercase[array[1] % lowercase.length]
  password += digits[array[2] % digits.length]
  password += special[array[3] % special.length]

  for (let i = 4; i < length; i++) {
    password += allChars[array[i] % allChars.length]
  }

  return password
    .split('')
    .sort(() => {
      const shuffleArray = new Uint8Array(1)
      crypto.getRandomValues(shuffleArray)
      return shuffleArray[0] - 128
    })
    .join('')
}

const findAuthUser = async (
  serviceClient: any,
  userId: string | null,
  email: string,
) => {
  if (userId) {
    const byId = await serviceClient.auth.admin.getUserById(userId)
    if (!byId.error && byId.data?.user) {
      return byId.data.user
    }
  }

  const { data: listData, error: listError } = await serviceClient.auth.admin.listUsers()
  if (listError) {
    console.error('Failed to list auth users:', listError.message)
    return null
  }
  return listData.users.find((u) => u.email?.toLowerCase() === email) ?? null
}

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
      console.error('Missing required environment variables')
      return errorResponse(500, 'Server configuration error')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse(401, 'Unauthorized: Missing authorization header')
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
      console.error('Authentication failed:', userError?.message)
      return errorResponse(401, 'Unauthorized: Invalid token')
    }

    const { data: callerProfile, error: callerProfileError } = await serviceClient
      .from('profiles')
      .select('role, email')
      .eq('user_id', user.id)
      .maybeSingle()

    if (callerProfileError) {
      console.error('Failed to fetch caller profile:', callerProfileError.message)
      return errorResponse(500, 'Failed to verify permissions')
    }

    if (!callerProfile || callerProfile.role !== 'admin') {
      return errorResponse(403, 'Forbidden: Admin role required')
    }

    const body = await req.json()
    const action = (body?.action ?? 'invite') as 'invite' | 'reset_password'

    if (action === 'reset_password') {
      const targetUserId = (body?.target_user_id ?? body?.targetUserId) as string | undefined
      const targetEmail = (body?.email as string | undefined)?.toLowerCase().trim()

      if (!targetUserId && !targetEmail) {
        return errorResponse(400, 'Missing target_user_id or email')
      }

      const profileQuery = serviceClient
        .from('profiles')
        .select('user_id, email, role, contractor_id')

      let targetProfile = null
      if (targetUserId) {
        const { data, error } = await profileQuery.eq('user_id', targetUserId).maybeSingle()
        if (error) {
          console.error('Failed to fetch target profile:', error.message)
          return errorResponse(500, 'Failed to load target profile')
        }
        targetProfile = data
      }

      if (!targetProfile && targetEmail) {
        const { data, error } = await profileQuery.eq('email', targetEmail).maybeSingle()
        if (error) {
          console.error('Failed to fetch target profile by email:', error.message)
          return errorResponse(500, 'Failed to load target profile')
        }
        targetProfile = data
      }

      if (!targetProfile) {
        return errorResponse(404, 'User profile not found')
      }

      const normalizedEmail = (targetProfile.email ?? targetEmail ?? '').toLowerCase()
      if (!normalizedEmail) {
        return errorResponse(400, 'Cannot resolve user email')
      }

      if (normalizedEmail === SUPER_ADMIN_EMAIL) {
        return errorResponse(403, 'Cannot reset password for Super Admin')
      }

      const authUser = await findAuthUser(serviceClient, targetProfile.user_id ?? targetUserId ?? null, normalizedEmail)
      if (!authUser) {
        return errorResponse(404, 'Auth user not found')
      }

      const password = generateSecurePassword(16)
      const { error: updateError } = await serviceClient.auth.admin.updateUserById(authUser.id, {
        password,
        email_confirm: true,
        user_metadata: {
          ...(authUser.user_metadata ?? {}),
          password_reset_at: new Date().toISOString(),
          password_reset_by: user.id,
        },
      })

      if (updateError) {
        console.error('Failed to update auth user password:', updateError.message)
        return errorResponse(500, 'Failed to reset password')
      }

      const { error: profileUpdateError } = await serviceClient
        .from('profiles')
        .update({
          updated_at: new Date().toISOString(),
          status: 'active',
          user_id: authUser.id,
        })
        .eq('email', normalizedEmail)

      if (profileUpdateError) {
        console.error('Failed to update profile after reset:', profileUpdateError.message)
      }

      return new Response(
        JSON.stringify({
          success: true,
          email: normalizedEmail,
          password,
          role: targetProfile.role ?? (authUser.user_metadata?.role ?? 'contractor'),
          contractor_id: targetProfile.contractor_id ?? null,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const email = (body?.email as string | undefined)?.toLowerCase().trim()
    const role = body?.role as 'admin' | 'contractor' | undefined
    const contractor_id = body?.contractor_id as string | undefined
    const note = body?.note as string | undefined

    if (!email) {
      return errorResponse(400, 'Email is required')
    }

    if (!role || (role !== 'admin' && role !== 'contractor')) {
      return errorResponse(400, 'Invalid role: must be admin or contractor')
    }

    if (role === 'contractor' && !contractor_id) {
      return errorResponse(400, 'contractor_id is required for contractor role')
    }

    if (email === SUPER_ADMIN_EMAIL) {
      return errorResponse(400, 'Cannot invite with reserved Super Admin email')
    }

    const { data: existingUsers, error: authCheckError } = await serviceClient.auth.admin.listUsers()
    if (authCheckError) {
      console.error('Failed to check existing users:', authCheckError.message)
      return errorResponse(500, 'Failed to verify user existence')
    }

    const userExists = existingUsers.users.some((u) => u.email?.toLowerCase() === email)
    if (userExists) {
      return errorResponse(400, 'User already exists with this email')
    }

    const temporaryPassword = generateSecurePassword(16)
    const { data: newUser, error: createUserError } = await serviceClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        role,
        invited_by: user.id,
      },
    })

    if (createUserError || !newUser.user) {
      console.error('Failed to create auth user:', createUserError?.message)
      return errorResponse(500, 'Failed to create user account')
    }

    const { error: allowedEmailError } = await serviceClient
      .from('allowed_users_email')
      .insert({ email })

    if (allowedEmailError && !allowedEmailError.message.includes('duplicate')) {
      console.error('Failed to add allowed email:', allowedEmailError.message)
    }

    const profileData: Record<string, unknown> = {
      user_id: newUser.user.id,
      email,
      role,
      status: 'invited',
      invited_by: user.id,
      invited_at: new Date().toISOString(),
    }

    if (role === 'contractor' && contractor_id) {
      profileData.contractor_id = contractor_id
    }

    if (note) {
      profileData.note = note
    }

    const { error: upsertProfileError } = await serviceClient
      .from('profiles')
      .upsert(profileData, { onConflict: 'user_id' })

    if (upsertProfileError) {
      console.error('Failed to create profile:', upsertProfileError.message)
      await serviceClient.auth.admin.deleteUser(newUser.user.id)
      return errorResponse(500, 'Failed to create user profile')
    }

    return new Response(
      JSON.stringify({
        success: true,
        email,
        password: temporaryPassword,
        role,
        contractor_id: contractor_id ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('manage-invite error:', err instanceof Error ? err.message : 'Unknown error')
    return errorResponse(500, 'Internal server error')
  }
})
