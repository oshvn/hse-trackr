-- Add INSERT policy for admins on allowed_users_email table
CREATE POLICY "Admins can insert allowed emails" 
ON public.allowed_users_email 
FOR INSERT 
WITH CHECK (is_admin_user(auth.uid()));