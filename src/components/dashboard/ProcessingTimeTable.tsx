import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ContractorProcessingTimeStats } from '@/lib/dashboardHelpers';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessingTimeTableProps {
  data: ContractorProcessingTimeStats[];
  className?: string;
}

type SortKey = keyof Pick<ContractorProcessingTimeStats,
  'contractorName' | 'averagePrepDays' | 'longestPrepDays' | 'averageApprovalDays' | 'longestApprovalDays'>;

type SortState = {
  key: SortKey;
  direction: 'asc' | 'desc';
};

const columns: { key: SortKey; label: string }[] = [
  { key: 'contractorName', label: 'Contractor' },
  { key: 'averagePrepDays', label: 'Avg Prep (days)' },
  { key: 'longestPrepDays', label: 'Max Prep (days)' },
  { key: 'averageApprovalDays', label: 'Avg Approval (days)' },
  { key: 'longestApprovalDays', label: 'Max Approval (days)' },
];

const formatValue = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) {
    return '-';
  }
  return `${value}`;
};

const getSortableNumber = (value: number | null, direction: 'asc' | 'desc'): number => {
  if (value === null || Number.isNaN(value)) {
    return direction === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  }
  return value;
};

export const ProcessingTimeTable: React.FC<ProcessingTimeTableProps> = ({ data, className }) => {
  const [sort, setSort] = useState<SortState>({ key: 'averageApprovalDays', direction: 'desc' });

  const sortedData = useMemo(() => {
    const rows = [...data];
    rows.sort((a, b) => {
      if (sort.key === 'contractorName') {
        const compare = a.contractorName.localeCompare(b.contractorName);
        return sort.direction === 'asc' ? compare : -compare;
      }

      const aValue = getSortableNumber(a[sort.key], sort.direction);
      const bValue = getSortableNumber(b[sort.key], sort.direction);
      return sort.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
    return rows;
  }, [data, sort]);

  const toggleSort = (key: SortKey) => {
    setSort(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: key === 'contractorName' ? 'asc' : 'desc' };
    });
  };

  return (
    <Card className={cn('p-5 space-y-4', className)}>
      <div>
        <h3 className="text-lg font-semibold">Processing Time Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Compare preparation and approval durations across contractors
        </p>
      </div>

      {sortedData.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No processing time data available for the current filters.
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(column => (
                  <TableHead key={column.key} className={column.key === 'contractorName' ? 'w-56' : 'w-40'}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs font-medium"
                      onClick={() => toggleSort(column.key)}
                    >
                      {column.label}
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map(row => (
                <TableRow key={row.contractorId}>
                  <TableCell className="font-medium">{row.contractorName}</TableCell>
                  <TableCell>{formatValue(row.averagePrepDays)}</TableCell>
                  <TableCell>{formatValue(row.longestPrepDays)}</TableCell>
                  <TableCell>{formatValue(row.averageApprovalDays)}</TableCell>
                  <TableCell>{formatValue(row.longestApprovalDays)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};
