import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProcessSnapshotItem } from '@/lib/dashboardHelpers';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SnapshotTableProps {
  items: ProcessSnapshotItem[];
  isLoading: boolean;
  onSelect: (contractorId: string, docTypeId: string) => void;
  onViewAll?: () => void;
  className?: string;
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
    return <span className="text-xs text-muted-foreground">No due date</span>;
  }

  const dueLabel = format(new Date(item.planned_due_date), 'MMM dd');

  if (item.overdueDays > 0) {
    return (
      <div className="flex flex-col gap-1 text-xs">
        <span>{dueLabel}</span>
        <Badge variant="destructive">Overdue {item.overdueDays}d</Badge>
      </div>
    );
  }

  if (item.dueInDays !== null && item.dueInDays <= 3) {
    return (
      <div className="flex flex-col gap-1 text-xs">
        <span>{dueLabel}</span>
        <Badge variant="outline" className="border-amber-300 text-amber-700">
          Due in {item.dueInDays}d
        </Badge>
      </div>
    );
  }

  return <span className="text-xs">{dueLabel}</span>;
};

export const SnapshotTable: React.FC<SnapshotTableProps> = ({ items, isLoading, onSelect, onViewAll, className }) => {
  return (
    <Card className={cn('p-5 flex flex-col', className)}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold">Top Issues</h3>
          <p className="text-sm text-muted-foreground">Most critical documents by severity and timeline</p>
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
        <div className="flex-1 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-52">Document</TableHead>
                <TableHead className="w-40">Contractor</TableHead>
                <TableHead className="w-48">Plan vs actual</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-36">Due</TableHead>
                <TableHead className="text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="py-8 text-center text-muted-foreground text-sm">
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
                        <div className="font-medium line-clamp-1 text-sm">{item.doc_type_name}</div>
                        {item.doc_type_code && (
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            {item.doc_type_code}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{item.contractor_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.first_started_at ? `Started ${format(new Date(item.first_started_at), 'MMM dd')}` : 'Not started'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={progressValue} className="h-2" />
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
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
