import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ApprovalsFilters } from '@/components/approvals/ApprovalsFilters';
import { ApprovalsTable } from '@/components/approvals/ApprovalsTable';
import { SubmissionDetailSheet } from '@/components/approvals/SubmissionDetailSheet';
import { BulkBar } from '@/components/approvals/BulkBar';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays } from 'date-fns';

export interface ApprovalSubmission {
  id: string;
  contractor_id: string;
  doc_type_id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  note: string | null;
  contractor_name: string;
  doc_type_name: string;
  doc_type_category: string;
  is_critical: boolean;
  planned_due_date: string | null;
  overdue_days?: number;
  file_name: string | null;
  file_size: number | null;
  storage_path: string | null;
  file_url: string | null;
}

export interface FilterState {
  contractor: string;
  category: string;
  status: string;
}

const AdminApprovalsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<ApprovalSubmission[]>([]);
  const [contractors, setContractors] = useState<Array<{id: string, name: string}>>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    contractor: '',
    category: '',
    status: ''
  });
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const PAGE_SIZE = 20;
  const STORAGE_BUCKET = 'hse-documents';

  useEffect(() => {
    loadData();
    loadFilterOptions();
    setupRealtimeSubscription();
  }, [currentPage, filters]);

  const loadData = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('submissions')
        .select(`
          *,
          contractors!inner(id, name),
          doc_types!inner(id, name, category, is_critical)
        `)
        .in('status', ['submitted', 'revision'])
        .order('submitted_at', { ascending: false })
        .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

      // Apply filters
      if (filters.contractor) {
        query = query.eq('contractor_id', filters.contractor);
      }
      if (filters.category) {
        query = query.eq('doc_types.category', filters.category);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Load planned due dates separately
      const submissionIds = data?.map(sub => ({ contractor_id: sub.contractor_id, doc_type_id: sub.doc_type_id })) || [];
      
      let plannedDueDates: Record<string, string> = {};
      if (submissionIds.length > 0) {
        const { data: reqData } = await supabase
          .from('contractor_requirements')
          .select('contractor_id, doc_type_id, planned_due_date')
          .in('contractor_id', submissionIds.map(s => s.contractor_id))
          .in('doc_type_id', submissionIds.map(s => s.doc_type_id));
        
        reqData?.forEach(req => {
          const key = `${req.contractor_id}-${req.doc_type_id}`;
          plannedDueDates[key] = req.planned_due_date;
        });
      }

      const today = new Date();
      const processedSubmissions: ApprovalSubmission[] = (data || []).map((sub) => {
        const reqKey = `${sub.contractor_id}-${sub.doc_type_id}`;
        const plannedDueDate = plannedDueDates[reqKey];
        const overdueDays = plannedDueDate && !sub.approved_at
          ? differenceInDays(today, new Date(plannedDueDate))
          : 0;

        return {
          id: sub.id,
          contractor_id: sub.contractor_id,
          doc_type_id: sub.doc_type_id,
          status: sub.status,
          created_at: sub.created_at,
          submitted_at: sub.submitted_at,
          approved_at: sub.approved_at,
          note: sub.note,
          contractor_name: sub.contractors.name,
          doc_type_name: sub.doc_types.name,
          doc_type_category: sub.doc_types.category,
          is_critical: sub.doc_types.is_critical,
          planned_due_date: plannedDueDate,
          overdue_days: overdueDays > 0 ? overdueDays : undefined,
          file_name: null,
          file_size: null,
          storage_path: null,
          file_url: null,
        };
      });

      setSubmissions(processedSubmissions);
      setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));

    } catch (error) {
      console.error('Error loading submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      // Load contractors
      const { data: contractorsData } = await supabase
        .from('contractors')
        .select('id, name')
        .order('name');

      // Load categories
      const { data: categoriesData } = await supabase
        .from('doc_types')
        .select('category')
        .order('category');

      setContractors(contractorsData || []);
      setCategories([...new Set(categoriesData?.map(d => d.category) || [])]);

    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions'
        },
        () => {
          // Reload data when submissions change
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleApprove = async (submissionId: string, note?: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          note: note || null
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submission approved successfully"
      });

      loadData();
    } catch (error) {
      console.error('Error approving submission:', error);
      toast({
        title: "Error",
        description: "Failed to approve submission",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (submissionId: string, note: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'rejected',
          note
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submission rejected"
      });

      loadData();
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast({
        title: "Error",
        description: "Failed to reject submission",
        variant: "destructive"
      });
    }
  };

  const handleRequestRevision = async (submissionId: string, note: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'revision',
          note
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Revision requested"
      });

      loadData();
    } catch (error) {
      console.error('Error requesting revision:', error);
      toast({
        title: "Error",
        description: "Failed to request revision",
        variant: "destructive"
      });
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject', note?: string) => {
    const selectedIds = Array.from(selectedRows);
    
    try {
      const updates = selectedIds.map(id => 
        action === 'approve' 
          ? supabase.from('submissions').update({
              status: 'approved',
              approved_at: new Date().toISOString(),
              note: note || null
            }).eq('id', id)
          : supabase.from('submissions').update({
              status: 'rejected',
              note: note || ''
            }).eq('id', id)
      );

      await Promise.all(updates);

      toast({
        title: "Success",
        description: `${selectedIds.length} submissions ${action === 'approve' ? 'approved' : 'rejected'}`
      });

      setSelectedRows(new Set());
      loadData();
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} submissions`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Approvals Queue</h1>
        <p className="text-muted-foreground">
          Review and approve contractor document submissions
        </p>
      </div>

      <ApprovalsFilters
        filters={filters}
        onFiltersChange={setFilters}
        contractors={contractors}
        categories={categories}
      />

      {selectedRows.size > 0 && (
        <BulkBar
          selectedCount={selectedRows.size}
          onApprove={(note) => handleBulkAction('approve', note)}
          onReject={(note) => handleBulkAction('reject', note)}
          onClear={() => setSelectedRows(new Set())}
        />
      )}

      <ApprovalsTable
        submissions={submissions}
        loading={loading}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        onRowClick={setSelectedSubmission}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestRevision={handleRequestRevision}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <SubmissionDetailSheet
        open={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        submissionId={selectedSubmission}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestRevision={handleRequestRevision}
      />
    </div>
  );
};

export default AdminApprovalsPage;