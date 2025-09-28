import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import type { ContractorRequirement, DocProgress, Submission } from '@/pages/ContractorSubmissions';

interface CategoryTableProps {
  requirements: ContractorRequirement[];
  docProgress: DocProgress[];
  submissions: Submission[];
  onRowClick: (docTypeId: string) => void;
  onNewSubmission: () => void;
  showCriticalFirst: boolean;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  requirements,
  docProgress,
  submissions,
  onRowClick,
  onNewSubmission,
  showCriticalFirst
}) => {
  const tableData = useMemo(() => {
    const combined = requirements.map(req => {
      const progress = docProgress.find(prog => prog.doc_type_id === req.doc_type_id);
      const latestSubmission = submissions
        .filter(sub => sub.doc_type_id === req.doc_type_id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      const today = new Date();
      const dueDate = req.planned_due_date ? new Date(req.planned_due_date) : null;
      const isOverdue = dueDate && today > dueDate && (progress?.approved_count || 0) < req.required_count;
      const overdueDays = isOverdue ? differenceInDays(today, dueDate) : 0;

      return {
        docTypeId: req.doc_type_id,
        docName: req.doc_type.name,
        category: req.doc_type.category,
        isCritical: req.doc_type.is_critical,
        requiredCount: req.required_count,
        approvedCount: progress?.approved_count || 0,
        statusColor: progress?.status_color || 'gray',
        dueDate: req.planned_due_date,
        submissionStatus: latestSubmission?.status || 'not_started',
        isOverdue,
        overdueDays,
        hasSubmissions: submissions.some(sub => sub.doc_type_id === req.doc_type_id)
      };
    });

    // Sort: Critical first, then nearest due date, then others
    if (showCriticalFirst) {
      return combined.sort((a, b) => {
        // Critical items first
        if (a.isCritical && !b.isCritical) return -1;
        if (!a.isCritical && b.isCritical) return 1;
        
        // Then by due date (nearest first, null dates last)
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        
        // Finally by name
        return a.docName.localeCompare(b.docName);
      });
    }

    return combined;
  }, [requirements, docProgress, submissions, showCriticalFirst]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      prepared: { label: 'Prepared', variant: 'outline' as const },
      submitted: { label: 'Submitted', variant: 'secondary' as const },
      approved: { label: 'Approved', variant: 'default' as const },
      rejected: { label: 'Rejected', variant: 'destructive' as const },
      not_started: { label: 'Not Started', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusColorIndicator = (color: string) => {
    const colorMap = {
      green: 'bg-green-500',
      amber: 'bg-amber-500',
      red: 'bg-red-500',
      gray: 'bg-gray-400'
    };

    return (
      <div className={`w-3 h-3 rounded-full ${colorMap[color as keyof typeof colorMap] || colorMap.gray}`} />
    );
  };

  if (tableData.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">No Requirements Found</h3>
            <p className="text-muted-foreground">
              No document requirements have been assigned for this category.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Document Requirements</h3>
        <Button onClick={onNewSubmission} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Submission
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Name</TableHead>
            <TableHead>Required/Approved</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Submission State</TableHead>
            <TableHead>Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.map((row) => (
            <TableRow 
              key={row.docTypeId}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onRowClick(row.docTypeId)}
            >
              <TableCell className="font-medium">
                {row.docName}
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusColorIndicator(row.statusColor)}
                  <span>{row.approvedCount}/{row.requiredCount}</span>
                </div>
              </TableCell>
              
              <TableCell>
                {getStatusBadge(row.submissionStatus)}
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  {row.dueDate ? (
                    <div className="text-sm">
                      {format(new Date(row.dueDate), 'MMM dd, yyyy')}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No due date</span>
                  )}
                  
                  {row.isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      Overdue ({row.overdueDays} days)
                    </Badge>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                {getStatusBadge(row.submissionStatus)}
              </TableCell>
              
              <TableCell>
                {row.isCritical && (
                  <Badge variant="destructive" className="text-xs">
                    🔴 Must-have
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};