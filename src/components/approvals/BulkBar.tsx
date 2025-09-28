import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkBarProps {
  selectedCount: number;
  onApprove: (note?: string) => Promise<void>;
  onReject: (note: string) => Promise<void>;
  onClear: () => void;
}

export const BulkBar: React.FC<BulkBarProps> = ({
  selectedCount,
  onApprove,
  onReject,
  onClear
}) => {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleBulkApprove = async () => {
    try {
      setLoading(true);
      await onApprove(note || undefined);
      setShowApproveDialog(false);
      setNote('');
    } catch (error) {
      console.error('Error bulk approving:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (!note.trim()) {
      toast({
        title: "Note required",
        description: "Please provide a reason for bulk rejection",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await onReject(note);
      setShowRejectDialog(false);
      setNote('');
    } catch (error) {
      console.error('Error bulk rejecting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-medium">
              {selectedCount} submission{selectedCount !== 1 ? 's' : ''} selected
            </span>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setShowApproveDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Bulk Approve
              </Button>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Bulk Reject
              </Button>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Bulk Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Approve Submissions</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {selectedCount} submission{selectedCount !== 1 ? 's' : ''}? 
              You can optionally add a note that will be applied to all submissions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="bulk-approve-note">Note (optional)</Label>
            <Textarea
              id="bulk-approve-note"
              placeholder="Add any comments about the bulk approval..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkApprove} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Approving...' : `Approve ${selectedCount} Submission${selectedCount !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Reject Submissions</DialogTitle>
            <DialogDescription>
              This will reject {selectedCount} submission{selectedCount !== 1 ? 's' : ''}. 
              Please provide a reason for the bulk rejection.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="bulk-reject-note">Reason for rejection *</Label>
            <Textarea
              id="bulk-reject-note"
              placeholder="Explain why these submissions are being rejected..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkReject} 
              disabled={!note.trim() || loading}
              variant="destructive"
            >
              {loading ? 'Rejecting...' : `Reject ${selectedCount} Submission${selectedCount !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};