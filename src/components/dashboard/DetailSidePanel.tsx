import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { SuggestedActionsList } from './SuggestedActionsList';
import { Clock, CheckCircle, XCircle, Upload, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import type { DocProgressData } from '@/lib/dashboardHelpers';
import { suggestActions, calculateOverdueDays } from '@/lib/dashboardHelpers';

interface DetailData extends DocProgressData {
  overdueDays?: number;
  submissionHistory: Array<{
    id: string;
    status: string;
    created_at: string;
    submitted_at: string | null;
    approved_at: string | null;
    note: string | null;
    cnt: number;
  }>;
}

interface DetailSidePanelProps {
  open: boolean;
  onClose: () => void;
  contractorId: string | null;
  docTypeId: string | null;
  docProgressData: DocProgressData[];
}

export const DetailSidePanel: React.FC<DetailSidePanelProps> = ({
  open,
  onClose,
  contractorId,
  docTypeId,
  docProgressData
}) => {
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contractorId && docTypeId && open) {
      loadDetailData();
    }
  }, [contractorId, docTypeId, open]);

  const loadDetailData = async () => {
    if (!contractorId || !docTypeId) return;

    try {
      setLoading(true);

      // Find the progress data for this combination
      const progressItem = docProgressData.find(
        item => item.contractor_id === contractorId && item.doc_type_id === docTypeId
      );

      if (!progressItem) {
        setDetailData(null);
        return;
      }

      // Load submission history
      const { data: submissionHistory, error } = await supabase
        .from('submissions')
        .select('id, status, created_at, submitted_at, approved_at, note, cnt')
        .eq('contractor_id', contractorId)
        .eq('doc_type_id', docTypeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const overdueDays = calculateOverdueDays(progressItem.planned_due_date);

      setDetailData({
        ...progressItem,
        overdueDays: overdueDays > 0 ? overdueDays : undefined,
        submissionHistory: submissionHistory || []
      });

    } catch (error) {
      console.error('Error loading detail data:', error);
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

  if (!detailData && !loading) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {detailData ? detailData.doc_type_name : 'Loading...'}
            {detailData?.is_critical && (
              <Badge variant="destructive" className="text-xs">
                🔴 Critical
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading details...</div>
          </div>
        ) : detailData ? (
          <div className="space-y-6 mt-6">
            {/* Overview */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Overview</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Contractor</span>
                  <span className="text-sm font-medium">{detailData.contractor_name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <span className="text-sm">{detailData.category}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm">
                    {detailData.approved_count}/{detailData.required_count}
                  </span>
                </div>
                
                {detailData.planned_due_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Due Date</span>
                    <div className="text-right">
                      <div className="text-sm">
                        {format(new Date(detailData.planned_due_date), 'MMM dd, yyyy')}
                      </div>
                      {detailData.overdueDays && (
                        <Badge variant="outline" className="text-xs border-red-500 text-red-700 mt-1">
                          Overdue {detailData.overdueDays} days
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className={`w-3 h-3 rounded-full ${
                    detailData.status_color === 'green' ? 'bg-green-500' :
                    detailData.status_color === 'amber' ? 'bg-amber-500' :
                    detailData.status_color === 'red' ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                </div>
              </div>
            </Card>

            {/* Timestamps */}
            {(detailData.first_started_at || detailData.first_submitted_at || detailData.first_approved_at) && (
              <Card className="p-4">
                <h3 className="font-medium mb-3">Timeline</h3>
                <div className="space-y-2">
                  {detailData.first_started_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">First Started</span>
                      <span className="text-sm">
                        {format(new Date(detailData.first_started_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                  
                  {detailData.first_submitted_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">First Submitted</span>
                      <span className="text-sm">
                        {format(new Date(detailData.first_submitted_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                  
                  {detailData.first_approved_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">First Approved</span>
                      <span className="text-sm">
                        {format(new Date(detailData.first_approved_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Suggested Actions */}
            {(detailData.status_color === 'red' || detailData.status_color === 'amber') && (
              <SuggestedActionsList
                actions={suggestActions(detailData)}
                title="Suggested Actions"
              />
            )}

            {/* Submission History */}
            <div className="space-y-4">
              <h3 className="font-medium">Submission History</h3>
              
              <ScrollArea className="h-64">
                {detailData.submissionHistory.length === 0 ? (
                  <Card className="p-6 text-center">
                    <div className="text-muted-foreground">
                      No submissions yet for this document type.
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {detailData.submissionHistory.map((submission) => (
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
                              <div>Count: {submission.cnt}</div>
                              
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
              </ScrollArea>
            </div>

            <Separator />

            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">No data available</div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};