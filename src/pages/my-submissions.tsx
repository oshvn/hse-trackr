import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { SubmissionsTabs } from '@/components/submissions/SubmissionsTabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSessionRole } from '@/hooks/useSessionRole';
import { FileText, Plus } from 'lucide-react';

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
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<ContractorRequirement[]>([]);
  const [docProgress, setDocProgress] = useState<DocProgress[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [contractors, setContractors] = useState<{ id: string; name: string }[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { profile, role } = useSessionRole();
  const isAdmin = role === 'admin' || role === 'super_admin';
  const contractorId = isAdmin ? selectedContractorId : profile?.contractor_id;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Admin needs to select a contractor first
      if (isAdmin && !selectedContractorId) {
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
      const submissionsWithUrls = (submissionsData || []).map((submission) => ({
        ...submission,
        file_url: null
      }));

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
  }, [role, contractorId, selectedContractorId, toast]);

  // Load contractors list for admin
  useEffect(() => {
    const loadContractors = async () => {
      if (isAdmin) {
        const { data, error } = await supabase
          .from('contractors')
          .select('id, name')
          .order('name');
        
        if (error) {
          console.error('Error loading contractors:', error);
        } else {
          setContractors(data || []);
          // Auto-select first contractor if available
          if (data && data.length > 0 && !selectedContractorId) {
            setSelectedContractorId(data[0].id);
          }
        }
      }
    };
    loadContractors();
  }, [role, selectedContractorId]);

  useEffect(() => {
    if (contractorId) {
      loadData();
    }
  }, [loadData, contractorId]);

  const handleNewSubmission = async (docTypeId: string, documentLink: string, note: string, checklist: string[]) => {
    try {
      if (!contractorId) {
        throw new Error('Missing contractor context');
      }

      // Create note with checklist
      const checklistText = checklist.map(item => `✓ ${item}`).join('\n');
      const fullNote = note 
        ? `${note}\n\nChecklist:\n${checklistText}\n\nLink: ${documentLink}`
        : `Checklist:\n${checklistText}\n\nLink: ${documentLink}`;

      const { error: insertError } = await supabase
        .from('submissions')
        .insert({
          contractor_id: contractorId,
          doc_type_id: docTypeId,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          cnt: 1,
          note: fullNote,
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
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">My Submissions</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'View and track contractor document submissions by category'
              : 'Track and manage your document submissions by category'}
          </p>
        </div>
        {contractorId && (
          <Button
            onClick={() => navigate('/bulk-submission')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nộp hồ sơ mới
          </Button>
        )}
      </div>

      {isAdmin && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <label htmlFor="contractor-select" className="font-medium">
            Select Contractor:
          </label>
          <select
            id="contractor-select"
            value={selectedContractorId}
            onChange={(e) => setSelectedContractorId(e.target.value)}
            className="flex-1 max-w-md px-3 py-2 border rounded-md bg-background"
          >
            <option value="">-- Choose a contractor --</option>
            {contractors.map(contractor => (
              <option key={contractor.id} value={contractor.id}>
                {contractor.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {contractorId ? (
        <SubmissionsTabs
          categories={categories}
          requirements={requirements}
          docProgress={docProgress}
          submissions={submissions}
          onNewSubmission={handleNewSubmission}
          onRefresh={loadData}
        />
      ) : (
        <div className="text-center p-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Please select a contractor to view their submissions'
              : 'No contractor assigned to your account'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MySubmissionsPage;