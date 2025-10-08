-- Update helper function to treat super_admin as admin for access checks
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role IN ('admin','super_admin')
      AND status = 'active'
  );
$$;

-- Expand admin access in policies to include super_admin
-- submissions: SELECT
ALTER POLICY "Contractors can view their submissions"
ON public.submissions
USING (
  (contractor_id = (
    SELECT p.contractor_id FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'contractor' AND p.status = 'active'
  ))
  OR (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin') AND p.status = 'active'
    )
  )
);

-- submissions: UPDATE
ALTER POLICY "Contractors can update their submissions"
ON public.submissions
USING (
  (contractor_id = (
    SELECT p.contractor_id FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'contractor' AND p.status = 'active'
  ))
  OR (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin') AND p.status = 'active'
    )
  )
);

-- submissions: INSERT
ALTER POLICY "Contractors can insert their submissions"
ON public.submissions
WITH CHECK (
  (contractor_id = (
    SELECT p.contractor_id FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'contractor' AND p.status = 'active'
  ))
  OR (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin') AND p.status = 'active'
    )
  )
);

-- contractor_requirements: SELECT
ALTER POLICY "Contractors can view their requirements"
ON public.contractor_requirements
USING (
  (contractor_id = (
    SELECT p.contractor_id FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'contractor' AND p.status = 'active'
  ))
  OR (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role IN ('admin','super_admin') AND p.status = 'active'
    )
  )
  OR public.is_allowed_email()
);

-- contractors: SELECT
ALTER POLICY "Authenticated users can view contractors"
ON public.contractors
USING (
  (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.status = 'active'
    )
  )
  OR public.is_allowed_email()
);

-- doc_types: SELECT
ALTER POLICY "Authenticated users can view doc types"
ON public.doc_types
USING (
  (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.status = 'active'
    )
  )
  OR public.is_allowed_email()
);
