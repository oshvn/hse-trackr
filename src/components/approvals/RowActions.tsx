import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, RotateCcw, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RowActionsProps {
  submissionId: string;
  onApprove: (note?: string) => Promise<void>;
  onReject: (note: string) => Promise<void>;
  onRequestRevision: (note: string) => Promise<void>;
  disabled: boolean;
}

export const RowActions: React.FC<RowActionsProps> = ({
  submissionId,
  onApprove,
  onReject,
  onRequestRevision,
  disabled
}) => {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    try {
      setLoading(true);
      await onApprove(note || undefined);
      setShowApproveDialog(false);
      setNote('');
    } catch (error) {
      console.error('Error approving:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!note.trim()) {
      toast({
        title: "Note required",
        description: "Please provide a reason for rejection",
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
      console.error('Error rejecting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!note.trim()) {
      toast({
        title: "Note required",
        description: "Please provide revision instructions",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await onRequestRevision(note);
      setShowRevisionDialog(false);
      setNote('');
    } catch (error) {
      console.error('Error requesting revision:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={disabled}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setNote('');
              setShowApproveDialog(true);
            }}
            className="text-green-600"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setNote('');
              setShowRevisionDialog(true);
            }}
            className="text-blue-600"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Request Revision
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setNote('');
              setShowRejectDialog(true);
            }}
            className="text-red-600"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this submission? You can optionally add a note.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="approve-note">Note (optional)</Label>
            <Textarea
              id="approve-note"
              placeholder="Add any comments about the approval..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Submission</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>This will reject the submission. Please provide a reason for rejection.</p>
                <div className="space-y-2">
                  <Label htmlFor="reject-note">Reason for rejection *</Label>
                  <Textarea
                    id="reject-note"
                    placeholder="Explain why this submission is being rejected..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNote('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!note.trim() || loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Rejecting...' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revision Dialog */}
      <AlertDialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Revision</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>This will request changes to the submission. Please provide clear revision instructions.</p>
                <div className="space-y-2">
                  <Label htmlFor="revision-note">Revision instructions *</Label>
                  <Textarea
                    id="revision-note"
                    placeholder="Describe what changes are needed..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNote('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestRevision}
              disabled={!note.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Requesting...' : 'Request Revision'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};