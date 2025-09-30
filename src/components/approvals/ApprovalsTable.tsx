import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { RowActions } from './RowActions';
import { Clock, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import type { ApprovalSubmission } from '@/pages/admin/approvals';

interface ApprovalsTableProps {
  submissions: ApprovalSubmission[];
  loading: boolean;
  selectedRows: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onRowClick: (submissionId: string) => void;
  onApprove: (submissionId: string, note?: string) => Promise<void>;
  onReject: (submissionId: string, note: string) => Promise<void>;
  onRequestRevision: (submissionId: string, note: string) => Promise<void>;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const ApprovalsTable: React.FC<ApprovalsTableProps> = ({
  submissions,
  loading,
  selectedRows,
  onSelectionChange,
  onRowClick,
  onApprove,
  onReject,
  onRequestRevision,
  currentPage,
  totalPages,
  onPageChange
}) => {
  const [actioningRows, setActioningRows] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(submissions.map(s => s.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectRow = (submissionId: string, checked: boolean) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(submissionId);
    } else {
      newSelection.delete(submissionId);
    }
    onSelectionChange(newSelection);
  };

  const handleAction = async (
    submissionId: string, 
    action: 'approve' | 'reject' | 'revision',
    note?: string
  ) => {
    setActioningRows(prev => new Set(prev).add(submissionId));
    
    try {
      switch (action) {
        case 'approve':
          await onApprove(submissionId, note);
          break;
        case 'reject':
          await onReject(submissionId, note || '');
          break;
        case 'revision':
          await onRequestRevision(submissionId, note || '');
          break;
      }
    } finally {
      setActioningRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'revision':
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusTooltip = (submission: ApprovalSubmission) => {
    switch (submission.status) {
      case 'submitted':
        return `Submitted on ${format(new Date(submission.submitted_at!), 'PPP')}, awaiting review`;
      case 'revision':
        return 'Revision requested - awaiting contractor response';
      default:
        return submission.status;
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center">Loading submissions...</div>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">All caught up!</h3>
            <p className="text-muted-foreground">
              No submissions pending approval at the moment.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const allSelected = submissions.length > 0 && submissions.every(s => selectedRows.has(s.id));
  const someSelected = selectedRows.size > 0 && !allSelected;

  return (
    <TooltipProvider>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  {...(someSelected && { 'data-indeterminate': true })}
                />
              </TableHead>
              <TableHead>Contractor</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow 
                key={submission.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick(submission.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedRows.has(submission.id)}
                    onCheckedChange={(checked) => 
                      handleSelectRow(submission.id, checked === true)
                    }
                    aria-label={`Select submission from ${submission.contractor_name}`}
                  />
                </TableCell>
                
                <TableCell className="font-medium">
                  {submission.contractor_name}
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{submission.doc_type_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {submission.doc_type_category}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(submission.status)}
                        <Badge variant={submission.status === 'submitted' ? 'secondary' : 'outline'}>
                          {submission.status === 'submitted' ? 'Submitted' : 'Revision'}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {getStatusTooltip(submission)}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                
                <TableCell>
                  {submission.submitted_at ? (
                    <div className="text-sm">
                      {format(new Date(submission.submitted_at), 'MMM dd, yyyy')}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(submission.submitted_at), 'HH:mm')}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {submission.is_critical && (
                      <Badge variant="destructive" className="text-xs w-fit">
                        🔴 Must-have
                      </Badge>
                    )}
                    {submission.overdue_days && (
                      <Badge variant="outline" className="text-xs w-fit border-amber-500 text-amber-700">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {submission.overdue_days} days
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActions
                    submissionId={submission.id}
                    onApprove={(note) => handleAction(submission.id, 'approve', note)}
                    onReject={(note) => handleAction(submission.id, 'reject', note)}
                    onRequestRevision={(note) => handleAction(submission.id, 'revision', note)}
                    disabled={actioningRows.has(submission.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="border-t p-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => onPageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
};