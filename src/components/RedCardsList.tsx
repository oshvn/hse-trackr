import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { suggestActions } from "@/lib/suggestedActions";

interface DocProgressRow {
  contractor_name: string;
  doc_type_name: string;
  category: string;
  is_critical: boolean;
  planned_due_date: string | null;
  status_color: string;
  approved_count: number;
  required_count: number;
}

interface RedCardsListProps {
  data: DocProgressRow[];
}

export function RedCardsList({ data }: RedCardsListProps) {
  const redItems = data.filter(row => row.status_color === 'red');

  const getDaysOverdue = (plannedDate: string | null) => {
    if (!plannedDate) return 0;
    const today = new Date();
    const due = new Date(plannedDate);
    return Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <Card className="h-[360px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Red Cards (Overdue Must-Haves)
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto h-[280px]">
        {redItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No overdue must-have documents
          </div>
        ) : (
          <div className="space-y-4">
            {redItems.map((item, index) => {
              const daysOver = getDaysOverdue(item.planned_due_date);
              const actions = suggestActions(item);
              
              return (
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{item.doc_type_name}</h4>
                      <p className="text-xs text-muted-foreground">{item.contractor_name}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {daysOver} days overdue
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2">
                    {item.category} • Critical: {item.is_critical ? 'Yes' : 'No'}
                  </div>
                  
                  {actions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium mb-1">Suggested Actions:</p>
                      <ul className="text-xs space-y-1">
                        {actions.slice(0, 2).map((action, actionIndex) => (
                          <li key={actionIndex} className="text-muted-foreground">
                            • {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}