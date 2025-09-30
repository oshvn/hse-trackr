import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { DocProgressData } from '@/lib/dashboardHelpers';

interface CriticalDocsSectionProps {
  items: Array<DocProgressData & { overdueDays: number }>;
  onDocClick: (contractorId: string, docTypeId: string) => void;
}

export const CriticalDocsSection: React.FC<CriticalDocsSectionProps> = ({ items, onDocClick }) => {
  if (items.length === 0) {
    return (
      <Card className="p-6 h-80">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold">Critical Docs (Must-have)</h3>
        </div>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
            <p className="font-medium">No overdue must-have items.</p>
            <p className="text-sm">All critical documents are on track.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 h-80">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <h3 className="text-lg font-semibold">Critical Docs (Must-have)</h3>
        <Badge variant="destructive" className="ml-auto">
          {items.length}
        </Badge>
      </div>

      <ScrollArea className="h-64">
        <div className="space-y-3">
          {items.map(item => (
            <button
              type="button"
              key={`${item.contractor_id}-${item.doc_type_id}`}
              className="w-full text-left p-3 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              onClick={() => onDocClick(item.contractor_id, item.doc_type_id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="text-sm font-semibold truncate text-red-800">
                    {item.doc_type_name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    Contractor: {item.contractor_name}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="destructive" className="text-xs">
                      Must-have
                    </Badge>
                    {item.overdueDays > 0 && (
                      <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
                        <Clock className="h-3 w-3 mr-1" /> Overdue {item.overdueDays} day{item.overdueDays !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {item.approved_count}/{item.required_count} approved
                    </Badge>
                  </div>
                </div>
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500" />
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
