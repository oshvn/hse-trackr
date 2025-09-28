-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'contractor')),
  contractor_id UUID REFERENCES public.contractors(id),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'deactivated')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  activated_at TIMESTAMP WITH TIME ZONE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin' AND p.status = 'active'
  )
);

CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin' AND p.status = 'active'
  )
);

CREATE POLICY "Admins can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin' AND p.status = 'active'
  )
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create profile if user email is in allowed_users_email
  IF EXISTS (SELECT 1 FROM public.allowed_users_email WHERE lower(email) = lower(NEW.email)) THEN
    INSERT INTO public.profiles (user_id, email, role, status, activated_at)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data ->> 'role', 'contractor'),
      'active',
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update profile updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profile updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update submissions RLS to use contractor_id from profiles
DROP POLICY IF EXISTS "read_members_submissions" ON public.submissions;
CREATE POLICY "Contractors can view their submissions" 
ON public.submissions 
FOR SELECT 
USING (
  contractor_id = (
    SELECT p.contractor_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'contractor' AND p.status = 'active'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin' AND p.status = 'active'
  )
);

CREATE POLICY "Contractors can insert their submissions" 
ON public.submissions 
FOR INSERT 
WITH CHECK (
  contractor_id = (
    SELECT p.contractor_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'contractor' AND p.status = 'active'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin' AND p.status = 'active'
  )
);

CREATE POLICY "Contractors can update their submissions" 
ON public.submissions 
FOR UPDATE 
USING (
  contractor_id = (
    SELECT p.contractor_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'contractor' AND p.status = 'active'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin' AND p.status = 'active'
  )
);

-- Update contractor_requirements RLS
DROP POLICY IF EXISTS "read_members_requirements" ON public.contractor_requirements;
CREATE POLICY "Contractors can view their requirements" 
ON public.contractor_requirements 
FOR SELECT 
USING (
  contractor_id = (
    SELECT p.contractor_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'contractor' AND p.status = 'active'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin' AND p.status = 'active'
  )
  OR is_allowed_email()  -- Keep existing guest access
);

-- Update other tables RLS for better role-based access
DROP POLICY IF EXISTS "read_members_contractors" ON public.contractors;
CREATE POLICY "Authenticated users can view contractors" 
ON public.contractors 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.status = 'active'
  )
  OR is_allowed_email()  -- Keep existing guest access
);

DROP POLICY IF EXISTS "read_members_doc_types" ON public.doc_types;
CREATE POLICY "Authenticated users can view doc types" 
ON public.doc_types 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.status = 'active'
  )
  OR is_allowed_email()  -- Keep existing guest access
);