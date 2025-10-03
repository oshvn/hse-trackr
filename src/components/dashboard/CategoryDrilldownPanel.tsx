import React, { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { DocProgressData } from '@/lib/dashboardHelpers';
import { format } from 'date-fns';

interface CategoryDrilldownPanelProps {
  open: boolean;
  category: string | null;
  contractorId?: string | null;
  contractorName?: string | null;
  onClose: () => void;
  items: DocProgressData[];
  onSelectDoc: (contractorId: string, docTypeId: string) => void;
}

export const CategoryDrilldownPanel: React.FC<CategoryDrilldownPanelProps> = ({
  open,
  category,
  onClose,
  items,
  onSelectDoc,
}) => {
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (contractorId && item.contractor_id !== contractorId) {
        return false;
      }
      if (category && item.category !== category) {
        return false;
      }
      return true;
    });
  }, [items, contractorId, category]);

  const sortedItems = useMemo(() => {
    const withProgress = filteredItems.map(item => {
      const progressPercent = item.required_count > 0
        ? Math.round((item.approved_count / item.required_count) * 100)
        : 100;
      return {
        ...item,
        progressPercent,
      };
    });

    return withProgress.sort((a, b) => {
      if (a.status_color === b.status_color) {
        const dueA = a.planned_due_date ? new Date(a.planned_due_date).getTime() : Number.MAX_SAFE_INTEGER;
        const dueB = b.planned_due_date ? new Date(b.planned_due_date).getTime() : Number.MAX_SAFE_INTEGER;
        return dueA - dueB;
      }

      const severityRank = { red: 3, amber: 2, green: 1 } as const;
      return (severityRank[b.status_color as keyof typeof severityRank] ?? 0) -
        (severityRank[a.status_color as keyof typeof severityRank] ?? 0);
    });
  }, [filteredItems]);

  return (
    <Sheet open={open} onOpenChange={value => !value && onClose()}>
      <SheetContent className="w-full sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>
            {category ?? 'Category details'}
            {contractorName ? ` · ${contractorName}` : null}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {sortedItems.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No documents match the current filters for this selection.
            </div>
          ) : (
            <ScrollArea className="h-[70vh] pr-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">Document</TableHead>
                    <TableHead className="w-40">Contractor</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-32">Due</TableHead>
                    <TableHead className="w-40">Progress</TableHead>
                    <TableHead className="text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map(item => {
                    const progressValue = item.required_count > 0
                      ? Math.round((item.approved_count / item.required_count) * 100)
                      : 100;

                    const statusMeta = (() => {
                      switch (item.status_color) {
                        case 'red':
                          return { label: 'Critical', className: 'bg-red-100 text-red-700 border-red-200' };
                        case 'amber':
                          return { label: 'At risk', className: 'bg-amber-100 text-amber-700 border-amber-200' };
                        case 'green':
                          return { label: 'On track', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
                        default:
                          return { label: 'Monitoring', className: 'bg-slate-100 text-slate-700 border-slate-200' };
                      }
                    })();

                    return (
                      <TableRow key={`${item.contractor_id}-${item.doc_type_id}`}>
                        <TableCell>
                          <div className="font-medium text-sm">{item.doc_type_name}</div>
                          {item.doc_type_code && (
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">
                              {item.doc_type_code}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{item.contractor_name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusMeta.className}>
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.planned_due_date ? format(new Date(item.planned_due_date), 'MMM dd, yyyy') : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={progressValue} className="h-2" />
                            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                              <span>{item.approved_count} approved</span>
                              <span>{item.required_count} required</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            type="button"
                            className="text-sm text-primary hover:underline"
                            onClick={() => onSelectDoc(item.contractor_id, item.doc_type_id)}
                          >
                            View details
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
