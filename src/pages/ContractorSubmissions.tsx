import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SubmissionsTabs } from '@/components/submissions/SubmissionsTabs';
import { useToast } from '@/hooks/use-toast';

export interface DocType {
  id: string;
  code: string;
  name: string;
  category: string;
  is_critical: boolean;
}

export interface ContractorRequirement {
  id: string;
  contractor_id: string;
  doc_type_id: string;
  required_count: number;
  planned_due_date: string | null;
  doc_type: DocType;
}

export interface DocProgress {
  doc_type_id: string;
  contractor_id: string;
  doc_type_name: string;
  category: string;
  is_critical: boolean;
  required_count: number;
  approved_count: number;
  planned_due_date: string | null;
  status_color: string;
  first_submitted_at: string | null;
  first_approved_at: string | null;
}

export interface Submission {
  id: string;
  contractor_id: string;
  doc_type_id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  note: string | null;
  cnt: number;
}

const ContractorSubmissions: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<ContractorRequirement[]>([]);
  const [docProgress, setDocProgress] = useState<DocProgress[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // TODO: Get actual contractor ID from auth context
  const contractorId = 'current-contractor-id';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load categories from doc_types
      const { data: docTypesData, error: docTypesError } = await supabase
        .from('doc_types')
        .select('category')
        .order('category');

      if (docTypesError) throw docTypesError;

      const uniqueCategories = [...new Set(docTypesData?.map(dt => dt.category) || [])];
      setCategories(uniqueCategories);

      // Load contractor requirements with doc_types
      const { data: requirementsData, error: requirementsError } = await supabase
        .from('contractor_requirements')
        .select(`
          *,
          doc_type:doc_types(*)
        `)
        .eq('contractor_id', contractorId);

      if (requirementsError) throw requirementsError;
      setRequirements(requirementsData || []);

      // Load doc progress view
      const { data: progressData, error: progressError } = await supabase
        .from('v_doc_progress')
        .select('*')
        .eq('contractor_id', contractorId);

      if (progressError) throw progressError;
      setDocProgress(progressData || []);

      // Load submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load submissions data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewSubmission = async (docTypeId: string, file: File) => {
    try {
      // TODO: Implement file upload to Supabase Storage
      // For now, create submission record with status=prepared
      const { error } = await supabase
        .from('submissions')
        .insert({
          contractor_id: contractorId,
          doc_type_id: docTypeId,
          status: 'prepared',
          cnt: 1
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submission created successfully"
      });

      // Reload data
      loadData();
    } catch (error) {
      console.error('Error creating submission:', error);
      toast({
        title: "Error",
        description: "Failed to create submission",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Submissions</h1>
        <p className="text-muted-foreground">
          Track and manage your document submissions by category
        </p>
      </div>

      <SubmissionsTabs
        categories={categories}
        requirements={requirements}
        docProgress={docProgress}
        submissions={submissions}
        onNewSubmission={handleNewSubmission}
        onRefresh={loadData}
      />
    </div>
  );
};

export default ContractorSubmissions;