import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate one-time RUN_TOKEN
    const authHeader = req.headers.get('Authorization')
    const expectedToken = Deno.env.get('RUN_TOKEN')
    
    if (!authHeader || !expectedToken) {
      console.error('Missing Authorization header or RUN_TOKEN environment variable')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const providedToken = authHeader.replace('Bearer ', '')
    if (providedToken !== expectedToken) {
      console.error('Invalid RUN_TOKEN provided')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@osh.vn'
    const adminPassword = Deno.env.get('ADMIN_PASSWORD')

    if (!supabaseUrl || !serviceRoleKey || !adminPassword) {
      console.error('Missing required environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    console.log(`Starting admin user provisioning for: ${adminEmail}`)

    // Check if Auth user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let userId: string
    const existingUser = existingUsers.users.find(user => user.email === adminEmail)

    if (existingUser) {
      console.log('Auth user already exists, updating password and metadata')
      userId = existingUser.id
      
      // Update existing user
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: adminPassword,
        email_confirm: true,
        user_metadata: { role: 'admin' }
      })

      if (updateError) {
        console.error('Error updating existing user:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update existing user' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      console.log('Creating new Auth user')
      
      // Create new Auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { role: 'admin' }
      })

      if (createError || !newUser.user) {
        console.error('Error creating user:', createError)
        return new Response(
          JSON.stringify({ error: 'Failed to create user' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      userId = newUser.user.id
    }

    console.log(`Auth user ready with ID: ${userId}`)

    // Upsert profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        email: adminEmail,
        role: 'admin',
        contractor_id: null,
        status: 'active',
        activated_at: new Date().toISOString(),
        note: 'Admin user created by seed-first-admin function'
      })

    if (profileError) {
      console.error('Error upserting profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to create/update profile' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Admin user provisioning completed successfully')

    return new Response(
      JSON.stringify({ 
        ok: true, 
        user_id: userId,
        email: adminEmail,
        message: 'Admin user provisioned successfully. IMPORTANT: Delete this function immediately!' 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error in seed-first-admin:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})