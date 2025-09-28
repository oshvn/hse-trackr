import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DocProgressData, FilterState } from '@/lib/dashboardHelpers';
import { getStatusColorClass } from '@/lib/dashboardHelpers';

interface HeatmapProps {
  data: DocProgressData[];
  contractors: Array<{ id: string; name: string }>;
  docTypes: Array<{ id: string; name: string; category: string }>;
  filters: FilterState;
  onCellClick: (contractorId: string, docTypeId: string) => void;
}

interface HeatmapCell {
  contractorId: string;
  docTypeId: string;
  approved: number;
  required: number;
  statusColor: string;
  percentage: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  contractors,
  docTypes,
  filters,
  onCellClick
}) => {
  const { heatmapData, filteredContractors, filteredDocTypes } = useMemo(() => {
    // Filter contractors
    const filteredContractors = filters.contractor === 'all' 
      ? contractors 
      : contractors.filter(c => c.id === filters.contractor);

    // Filter doc types by category
    const filteredDocTypes = filters.category === 'all'
      ? docTypes
      : docTypes.filter(dt => dt.category === filters.category);

    // Create heatmap data matrix
    const cellMap = new Map<string, HeatmapCell>();

    data.forEach(item => {
      const key = `${item.contractor_id}-${item.doc_type_id}`;
      const percentage = item.required_count > 0 
        ? Math.round((item.approved_count / item.required_count) * 100)
        : 0;

      cellMap.set(key, {
        contractorId: item.contractor_id,
        docTypeId: item.doc_type_id,
        approved: item.approved_count,
        required: item.required_count,
        statusColor: item.status_color,
        percentage
      });
    });

    return {
      heatmapData: cellMap,
      filteredContractors,
      filteredDocTypes
    };
  }, [data, contractors, docTypes, filters]);

  const getCell = (contractorId: string, docTypeId: string): HeatmapCell | null => {
    return heatmapData.get(`${contractorId}-${docTypeId}`) || null;
  };

  const getCellContent = (cell: HeatmapCell | null) => {
    if (!cell) return { display: '—', color: 'bg-gray-50' };
    return {
      display: `${cell.approved}/${cell.required}`,
      color: getStatusColorClass(cell.statusColor)
    };
  };

  if (filteredDocTypes.length === 0) {
    return (
      <Card className="p-6 h-80">
        <h3 className="text-lg font-semibold mb-4">Completion by Document Type</h3>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No document types found for the selected category
        </div>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="p-4 h-80">
        <h3 className="text-lg font-semibold mb-4">Completion by Document Type</h3>
        
        <div className="relative h-64">
          <div className="absolute inset-0">
            <div className="flex h-full">
              {/* Sticky first column - Doc Types */}
              <div className="flex-shrink-0 w-48 border-r bg-background">
                {/* Header */}
                <div className="h-10 border-b bg-muted flex items-center px-3 text-sm font-medium">
                  Document Type
                </div>
                
                {/* Doc Type rows */}
                <ScrollArea className="h-52">
                  {filteredDocTypes.map(docType => (
                    <div
                      key={docType.id}
                      className="h-10 border-b flex items-center px-3 text-sm truncate bg-background"
                      title={docType.name}
                    >
                      {docType.name}
                    </div>
                  ))}
                </ScrollArea>
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full w-full">
                  <div className="min-w-max">
                    {/* Header row */}
                    <div className="h-10 border-b bg-muted flex">
                      {filteredContractors.map(contractor => (
                        <div
                          key={contractor.id}
                          className="w-24 border-r flex items-center justify-center px-2 text-sm font-medium truncate"
                          title={contractor.name}
                        >
                          {contractor.name}
                        </div>
                      ))}
                    </div>

                    {/* Data rows */}
                    {filteredDocTypes.map(docType => (
                      <div key={docType.id} className="h-10 border-b flex">
                        {filteredContractors.map(contractor => {
                          const cell = getCell(contractor.id, docType.id);
                          const { display, color } = getCellContent(cell);
                          
                          return (
                            <Tooltip key={contractor.id}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`w-24 border-r flex items-center justify-center text-xs cursor-pointer hover:opacity-80 transition-opacity ${color}`}
                                  onClick={() => onCellClick(contractor.id, docType.id)}
                                >
                                  {display}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  <div className="font-medium">{contractor.name}</div>
                                  <div className="text-muted-foreground">{docType.name}</div>
                                  {cell && (
                                    <div className="mt-1">
                                      <div>Approved: {cell.approved}</div>
                                      <div>Required: {cell.required}</div>
                                      <div>Progress: {cell.percentage}%</div>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};