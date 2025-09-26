import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { suggestActions } from "@/lib/suggestedActions";

interface DocProgressRow {
  contractor_id: string;
  contractor_name: string;
  doc_type_id: string;
  doc_type_name: string;
  category: string;
  is_critical: boolean;
  required_count: number;
  planned_due_date: string | null;
  approved_count: number;
  status_color: string;
}

interface DocumentHeatmapProps {
  data: DocProgressRow[];
  contractors: Array<{ id: string; name: string }>;
  selectedContractor: string;
}

export function DocumentHeatmap({ data, contractors, selectedContractor }: DocumentHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<DocProgressRow | null>(null);

  // Filter data based on selected contractor
  const filteredData = selectedContractor === "all" 
    ? data 
    : data.filter(row => row.contractor_id === selectedContractor);

  // Get unique document types
  const docTypes = Array.from(new Set(filteredData.map(row => row.doc_type_name)))
    .sort();

  // Get contractors to show
  const contractorsToShow = selectedContractor === "all" 
    ? contractors 
    : contractors.filter(c => c.id === selectedContractor);

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-800 border-green-200';
      case 'amber': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCellData = (docType: string, contractorId: string) => {
    return filteredData.find(row => 
      row.doc_type_name === docType && row.contractor_id === contractorId
    );
  };

  const actions = selectedCell ? suggestActions(selectedCell) : [];

  return (
    <>
      <Card className="h-[360px]">
        <CardHeader>
          <CardTitle>Document Completion Matrix</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto h-[280px]">
          <div className="min-w-max">
            <div className="grid gap-1" style={{ gridTemplateColumns: `200px repeat(${contractorsToShow.length}, 120px)` }}>
              {/* Header row */}
              <div className="font-medium text-sm p-2"></div>
              {contractorsToShow.map(contractor => (
                <div key={contractor.id} className="font-medium text-sm p-2 text-center">
                  {contractor.name}
                </div>
              ))}
              
              {/* Data rows */}
              {docTypes.map(docType => (
                <div key={docType} className="contents">
                  <div className="font-medium text-sm p-2 border-r">
                    {docType}
                  </div>
                  {contractorsToShow.map(contractor => {
                    const cellData = getCellData(docType, contractor.id);
                    if (!cellData) {
                      return <div key={contractor.id} className="p-2 border text-center text-gray-400">-</div>;
                    }
                    
                    return (
                      <div 
                        key={contractor.id} 
                        className={`p-2 border text-center text-xs cursor-pointer hover:opacity-80 ${getStatusColor(cellData.status_color)}`}
                        onClick={() => setSelectedCell(cellData)}
                      >
                        {cellData.approved_count}/{cellData.required_count}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedCell?.doc_type_name}</SheetTitle>
            <SheetDescription>
              {selectedCell?.contractor_name} - {selectedCell?.category}
            </SheetDescription>
          </SheetHeader>
          
          {selectedCell && (
            <div className="mt-6 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Status</h4>
                <Badge variant={selectedCell.status_color === 'green' ? 'default' : 'destructive'}>
                  {selectedCell.approved_count}/{selectedCell.required_count} Completed
                </Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2">Due Date</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedCell.planned_due_date 
                    ? new Date(selectedCell.planned_due_date).toLocaleDateString('vi-VN')
                    : "No due date set"
                  }
                </p>
              </div>

              {selectedCell.is_critical && (
                <div>
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    Critical Document
                  </Badge>
                </div>
              )}

              {actions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Suggested Actions</h4>
                  <ul className="space-y-2 text-sm">
                    {actions.map((action, index) => (
                      <li key={index} className="text-muted-foreground">
                        • {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}