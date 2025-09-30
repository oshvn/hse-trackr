import React, { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, CheckCircle, XCircle, Upload, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { suggestActions, type DocProgressRow } from '@/helpers/suggestActions';
import type { DocProgress, Submission } from '@/pages/my-submissions';

interface SubmissionHistorySheetProps {
  open: boolean;
  onClose: () => void;
  docTypeId: string | null;
  submissions: Submission[];
  docProgress: DocProgress[];
  onRefresh: () => void;
}

export const SubmissionHistorySheet: React.FC<SubmissionHistorySheetProps> = ({
  open,
  onClose,
  docTypeId,
  submissions,
  docProgress,
  onRefresh
}) => {
  const docTypeSubmissions = useMemo(() => {
    if (!docTypeId) return [];
    return submissions
      .filter(sub => sub.doc_type_id === docTypeId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [docTypeId, submissions]);

  const currentDocProgress = useMemo(() => {
    if (!docTypeId) return null;
    return docProgress.find(prog => prog.doc_type_id === docTypeId);
  }, [docTypeId, docProgress]);

  const suggestedActions = useMemo(() => {
    if (!currentDocProgress) return [];
    
    const row: DocProgressRow = {
      contractor_name: 'Current Contractor', // TODO: Get from auth context
      doc_type_name: currentDocProgress.doc_type_name,
      status_color: currentDocProgress.status_color,
      planned_due_date: currentDocProgress.planned_due_date,
      is_critical: currentDocProgress.is_critical
    };

    return currentDocProgress.status_color === 'amber' || currentDocProgress.status_color === 'red'
      ? suggestActions(row)
      : [];
  }, [currentDocProgress]);

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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!docTypeId || !currentDocProgress) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {currentDocProgress.doc_type_name}
            {currentDocProgress.is_critical && (
              <Badge variant="destructive" className="text-xs">
                🔴 Critical
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Document Overview */}
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">
                  {currentDocProgress.approved_count}/{currentDocProgress.required_count}
                </span>
              </div>
              
              {currentDocProgress.planned_due_date && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Due Date</span>
                  <span className="text-sm">
                    {format(new Date(currentDocProgress.planned_due_date), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm">{currentDocProgress.category}</span>
              </div>
            </div>
          </Card>

          {/* Suggested Actions */}
          {suggestedActions.length > 0 && (
            <Card className="p-4 border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h3 className="font-medium text-amber-800">Suggested Actions</h3>
              </div>
              <ul className="space-y-2">
                {suggestedActions.map((action, index) => (
                  <li key={index} className="text-sm text-amber-700">
                    • {action}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Submission History */}
          <div className="space-y-4">
            <h3 className="font-medium">Submission History</h3>
            
            {docTypeSubmissions.length === 0 ? (
              <Card className="p-6 text-center">
                <div className="text-muted-foreground">
                  No submissions yet for this document type.
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {docTypeSubmissions.map((submission, index) => (
                  <Card key={submission.id} className="p-4">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(submission.status)}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(submission.status)}>
                            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(submission.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        
                        <div className="text-sm space-y-1">
                          {submission.submitted_at && (
                            <div className="text-muted-foreground">
                              Submitted: {format(new Date(submission.submitted_at), 'MMM dd, yyyy HH:mm')}
                            </div>
                          )}
                          {submission.approved_at && (
                            <div className="text-muted-foreground">
                              Approved: {format(new Date(submission.approved_at), 'MMM dd, yyyy HH:mm')}
                            </div>
                          )}
                          {submission.note && (
                            <div className="text-sm mt-2 p-2 bg-muted rounded">
                              <strong>Note:</strong> {submission.note}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button onClick={onRefresh} className="flex-1">
              Refresh
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};