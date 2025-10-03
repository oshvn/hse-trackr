import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import type { CriticalAlertItem } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';

interface CriticalAlertsCardProps {
  redItems: CriticalAlertItem[];
  amberItems: CriticalAlertItem[];
  onSelect: (contractorId: string, docTypeId: string) => void;
  onViewAll?: () => void;
  className?: string;
  maxItems?: number;
}

export const CriticalAlertsCard: React.FC<CriticalAlertsCardProps> = ({
  redItems,
  amberItems,
  onSelect,
  onViewAll,
  className,
  maxItems = 4,
}) => {
  const totalAlerts = redItems.length + amberItems.length;

  if (totalAlerts === 0) {
    return (
      <Card className={cn('p-5 flex flex-col justify-between', className)}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-semibold">Critical Alerts</h3>
          <Badge variant="outline" className="ml-auto text-emerald-600 border-emerald-200">
            Clear
          </Badge>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-2">
            <p className="font-medium text-emerald-600">All must-have documents are on track.</p>
            <p className="text-sm">No overdue or at-risk items right now.</p>
          </div>
        </div>
      </Card>
    );
  }

  const redVisible = redItems.slice(0, maxItems);
  const remainingSlots = Math.max(0, maxItems - redVisible.length);
  const amberVisible = amberItems.slice(0, remainingSlots);

  return (
    <Card className={cn('p-4 flex flex-col', className)}>
      <div className="rounded-md border border-red-500 bg-red-600/10 px-3 py-1.5 text-xs font-semibold text-red-600 mb-3">
        ⚠️ {totalAlerts} Red Card cần xử lý!
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <h3 className="text-base font-bold">Critical Alerts</h3>
        <Badge variant="destructive" className="ml-auto text-xs">
          {totalAlerts}
        </Badge>
      </div>

      <ScrollArea className="flex-1 max-h-[240px] pr-1">
        <div className="space-y-2">
          {redVisible.map(item => (
            <button
              key={`red-${item.contractorId}-${item.docTypeId}`}
              type="button"
              className="w-full text-left p-2.5 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              onClick={() => onSelect(item.contractorId, item.docTypeId)}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="text-xs font-semibold truncate text-red-800">
                      {item.docTypeName}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      Contractor: {item.contractorName}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="destructive" className="text-[10px] uppercase tracking-wide">
                    Must-have
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-red-500 text-red-700">
                    Overdue {item.overdueDays} day{item.overdueDays !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    {item.approvedCount}/{item.requiredCount} approved
                  </Badge>
                </div>
              </div>
            </button>
          ))}

          {amberVisible.map(item => (
            <button
              key={`amber-${item.contractorId}-${item.docTypeId}`}
              type="button"
              className="w-full text-left p-2.5 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
              onClick={() => onSelect(item.contractorId, item.docTypeId)}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-sm font-semibold truncate text-amber-800">
                      {item.docTypeName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Contractor: {item.contractorName}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-700">
                    <Clock className="h-3 w-3" />
                    At risk
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">
                    {item.dueInDays === 0 ? 'Due today' : `Due in ${item.dueInDays} day${item.dueInDays !== 1 ? 's' : ''}`}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {item.approvedCount}/{item.requiredCount} approved
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {onViewAll && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-primary">
            View full list
          </Button>
        </div>
      )}
    </Card>
  );
};
