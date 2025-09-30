import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, CheckCircle, XCircle, Upload, RotateCcw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { RowActions } from './RowActions';
import type { ApprovalSubmission } from '@/pages/admin/approvals';

interface SubmissionDetail extends ApprovalSubmission {
  submission_history: Array<{
    id: string;
    status: string;
    created_at: string;
    submitted_at: string | null;
    approved_at: string | null;
    note: string | null;
  }>;
}

interface SubmissionDetailSheetProps {
  open: boolean;
  onClose: () => void;
  submissionId: string | null;
  onApprove: (submissionId: string, note?: string) => Promise<void>;
  onReject: (submissionId: string, note: string) => Promise<void>;
  onRequestRevision: (submissionId: string, note: string) => Promise<void>;
}

export const SubmissionDetailSheet: React.FC<SubmissionDetailSheetProps> = ({
  open,
  onClose,
  submissionId,
  onApprove,
  onReject,
  onRequestRevision
}) => {
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (submissionId && open) {
      loadSubmissionDetail();
    }
  }, [submissionId, open]);

  const loadSubmissionDetail = async () => {
    if (!submissionId) return;

    try {
      setLoading(true);

      // Load current submission with related data
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .select(`
          *,
          contractors(id, name),
          doc_types(id, name, category, is_critical)
        `)
        .eq('id', submissionId)
        .single();

      if (submissionError) throw submissionError;

      // Load planned due date separately
      const { data: reqData } = await supabase
        .from('contractor_requirements')
        .select('planned_due_date')
        .eq('contractor_id', submissionData.contractor_id)
        .eq('doc_type_id', submissionData.doc_type_id)
        .single();

      // Load submission history for this contractor and doc type
      const { data: historyData, error: historyError } = await supabase
        .from('submissions')
        .select('id, status, created_at, submitted_at, approved_at, note')
        .eq('contractor_id', submissionData.contractor_id)
        .eq('doc_type_id', submissionData.doc_type_id)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;

      // Calculate overdue days
      const today = new Date();
      const plannedDueDate = reqData?.planned_due_date;
      const overdueDays = plannedDueDate && !submissionData.approved_at
        ? Math.max(0, Math.ceil((today.getTime() - new Date(plannedDueDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      const detailedSubmission: SubmissionDetail = {
        id: submissionData.id,
        contractor_id: submissionData.contractor_id,
        doc_type_id: submissionData.doc_type_id,
        status: submissionData.status,
        created_at: submissionData.created_at,
        submitted_at: submissionData.submitted_at,
        approved_at: submissionData.approved_at,
        note: submissionData.note,
        contractor_name: submissionData.contractors.name,
        doc_type_name: submissionData.doc_types.name,
        doc_type_category: submissionData.doc_types.category,
        is_critical: submissionData.doc_types.is_critical,
        planned_due_date: plannedDueDate,
        overdue_days: overdueDays > 0 ? overdueDays : undefined,
        submission_history: historyData || []
      };

      setSubmission(detailedSubmission);

    } catch (error) {
      console.error('Error loading submission detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'prepared':
        return <Upload className="h-4 w-4 text-blue-500" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'revision':
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prepared':
        return 'bg-blue-100 text-blue-800';
      case 'submitted':
        return 'bg-amber-100 text-amber-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'revision':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!submission) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {submission.doc_type_name}
            {submission.is_critical && (
              <Badge variant="destructive" className="text-xs">
                🔴 Critical
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Submission Overview */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Contractor</span>
                <span className="text-sm font-medium">{submission.contractor_name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm">{submission.doc_type_category}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Current Status</span>
                <Badge className={getStatusColor(submission.status)}>
                  {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                </Badge>
              </div>
              
              {submission.planned_due_date && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Due Date</span>
                  <div className="text-right">
                    <div className="text-sm">
                      {format(new Date(submission.planned_due_date), 'MMM dd, yyyy')}
                    </div>
                    {submission.overdue_days && (
                      <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {submission.overdue_days} days overdue
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Current Submission Note */}
          {submission.note && (
            <Card className="p-4">
              <h3 className="font-medium mb-2">Latest Note</h3>
              <p className="text-sm text-muted-foreground">{submission.note}</p>
            </Card>
          )}

          {/* Actions */}
          {(submission.status === 'submitted' || submission.status === 'revision') && (
            <Card className="p-4">
              <h3 className="font-medium mb-3">Actions</h3>
              <div className="flex gap-2">
                <RowActions
                  submissionId={submission.id}
                  onApprove={(note) => onApprove(submission.id, note)}
                  onReject={(note) => onReject(submission.id, note)}
                  onRequestRevision={(note) => onRequestRevision(submission.id, note)}
                  disabled={false}
                />
              </div>
            </Card>
          )}

          {/* Submission Timeline */}
          <div className="space-y-4">
            <h3 className="font-medium">Submission History</h3>
            
            <div className="space-y-3">
              {submission.submission_history.map((item, index) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(item.status)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        {item.submitted_at && (
                          <div className="text-muted-foreground">
                            Submitted: {format(new Date(item.submitted_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                        )}
                        {item.approved_at && (
                          <div className="text-muted-foreground">
                            Approved: {format(new Date(item.approved_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                        )}
                        {item.note && (
                          <div className="text-sm mt-2 p-2 bg-muted rounded">
                            <strong>Note:</strong> {item.note}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};