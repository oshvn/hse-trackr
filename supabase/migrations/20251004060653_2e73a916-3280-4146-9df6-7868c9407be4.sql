-- Update more submissions to "submitted" status for Approvals Queue visibility
-- This will give us more data to analyze in the Approvals page

-- Update some approved submissions to submitted for Contractor A
UPDATE public.submissions 
SET 
  status = 'submitted',
  submitted_at = created_at + (RANDOM() * 3)::integer * INTERVAL '1 day',
  approved_at = NULL
WHERE contractor_id = (SELECT id FROM contractors WHERE name = 'Contractor A')
  AND status = 'approved'
  AND random() < 0.5;

-- Update some prepared submissions to submitted for Contractor C  
UPDATE public.submissions
SET 
  status = 'submitted',
  submitted_at = created_at + (RANDOM() * 2)::integer * INTERVAL '1 day'
WHERE contractor_id = (SELECT id FROM contractors WHERE name = 'Contractor C')
  AND status = 'prepared'
  AND random() < 0.7;

-- Add more "submitted" submissions for all contractors with diverse document types
DO $$
DECLARE
  req record;
  submit_count integer;
BEGIN
  FOR req IN 
    SELECT DISTINCT cr.contractor_id, cr.doc_type_id
    FROM contractor_requirements cr
    WHERE NOT EXISTS (
      SELECT 1 FROM submissions s 
      WHERE s.contractor_id = cr.contractor_id 
        AND s.doc_type_id = cr.doc_type_id
        AND s.status = 'submitted'
    )
    LIMIT 30
  LOOP
    -- Create 1-2 submitted submissions for each requirement
    submit_count := (RANDOM() * 2 + 1)::integer;
    
    FOR i IN 1..submit_count LOOP
      INSERT INTO public.submissions (
        contractor_id,
        doc_type_id,
        cnt,
        status,
        created_at,
        submitted_at,
        note
      )
      VALUES (
        req.contractor_id,
        req.doc_type_id,
        1,
        'submitted',
        CURRENT_TIMESTAMP - (RANDOM() * 30)::integer * INTERVAL '1 day',
        CURRENT_TIMESTAMP - (RANDOM() * 15)::integer * INTERVAL '1 day',
        'Pending approval - Sample data'
      );
    END LOOP;
  END LOOP;
END $$;