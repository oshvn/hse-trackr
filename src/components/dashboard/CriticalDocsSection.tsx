import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { DocProgressData } from '@/lib/dashboardHelpers';

interface CriticalDocsSectionProps {
  redItems: Array<DocProgressData & { overdueDays: number }>;
  amberItems: Array<DocProgressData & { dueInDays: number }>;
  onDocClick: (contractorId: string, docTypeId: string) => void;
}

export const CriticalDocsSection: React.FC<CriticalDocsSectionProps> = ({
  redItems,
  amberItems,
  onDocClick,
}) => {
  const totalAlerts = redItems.length + amberItems.length;

  if (totalAlerts === 0) {
    return (
      <Card className="p-6 h-80">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-semibold">Critical Alerts</h3>
          <Badge variant="outline" className="ml-auto text-emerald-600 border-emerald-200">
            Clear
          </Badge>
        </div>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center space-y-2">
            <p className="font-medium text-emerald-600">All critical documents are on track.</p>
            <p className="text-sm">No overdue or at-risk must-have documents detected.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 h-80">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <h3 className="text-lg font-semibold">Critical Alerts</h3>
        <Badge variant="destructive" className="ml-auto">
          {totalAlerts}
        </Badge>
      </div>

      <ScrollArea className="h-64 pr-2">
        <div className="space-y-3">
          {redItems.map(item => (
            <button
              type="button"
              key={`red-${item.contractor_id}-${item.doc_type_id}`}
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
                    <Badge variant="outline" className="text-xs border-red-500 text-red-700">
                      Overdue {item.overdueDays} day{item.overdueDays !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {item.approved_count}/{item.required_count} approved
                    </Badge>
                  </div>
                </div>
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500" />
              </div>
            </button>
          ))}

          {amberItems.map(item => (
            <button
              type="button"
              key={`amber-${item.contractor_id}-${item.doc_type_id}`}
              className="w-full text-left p-3 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
              onClick={() => onDocClick(item.contractor_id, item.doc_type_id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="text-sm font-semibold truncate text-amber-800">
                    {item.doc_type_name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    Contractor: {item.contractor_name}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">
                      {item.dueInDays === 0 ? 'Due today' : `Due in ${item.dueInDays} day${item.dueInDays !== 1 ? 's' : ''}`}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {item.approved_count}/{item.required_count} approved
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-700">
                  <Clock className="h-3 w-3" />
                  At risk
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
