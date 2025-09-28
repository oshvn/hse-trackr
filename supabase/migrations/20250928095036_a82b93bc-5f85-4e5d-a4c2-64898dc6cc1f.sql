-- Add admin email to allowed users
INSERT INTO allowed_users_email (email) VALUES ('admin@osh.vn') ON CONFLICT (email) DO NOTHING;

-- Create admin user function that bypasses RLS for initial setup
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Check if admin user already exists in profiles
    IF EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@osh.vn') THEN
        RETURN;
    END IF;
    
    -- Create a placeholder profile for admin (user_id will be updated when auth user is created)
    INSERT INTO profiles (
        user_id,
        email, 
        role, 
        status,
        invited_at,
        activated_at,
        note
    ) VALUES (
        null, -- Will be updated when auth user is created
        'admin@osh.vn',
        'admin',
        'active',
        now(),
        now(),
        'Initial admin user created by migration'
    );
END;
$$;

-- Execute the function
SELECT create_admin_user();

-- Drop the function as it's no longer needed
DROP FUNCTION create_admin_user();