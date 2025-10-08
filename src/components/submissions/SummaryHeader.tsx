import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { DocProgress } from '@/pages/my-submissions';

interface SummaryHeaderProps {
  docProgress: DocProgress[];
  category: string | null;
}

export const SummaryHeader: React.FC<SummaryHeaderProps> = ({
  docProgress,
  category
}) => {
  const codeFromCategory = (s?: string | null) => (s?.trim() || '').split(' ')[0]?.replace(/[^\d.]/g, '').replace(/\.$/, '');
  const filteredProgress = category 
    ? docProgress.filter(prog => {
        const progCategory = prog.category;
        const progCode = codeFromCategory(progCategory);
        const c = category;
        return (
          progCategory === c ||
          progCategory?.startsWith(c + ' ') ||
          progCode === c ||
          progCode?.startsWith(c + '.')
        );
      })
    : docProgress;

  const totalRequired = filteredProgress.reduce((sum, prog) => sum + prog.required_count, 0);
  const totalApproved = filteredProgress.reduce((sum, prog) => sum + prog.approved_count, 0);
  
  const criticalDocs = filteredProgress.filter(prog => prog.is_critical);
  const criticalApproved = criticalDocs.filter(prog => prog.approved_count >= 1).length;
  const totalCritical = criticalDocs.length;
  
  const overdueDocs = filteredProgress.filter(prog => {
    if (!prog.planned_due_date || prog.approved_count >= prog.required_count) return false;
    const dueDate = new Date(prog.planned_due_date);
    const today = new Date();
    return today > dueDate;
  });

  const completionPercentage = totalRequired > 0 ? Math.round((totalApproved / totalRequired) * 100) : 0;
  const mustHavePercentage = totalCritical > 0 ? Math.round((criticalApproved / totalCritical) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <div className="text-sm text-muted-foreground">Completion</div>
            <div className="text-2xl font-bold">
              {completionPercentage}%
            </div>
            <div className="text-xs text-muted-foreground">
              {totalApproved}/{totalRequired} documents
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <div className="text-sm text-muted-foreground">Must-have Ready</div>
            <div className="text-2xl font-bold">
              {mustHavePercentage}%
            </div>
            <div className="text-xs text-muted-foreground">
              {criticalApproved}/{totalCritical} critical docs
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-red-600" />
          <div>
            <div className="text-sm text-muted-foreground">Overdue</div>
            <div className="text-2xl font-bold">
              {overdueDocs.length}
            </div>
            <div className="text-xs text-muted-foreground">
              {overdueDocs.length === 1 ? 'item' : 'items'} past due
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};