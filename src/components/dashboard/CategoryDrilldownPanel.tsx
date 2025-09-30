import React, { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Hourglass, XCircle } from 'lucide-react';
import type { DocProgressData } from '@/lib/dashboardHelpers';

interface CategoryDrilldownPanelProps {
  open: boolean;
  onClose: () => void;
  category: string | null;
  contractors: Array<{ id: string; name: string }>;
  docTypes: Array<{ id: string; name: string; code?: string | null; primaryCategory: string }>;
  progressData: DocProgressData[];
  focusedContractorId?: string | null;
  onSelectDoc: (contractorId: string, docTypeId: string) => void;
}

const getStatusBadge = (approved: number, required: number) => {
  if (required === 0) {
    return <Badge variant="secondary">N/A</Badge>;
  }

  if (approved >= required) {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" /> Completed
      </Badge>
    );
  }

  if (approved > 0) {
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 flex items-center gap-1">
        <Hourglass className="h-3 w-3" /> Pending
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 flex items-center gap-1">
      <XCircle className="h-3 w-3" /> Missing
    </Badge>
  );
};

export const CategoryDrilldownPanel: React.FC<CategoryDrilldownPanelProps> = ({
  open,
  onClose,
  category,
  contractors,
  docTypes,
  progressData,
  focusedContractorId,
  onSelectDoc
}) => {
  const filteredContractors = useMemo(() => {
    if (focusedContractorId) {
      return contractors.filter(contractor => contractor.id === focusedContractorId);
    }
    return contractors;
  }, [contractors, focusedContractorId]);

  const docTypesForCategory = useMemo(() => {
    if (!category) return [];
    return docTypes.filter(docType => docType.primaryCategory === category);
  }, [docTypes, category]);

  const progressMap = useMemo(() => {
    const map = new Map<string, DocProgressData>();
    progressData.forEach(item => {
      map.set(`${item.doc_type_id}__${item.contractor_id}`, item);
    });
    return map;
  }, [progressData]);

  if (!category) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{category}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {docTypesForCategory.length === 0 ? (
            <div className="text-muted-foreground text-sm">No document types configured for this category.</div>
          ) : (
            <ScrollArea className="max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-64">Document</TableHead>
                    {filteredContractors.map(contractor => (
                      <TableHead key={contractor.id} className="text-center">
                        {contractor.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docTypesForCategory.map(docType => (
                    <TableRow key={docType.id}>
                      <TableCell>
                        <div className="font-medium">{docType.name}</div>
                        {docType.code && (
                          <div className="text-xs text-muted-foreground">Code: {docType.code}</div>
                        )}
                      </TableCell>
                      {filteredContractors.map(contractor => {
                        const progress = progressMap.get(`${docType.id}__${contractor.id}`);
                        const approved = progress?.approved_count ?? 0;
                        const required = progress?.required_count ?? 0;
                        const completion = required > 0 ? Math.round((approved / required) * 100) : 0;
                        const statusBadge = getStatusBadge(approved, required);

                        return (
                          <TableCell key={contractor.id}>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{approved}/{required}</span>
                                <span className="text-xs text-muted-foreground">{completion}%</span>
                              </div>
                              <div>{statusBadge}</div>
                              <button
                                type="button"
                                className="text-xs text-primary hover:underline text-left disabled:text-muted-foreground"
                                onClick={() => progress && onSelectDoc(contractor.id, docType.id)}
                                disabled={!progress || required === 0}
                              >
                                View details
                              </button>
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
