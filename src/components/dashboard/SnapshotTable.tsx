import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProcessSnapshotItem } from '@/lib/dashboardHelpers';
import { format } from 'date-fns';

interface SnapshotTableProps {
  items: ProcessSnapshotItem[];
  isLoading: boolean;
  onSelect: (contractorId: string, docTypeId: string) => void;
  onViewAll?: () => void;
}

const getStatusBadgeMeta = (status: string) => {
  switch (status) {
    case 'red':
      return { label: 'Critical', className: 'bg-red-100 text-red-700 border-red-200' };
    case 'amber':
      return { label: 'At risk', className: 'bg-amber-100 text-amber-700 border-amber-200' };
    case 'green':
      return { label: 'On track', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    default:
      return { label: 'Monitoring', className: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
};

const renderDueMeta = (item: ProcessSnapshotItem) => {
  if (!item.planned_due_date) {
    return <span className="text-sm text-muted-foreground">No due date</span>;
  }

  const dueLabel = format(new Date(item.planned_due_date), 'MMM dd, yyyy');

  if (item.overdueDays > 0) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm">{dueLabel}</span>
        <Badge variant="destructive">Overdue {item.overdueDays}d</Badge>
      </div>
    );
  }

  if (item.dueInDays !== null && item.dueInDays <= 3) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm">{dueLabel}</span>
        <Badge variant="outline" className="border-amber-300 text-amber-700">
          Due in {item.dueInDays}d
        </Badge>
      </div>
    );
  }

  return <span className="text-sm">{dueLabel}</span>;
};

export const SnapshotTable: React.FC<SnapshotTableProps> = ({ items, isLoading, onSelect, onViewAll }) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Top Issues</h3>
          <p className="text-sm text-muted-foreground">Most critical documents based on severity and due dates</p>
        </div>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-primary">
            View full table
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-64">Document</TableHead>
                <TableHead className="w-44">Contractor</TableHead>
                <TableHead className="w-60">Plan vs actual</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-48">Due date</TableHead>
                <TableHead className="text-right w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="py-10 text-center text-muted-foreground text-sm">
                      No issues match the current filters
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map(item => {
                  const statusMeta = getStatusBadgeMeta(item.status_color);
                  const progressValue = Math.min(Math.max(item.progressPercent, 0), 100);
                  return (
                    <TableRow key={`${item.contractor_id}-${item.doc_type_id}`}>
                      <TableCell>
                        <div className="font-medium line-clamp-1">{item.doc_type_name}</div>
                        {item.doc_type_code && (
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            {item.doc_type_code}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.contractor_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.first_started_at ? `Started ${format(new Date(item.first_started_at), 'MMM dd')}` : 'Not started'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Progress value={progressValue} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Actual: {item.approved_count}</span>
                            <span>Planned: {item.required_count}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusMeta.className}>
                          {statusMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{renderDueMeta(item)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary"
                          onClick={() => onSelect(item.contractor_id, item.doc_type_id)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};
