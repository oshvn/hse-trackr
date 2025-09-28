#!/usr/bin/env node

/**
 * Admin Seeding Script for OSH Document Management System
 * 
 * This script creates the first admin user with proper authentication setup.
 * 
 * Prerequisites:
 * 1. Set environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * 2. Ensure database schema is migrated with profiles table
 * 3. Run: npm install @supabase/supabase-js
 * 
 * Usage:
 * SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key node seed-admin.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const config = {
  adminEmail: 'admin@osh.vn',
  temporaryPassword: 'pQ9!vX7#N4zK@2rL8%fG', // MUST BE CHANGED ON FIRST LOGIN
  supabaseUrl: process.env.SUPABASE_URL,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
};

// Validation
if (!config.supabaseUrl || !config.serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function seedAdmin() {
  console.log('🌱 Starting OSH Admin User Seeding...\n');
  
  // Create Supabase client with service role
  const supabase = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Step 1: Add admin email to allowed users
    console.log('📧 Adding admin email to allowed users list...');
    const { error: allowedError } = await supabase
      .from('allowed_users_email')
      .upsert([{ email: config.adminEmail }], { onConflict: 'email' });

    if (allowedError && !allowedError.message.includes('duplicate')) {
      throw new Error(`Failed to add allowed email: ${allowedError.message}`);
    }
    console.log('   ✅ Admin email added to allowed users');

    // Step 2: Check if user already exists
    console.log('\n👤 Checking for existing admin user...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let existingUser = existingUsers.users.find(u => u.email === config.adminEmail);

    let authData;
    if (existingUser) {
      console.log('   ⚠️  User already exists, updating metadata...');
      
      // Update existing user
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          email_confirm: true,
          user_metadata: {
            role: 'admin',
            force_password_change: true,
            updated_by: 'seed_script',
            updated_at: new Date().toISOString()
          }
        }
      );

      if (updateError) {
        throw new Error(`Failed to update existing user: ${updateError.message}`);
      }
      
      authData = { user: updateData.user };
      console.log('   ✅ Existing user updated');
    } else {
      console.log('   🆕 Creating new admin user...');
      
      // Create new user
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: config.adminEmail,
        password: config.temporaryPassword,
        email_confirm: true, // Skip email verification for admin
        user_metadata: {
          role: 'admin',
          force_password_change: true,
          created_by: 'seed_script',
          created_at: new Date().toISOString()
        }
      });

      if (createError) {
        throw new Error(`Failed to create admin user: ${createError.message}`);
      }
      
      authData = createData;
      console.log('   ✅ New admin user created');
    }

    const userId = authData.user?.id;
    if (!userId) {
      throw new Error('Failed to get user ID from auth operation');
    }

    // Step 3: Create/Update profile record
    console.log('\n📝 Creating/updating admin profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert([
        {
          user_id: userId,
          email: config.adminEmail,
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
      throw new Error(`Failed to create/update profile: ${profileError.message}`);
    }
    console.log('   ✅ Admin profile created/updated');

    // Step 4: Verify the setup
    console.log('\n🔍 Verifying admin setup...');
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new Error('Profile verification failed');
    }
    console.log('   ✅ Admin setup verified');

    // Success summary
    console.log('\n🎉 Admin user seeded successfully!');
    console.log('=' .repeat(50));
    console.log(`📧 Email: ${config.adminEmail}`);
    console.log(`🔑 Temporary Password: ${config.temporaryPassword}`);
    console.log(`👤 Role: admin`);
    console.log(`🔗 Login URL: /auth`);
    console.log('=' .repeat(50));
    console.log('\n⚠️  SECURITY NOTICE:');
    console.log('   1. User MUST change password on first login');
    console.log('   2. System will force password change automatically');
    console.log('   3. Temporary password will be invalid after first change');
    console.log('\n📋 Next Steps:');
    console.log('   1. Login at /auth with the credentials above');
    console.log('   2. Change password when prompted');
    console.log('   3. Access admin features: Dashboard, Approvals, Users & Roles');
    console.log('   4. Invite other users through Users & Roles page');

  } catch (error) {
    console.error('\n❌ Error during admin seeding:');
    console.error(`   ${error.message}`);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check database connection and schema');
    console.error('   2. Verify Supabase service role key permissions');
    console.error('   3. Ensure profiles table exists with proper RLS policies');
    process.exit(1);
  }
}

// Execute seeding
if (require.main === module) {
  seedAdmin().then(() => {
    console.log('\n✨ Seeding completed successfully!');
    process.exit(0);
  });
}

module.exports = { seedAdmin };