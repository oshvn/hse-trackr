import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Hourglass } from 'lucide-react';

export interface CompletionMatrixCell {
  category: string;
  contractorId: string;
  contractorName: string;
  approved: number;
  required: number;
  completion: number;
}

interface CompletionMatrixProps {
  categories: string[];
  contractors: Array<{ id: string; name: string }>;
  cells: CompletionMatrixCell[];
  onCellClick: (category: string, contractorId: string) => void;
}

const getCellMeta = (approved: number, required: number) => {
  if (required === 0) {
    return {
      label: 'N/A',
      icon: null,
      className: 'bg-muted text-muted-foreground border border-muted',
    };
  }

  if (approved >= required && required > 0) {
    return {
      label: 'Completed',
      icon: <CheckCircle2 className="h-4 w-4" />,
      className: 'bg-green-100 text-green-700 border border-green-200',
    };
  }

  if (approved > 0 && approved < required) {
    return {
      label: 'Pending',
      icon: <Hourglass className="h-4 w-4" />,
      className: 'bg-amber-100 text-amber-700 border border-amber-200',
    };
  }

  return {
    label: 'Missing',
    icon: <XCircle className="h-4 w-4" />,
    className: 'bg-red-100 text-red-700 border border-red-200',
  };
};

export const CompletionMatrix: React.FC<CompletionMatrixProps> = ({ categories, contractors, cells, onCellClick }) => {
  const cellKey = (category: string, contractorId: string) => `${category}__${contractorId}`;
  const cellMap = new Map<string, CompletionMatrixCell>();
  cells.forEach(cell => {
    cellMap.set(cellKey(cell.category, cell.contractorId), cell);
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Completion Matrix</h2>
        <span className="text-sm text-muted-foreground">Categories vs Contractors</span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">Category</TableHead>
              {contractors.map(contractor => (
                <TableHead key={contractor.id} className="text-center">
                  {contractor.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(category => (
              <TableRow key={category}>
                <TableCell className="font-medium">{category}</TableCell>
                {contractors.map(contractor => {
                  const cell = cellMap.get(cellKey(category, contractor.id)) ?? {
                    category,
                    contractorId: contractor.id,
                    contractorName: contractor.name,
                    approved: 0,
                    required: 0,
                    completion: 0,
                  };

                  const meta = getCellMeta(cell.approved, cell.required);
                  const completionPercent = cell.required > 0 ? Math.round((cell.approved / cell.required) * 100) : 0;

                  return (
                    <TableCell key={contractor.id} className="align-middle">
                      <button
                        type="button"
                        className={`w-full p-3 rounded-lg transition-colors ${meta.className} ${cell.required === 0 ? 'cursor-not-allowed opacity-70' : 'hover:opacity-90 cursor-pointer'}`}
                        onClick={() => cell.required > 0 && onCellClick(category, contractor.id)}
                        disabled={cell.required === 0}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {meta.icon}
                            <span className="text-sm font-medium">{meta.label}</span>
                          </div>
                          <Badge variant="outline" className="bg-white/70 text-muted-foreground">
                            {completionPercent}%
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {cell.approved}/{cell.required} approved
                        </div>
                      </button>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
