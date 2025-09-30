import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SubmissionsTabs } from '@/components/submissions/SubmissionsTabs';
import { useToast } from '@/hooks/use-toast';
import { useSessionRole } from '@/hooks/useSessionRole';

const STORAGE_BUCKET = 'hse-documents';

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
  contractor_name?: string;
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
  file_name: string | null;
  file_size: number | null;
  storage_path: string | null;
  file_url: string | null;
}

const MySubmissionsPage: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<ContractorRequirement[]>([]);
  const [docProgress, setDocProgress] = useState<DocProgress[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { profile, role } = useSessionRole();
  const contractorId = profile?.contractor_id;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Skip loading if no contractor ID (admin users don't have contractor_id)
      if (role === 'admin') {
        setLoading(false);
        return;
      }

      if (!contractorId) {
        toast({
          title: "Error",
          description: "Unable to load contractor data",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

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
      const submissionsWithUrls = await Promise.all(
        (submissionsData || []).map(async (submission) => {
          if (!submission.storage_path) {
            return { ...submission, file_url: null };
          }

          try {
            const { data: signed } = await supabase
              .storage
              .from(STORAGE_BUCKET)
              .createSignedUrl(submission.storage_path, 60 * 60);

            return {
              ...submission,
              file_url: signed?.signedUrl ?? null,
            };
          } catch (storageError) {
            console.error('Failed to sign submission file', storageError);
            return { ...submission, file_url: null };
          }
        })
      );

      setSubmissions(submissionsWithUrls as Submission[]);

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
  }, [role, contractorId, toast]);

  useEffect(() => {
    if (contractorId || role === 'admin') {
      loadData();
    }
  }, [loadData, contractorId, role]);

  const handleNewSubmission = async (docTypeId: string, file: File, note: string) => {
    try {
      if (!contractorId) {
        throw new Error('Missing contractor context');
      }

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const storagePath = `${contractorId}/${docTypeId}/${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { error: insertError } = await supabase
        .from('submissions')
        .insert({
          contractor_id: contractorId,
          doc_type_id: docTypeId,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          cnt: 1,
          note: note ? note.trim() : null,
          file_name: sanitizedName,
          file_size: file.size,
          storage_path: storagePath,
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Document submitted successfully"
      });

      // Reload data
      loadData();
    } catch (error) {
      console.error('Error creating submission:', error);
      toast({
        title: "Error",
        description: "Failed to submit document",
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

export default MySubmissionsPage;