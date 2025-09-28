-- ============================================================================
-- SQL: Database Constraints and Indexes for Admin Seeding
-- ============================================================================

-- Ensure role enum constraint exists (if not already created)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('admin', 'contractor');
    END IF;
END $$;

-- Add role constraint to profiles table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'profiles_role_check'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('admin', 'contractor'));
    END IF;
END $$;

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_contractor_id ON public.profiles(contractor_id) WHERE contractor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_allowed_users_email_lower ON public.allowed_users_email(lower(email));

-- Ensure admin can manage all users (RLS policy)
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role = 'admin' 
        AND p.status = 'active'
    )
);

-- ============================================================================
-- TypeScript: Admin Seeding Script
-- ============================================================================

/*
// seed-admin.ts
// Run this script to create the first admin user
// Usage: npx tsx seed-admin.ts

import { createClient } from '@supabase/supabase-js';

// TODO: Set these environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const adminEmail = 'admin@osh.vn';
const temporaryPassword = 'pQ9!vX7#N4zK@2rL8%fG'; // MUST BE CHANGED ON FIRST LOGIN

async function seedAdmin() {
  // Create Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('🌱 Starting admin user seeding...');

    // Step 1: Add admin email to allowed users
    console.log('📧 Adding admin email to allowed users...');
    const { error: allowedError } = await supabase
      .from('allowed_users_email')
      .upsert([{ email: adminEmail }], { onConflict: 'email' });

    if (allowedError && !allowedError.message.includes('duplicate')) {
      throw allowedError;
    }

    // Step 2: Create Auth user with admin metadata
    console.log('👤 Creating admin user in Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: temporaryPassword,
      email_confirm: true, // Skip email verification for admin
      user_metadata: {
        role: 'admin',
        force_password_change: true,
        created_by: 'seed_script',
        created_at: new Date().toISOString()
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User already exists, updating profile...');
        
        // Get existing user
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === adminEmail);
        
        if (existingUser) {
          // Update user metadata
          await supabase.auth.admin.updateUserById(existingUser.id, {
            user_metadata: {
              role: 'admin',
              force_password_change: true,
              updated_by: 'seed_script',
              updated_at: new Date().toISOString()
            }
          });
          
          authData.user = existingUser;
        }
      } else {
        throw authError;
      }
    }

    const userId = authData.user?.id;
    if (!userId) {
      throw new Error('Failed to get user ID from auth creation');
    }

    // Step 3: Create/Update profile record
    console.log('📝 Creating admin profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert([
        {
          user_id: userId,
          email: adminEmail,
          role: 'admin',
          contractor_id: null,
          status: 'active',
          invited_by: null,
          invited_at: new Date().toISOString(),
          activated_at: new Date().toISOString(),
          note: 'Initial admin user created by seed script'
        }
      ], { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });

    if (profileError) {
      throw profileError;
    }

    console.log('✅ Admin user seeded successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Temporary Password:', temporaryPassword);
    console.log('⚠️  IMPORTANT: Change password on first login!');
    console.log('🔗 Login URL: /auth');

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
}

// Run the seeding
seedAdmin();
*/