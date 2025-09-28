-- Fix security issue: Restrict access to allowed_users_email table
-- Replace the overly permissive policy with a secure one that only allows
-- authenticated users to check if their own email is in the allowed list

-- Drop the existing insecure policy
DROP POLICY IF EXISTS "Allow authenticated users to read allowed emails" ON public.allowed_users_email;

-- Create a secure policy that only allows users to check their own email
CREATE POLICY "Users can only check their own email" 
ON public.allowed_users_email 
FOR SELECT 
TO authenticated
USING (lower(email) = lower(auth.jwt() ->> 'email'));