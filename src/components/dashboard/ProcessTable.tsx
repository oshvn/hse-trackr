import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, ArrowUpRight, Calendar, TrendingDown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export interface ProcessTableRow {
  contractorId: string;
  contractorName: string;
  docTypeId: string;
  docTypeName: string;
  docTypeCode: string | null;
  isCritical: boolean;
  requiredCount: number;
  approvedCount: number;
  statusColor: string;
  plannedDueDate: string | null;
  overdueDays: number;
  progressPercent: number;
  firstStartedAt: string | null;
  firstSubmittedAt: string | null;
  firstApprovedAt: string | null;
}

interface ProcessTableProps {
  rows: ProcessTableRow[];
  isLoading: boolean;
  criticalOnly: boolean;
  onCriticalOnlyChange: (value: boolean) => void;
  onSelectRow: (contractorId: string, docTypeId: string) => void;
}

type SortKey = 'severity' | 'dueDate' | 'progress';

const SEVERITY_ORDER: Record<string, number> = {
  red: 3,
  amber: 2,
  green: 1,
  default: 0,
};

const getStatusBadge = (statusColor: string) => {
  switch (statusColor) {
    case 'red':
      return {
        label: 'Critical',
        className: 'bg-red-100 text-red-700 border-red-200',
      };
    case 'amber':
      return {
        label: 'At risk',
        className: 'bg-amber-100 text-amber-700 border-amber-200',
      };
    case 'green':
      return {
        label: 'On track',
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      };
    default:
      return {
        label: 'Monitoring',
        className: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
};

const formatDue = (plannedDueDate: string | null, overdueDays: number) => {
  if (!plannedDueDate) {
    return { label: 'No due date', badge: null };
  }

  const formatted = format(new Date(plannedDueDate), 'MMM dd, yyyy');

  if (overdueDays > 0) {
    return {
      label: formatted,
      badge: <Badge variant="destructive">Overdue {overdueDays}d</Badge>,
    };
  }

  const daysLeft = Math.ceil((new Date(plannedDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 3) {
    return {
      label: formatted,
      badge: <Badge variant="outline" className="border-amber-300 text-amber-700">Due in {daysLeft}d</Badge>,
    };
  }

  return { label: formatted, badge: null };
};

export const ProcessTable: React.FC<ProcessTableProps> = ({
  rows,
  isLoading,
  criticalOnly,
  onCriticalOnlyChange,
  onSelectRow,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('severity');

  const filteredRows = useMemo(() => {
    const base = criticalOnly ? rows.filter(row => row.isCritical) : rows;

    return base;
  }, [rows, criticalOnly]);

  const sortedRows = useMemo(() => {
    const entries = [...filteredRows];

    entries.sort((a, b) => {
      switch (sortKey) {
        case 'severity': {
          const rankA = SEVERITY_ORDER[a.statusColor] ?? SEVERITY_ORDER.default;
          const rankB = SEVERITY_ORDER[b.statusColor] ?? SEVERITY_ORDER.default;

          if (rankA !== rankB) return rankB - rankA;
          if (a.overdueDays !== b.overdueDays) return b.overdueDays - a.overdueDays;
          return (a.plannedDueDate ? new Date(a.plannedDueDate).getTime() : Infinity) -
            (b.plannedDueDate ? new Date(b.plannedDueDate).getTime() : Infinity);
        }
        case 'dueDate': {
          const aDue = a.plannedDueDate ? new Date(a.plannedDueDate).getTime() : Infinity;
          const bDue = b.plannedDueDate ? new Date(b.plannedDueDate).getTime() : Infinity;
          if (aDue !== bDue) return aDue - bDue;
          return (SEVERITY_ORDER[b.statusColor] ?? 0) - (SEVERITY_ORDER[a.statusColor] ?? 0);
        }
        case 'progress':
        default: {
          if (a.progressPercent !== b.progressPercent) return a.progressPercent - b.progressPercent;
          return (SEVERITY_ORDER[b.statusColor] ?? 0) - (SEVERITY_ORDER[a.statusColor] ?? 0);
        }
      }
    });

    return entries;
  }, [filteredRows, sortKey]);

  const renderBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={6}>
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-12 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (sortedRows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6}>
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
              <AlertTriangle className="h-8 w-8" />
              <div>
                <p className="font-medium">No records match the current filters</p>
                <p className="text-sm">Try adjusting the filters or turn off critical-only view.</p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return sortedRows.map(row => {
      const statusBadge = getStatusBadge(row.statusColor);
      const dueMeta = formatDue(row.plannedDueDate, row.overdueDays);
      const progressValue = Math.min(100, Math.max(0, row.progressPercent));
      const delta = row.approvedCount - row.requiredCount;
      const deltaLabel = delta === 0 ? 'On plan' : delta > 0 ? `Ahead by ${Math.abs(delta)}` : `Behind by ${Math.abs(delta)}`;
      const deltaIcon = delta > 0 ? <TrendingUp className="h-3 w-3 text-emerald-600" /> : delta < 0 ? <TrendingDown className="h-3 w-3 text-red-600" /> : null;

      return (
        <TableRow key={`${row.contractorId}-${row.docTypeId}`} className={row.isCritical ? 'bg-red-50/40' : undefined}>
          <TableCell className="align-top">
            <div className="space-y-1">
              <div className="font-semibold flex items-center gap-2">
                {row.docTypeName}
                {row.isCritical && (
                  <Badge variant="destructive" className="uppercase text-xs tracking-widest">
                    Must-have
                  </Badge>
                )}
              </div>
              {row.docTypeCode && (
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Code: {row.docTypeCode}
                </div>
              )}
            </div>
          </TableCell>
          <TableCell className="align-top">
            <div className="font-medium">{row.contractorName}</div>
            <div className="text-xs text-muted-foreground">
              {row.firstStartedAt ? `Started ${format(new Date(row.firstStartedAt), 'MMM dd')}` : 'Not started'}
            </div>
          </TableCell>
          <TableCell className="align-top">
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Progress value={progressValue} className="h-2" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{row.approvedCount} approved of {row.requiredCount} planned</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Actual: {row.approvedCount}</span>
                <span>Planned: {row.requiredCount}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium">
                {deltaIcon}
                <span className={delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                  {deltaLabel}
                </span>
              </div>
            </div>
          </TableCell>
          <TableCell className="align-top">
            <Badge variant="outline" className={statusBadge.className}>
              {statusBadge.label}
            </Badge>
          </TableCell>
          <TableCell className="align-top">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{dueMeta.label}</span>
              </div>
              {dueMeta.badge}
            </div>
          </TableCell>
          <TableCell className="align-top text-right">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => onSelectRow(row.contractorId, row.docTypeId)}
            >
              View details
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Process Overview</h2>
          <p className="text-sm text-muted-foreground">
            Combined view of all document requirements with plan vs actual progress
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="critical-only" className="text-sm">Critical only</Label>
            <Switch id="critical-only" checked={criticalOnly} onCheckedChange={onCriticalOnlyChange} />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="sort-by" className="text-sm">Sort by</Label>
            <Select value={sortKey} onValueChange={value => setSortKey(value as SortKey)}>
              <SelectTrigger id="sort-by" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="severity">Severity</SelectItem>
                <SelectItem value="dueDate">Due date</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-64">Document</TableHead>
              <TableHead className="w-44">Contractor</TableHead>
              <TableHead className="w-72">Plan vs Actual</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-48">Due date</TableHead>
              <TableHead className="text-right w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderBody()}</TableBody>
        </Table>
      </div>
    </Card>
  );
};
