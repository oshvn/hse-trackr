import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Clock } from 'lucide-react';
import type { DocProgressData } from '@/lib/dashboardHelpers';

interface RedCardsProps {
  redCards: Array<DocProgressData & { overdueDays: number }>;
  onCardClick: (contractorId: string, docTypeId: string) => void;
}

export const RedCards: React.FC<RedCardsProps> = ({
  redCards,
  onCardClick
}) => {
  if (redCards.length === 0) {
    return (
      <Card className="p-6 h-80">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold">Red Cards (Must-have)</h3>
        </div>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p>No overdue must-have items!</p>
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
        <h3 className="text-lg font-semibold">Red Cards (Must-have)</h3>
        <Badge variant="destructive" className="ml-auto">
          {redCards.length}
        </Badge>
      </div>
      
      <ScrollArea className="h-64">
        <div className="space-y-3">
          {redCards.map((item, index) => (
            <div
              key={`${item.contractor_id}-${item.doc_type_id}`}
              className="p-3 border border-red-200 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
              onClick={() => onCardClick(item.contractor_id, item.doc_type_id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {item.contractor_name}
                    </span>
                    <span className="text-muted-foreground text-sm">•</span>
                    <span className="text-sm truncate">
                      {item.doc_type_name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="destructive" className="text-xs">
                      🔴 Must-have
                    </Badge>
                    
                    {item.overdueDays > 0 && (
                      <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
                        <Clock className="h-3 w-3 mr-1" />
                        Overdue {item.overdueDays} day{item.overdueDays !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.category} • {item.approved_count}/{item.required_count} approved
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};