-- Create guest user for auto-login (this will be done through Supabase auth, but we need to ensure the user is in allowed_users_email)

-- Ensure guest user is in allowed emails (already done in first migration, but let's be safe)
insert into public.allowed_users_email(email)
values ('guest@example.com')
on conflict (email) do nothing;