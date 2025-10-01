import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPER_ADMIN_EMAIL = Deno.env.get('SUPER_ADMIN_EMAIL')?.toLowerCase() ?? 'admin@osh.vn'

/**
 * Generates a cryptographically secure random password
 * @param length Password length (minimum 16 characters)
 * @returns Strong password with mixed character types
 */
function generateSecurePassword(length = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const digits = '0123456789'
  const special = '!@#$%^&*()-_=+[]{}|;:,.<>?'
  const allChars = uppercase + lowercase + digits + special

  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  let password = ''
  // Ensure at least one character from each category
  password += uppercase[array[0] % uppercase.length]
  password += lowercase[array[1] % lowercase.length]
  password += digits[array[2] % digits.length]
  password += special[array[3] % special.length]

  // Fill remaining with random characters
  for (let i = 4; i < length; i++) {
    password += allChars[array[i] % allChars.length]
  }

  // Shuffle the password
  return password.split('').sort(() => {
    const shuffleArray = new Uint8Array(1)
    crypto.getRandomValues(shuffleArray)
    return shuffleArray[0] - 128
  }).join('')
}

serve(async (req) => {
  // Handle CORS preflight requests
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
      console.error('Missing required environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the caller's JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create anon client to verify caller identity
    const requestClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Create service client for admin operations
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Verify the caller is authenticated
    const {
      data: { user },
      error: userError,
    } = await requestClient.auth.getUser()

    if (userError || !user) {
      console.error('Authentication failed:', userError?.message)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the caller is an admin
    const { data: callerProfile, error: callerProfileError } = await serviceClient
      .from('profiles')
      .select('role, email')
      .eq('user_id', user.id)
      .maybeSingle()

    if (callerProfileError) {
      console.error('Failed to fetch caller profile:', callerProfileError.message)
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!callerProfile || callerProfile.role !== 'admin') {
      console.error('Permission denied: Caller is not an admin')
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const { email, role, contractor_id, note } = body

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate role
    if (!role || (role !== 'admin' && role !== 'contractor')) {
      return new Response(
        JSON.stringify({ error: 'Invalid role: must be admin or contractor' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate contractor_id for contractor role
    if (role === 'contractor' && !contractor_id) {
      return new Response(
        JSON.stringify({ error: 'contractor_id is required for contractor role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists in auth
    const { data: existingAuthUser, error: authCheckError } = await serviceClient.auth.admin.listUsers()
    
    if (authCheckError) {
      console.error('Failed to check existing users:', authCheckError.message)
      return new Response(
        JSON.stringify({ error: 'Failed to verify user existence' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userExists = existingAuthUser.users.some(u => u.email?.toLowerCase() === normalizedEmail)
    if (userExists) {
      return new Response(
        JSON.stringify({ error: 'User already exists with this email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate a strong random password (NEVER logged)
    const temporaryPassword = generateSecurePassword(16)

    // Create user in auth with email confirmation bypassed
    const { data: newUser, error: createUserError } = await serviceClient.auth.admin.createUser({
      email: normalizedEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        role: role,
        invited_by: user.id,
      }
    })

    if (createUserError || !newUser.user) {
      console.error('Failed to create auth user:', createUserError?.message)
      return new Response(
        JSON.stringify({ error: 'Failed to create user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User created successfully: ${normalizedEmail} (ID: ${newUser.user.id})`)

    // Insert into allowed_users_email (ignore duplicates)
    const { error: allowedEmailError } = await serviceClient
      .from('allowed_users_email')
      .insert({ email: normalizedEmail })
      .select()

    if (allowedEmailError && !allowedEmailError.message.includes('duplicate')) {
      console.error('Failed to add to allowed emails:', allowedEmailError.message)
      // Non-fatal error, continue
    }

    // Upsert profile record with the new user_id
    const profileData: any = {
      user_id: newUser.user.id,
      email: normalizedEmail,
      role: role,
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
      // Rollback: delete the auth user
      await serviceClient.auth.admin.deleteUser(newUser.user.id)
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Profile created successfully for: ${normalizedEmail}`)

    // Return success with the temporary password
    // SECURITY: Password is only returned in this response, never logged or stored
    return new Response(
      JSON.stringify({
        success: true,
        email: normalizedEmail,
        password: temporaryPassword,
        role: role,
        contractor_id: contractor_id || null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('manage-invite error:', err instanceof Error ? err.message : 'Unknown error')
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
