-- Secure the views by recreating them with security_invoker
-- This makes the views execute with the permissions of the calling user, not the view owner

-- Drop and recreate v_doc_progress with security_invoker
DROP VIEW IF EXISTS public.v_doc_progress CASCADE;

CREATE VIEW public.v_doc_progress 
WITH (security_invoker = true) AS
WITH submission_stats AS (
  SELECT
    cr.contractor_id,
    cr.doc_type_id,
    cr.required_count,
    cr.planned_due_date,
    COUNT(CASE WHEN s.status = 'approved' THEN 1 END) AS approved_count,
    MIN(s.created_at) AS first_started_at,
    MIN(CASE WHEN s.status = 'submitted' THEN s.submitted_at END) AS first_submitted_at,
    MIN(CASE WHEN s.status = 'approved' THEN s.approved_at END) AS first_approved_at
  FROM public.contractor_requirements cr
  LEFT JOIN public.submissions s ON s.contractor_id = cr.contractor_id 
    AND s.doc_type_id = cr.doc_type_id
  GROUP BY cr.contractor_id, cr.doc_type_id, cr.required_count, cr.planned_due_date
)
SELECT
  cr.contractor_id,
  c.name AS contractor_name,
  cr.doc_type_id,
  d.name AS doc_type_name,
  d.category,
  d.is_critical,
  ss.required_count,
  ss.approved_count,
  ss.planned_due_date,
  CASE
    WHEN ss.approved_count >= ss.required_count THEN 'green'
    WHEN ss.planned_due_date IS NOT NULL AND CURRENT_DATE > ss.planned_due_date THEN 'red'
    WHEN ss.planned_due_date IS NOT NULL AND CURRENT_DATE > (ss.planned_due_date - INTERVAL '3 days') THEN 'amber'
    ELSE 'green'
  END AS status_color,
  ss.first_started_at,
  ss.first_submitted_at,
  ss.first_approved_at
FROM public.contractor_requirements cr
JOIN public.contractors c ON c.id = cr.contractor_id
JOIN public.doc_types d ON d.id = cr.doc_type_id
LEFT JOIN submission_stats ss ON ss.contractor_id = cr.contractor_id 
  AND ss.doc_type_id = cr.doc_type_id;

-- Drop and recreate v_contractor_kpi with security_invoker
DROP VIEW IF EXISTS public.v_contractor_kpi CASCADE;

CREATE VIEW public.v_contractor_kpi 
WITH (security_invoker = true) AS
WITH base AS (
  SELECT
    contractor_id,
    contractor_name,
    SUM(approved_count) AS total_approved,
    SUM(required_count) AS total_required,
    SUM(CASE WHEN is_critical THEN approved_count ELSE 0 END) AS must_have_approved,
    SUM(CASE WHEN is_critical THEN required_count ELSE 0 END) AS must_have_required,
    COUNT(CASE WHEN status_color = 'red' THEN 1 END) AS red_items,
    AVG(CASE 
      WHEN first_started_at IS NOT NULL AND first_submitted_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (first_submitted_at - first_started_at)) / 86400 
    END) AS avg_prep_days,
    AVG(CASE 
      WHEN first_submitted_at IS NOT NULL AND first_approved_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (first_approved_at - first_submitted_at)) / 86400 
    END) AS avg_approval_days
  FROM public.v_doc_progress
  GROUP BY contractor_id, contractor_name
)
SELECT
  contractor_id,
  contractor_name,
  ROUND(total_approved::numeric / NULLIF(total_required, 0), 2) AS completion_ratio,
  ROUND(must_have_approved::numeric / NULLIF(must_have_required, 0), 2) AS must_have_ready_ratio,
  red_items,
  ROUND(avg_prep_days::numeric, 1) AS avg_prep_days,
  ROUND(avg_approval_days::numeric, 1) AS avg_approval_days
FROM base;

-- Now enable RLS on the underlying tables that these views query
-- The views will inherit access control from the tables they query

-- Verify RLS is enabled on all required tables
ALTER TABLE public.contractor_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Add comment explaining the security model
COMMENT ON VIEW public.v_doc_progress IS 'Secured view using security_invoker - access controlled by underlying table RLS policies';
COMMENT ON VIEW public.v_contractor_kpi IS 'Secured view using security_invoker - access controlled by underlying table RLS policies';