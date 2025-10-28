-- Migration: Create checklist_requirements table for document requirement configuration
-- This table allows admins to configure which checklist items are required per document type

BEGIN;

-- Create checklist_requirements table
CREATE TABLE IF NOT EXISTS public.checklist_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type_id UUID NOT NULL REFERENCES public.doc_types(id) ON DELETE CASCADE,
  checklist_item_id TEXT NOT NULL,
  checklist_label TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(doc_type_id, checklist_item_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_checklist_requirements_doc_type_id 
  ON public.checklist_requirements(doc_type_id);

-- Enable RLS
ALTER TABLE public.checklist_requirements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for checklist_requirements
CREATE POLICY "allow_admin_select_checklist_requirements" ON public.checklist_requirements
  FOR SELECT USING (true);

CREATE POLICY "allow_admin_insert_checklist_requirements" ON public.checklist_requirements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_admin_update_checklist_requirements" ON public.checklist_requirements
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "allow_admin_delete_checklist_requirements" ON public.checklist_requirements
  FOR DELETE USING (true);

COMMIT;
