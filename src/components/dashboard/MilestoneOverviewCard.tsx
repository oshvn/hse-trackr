import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { MilestoneProgressItem } from '@/lib/dashboardHelpers';
import { calculateOverdueDays, calculateDueInDays } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';
import { CalendarClock, CheckCircle2, Timer, AlertTriangle } from 'lucide-react';

interface MilestoneOverviewCardProps {
  items: MilestoneProgressItem[];
  onViewDetails: () => void;
  className?: string;
}

const daysUntil = (date: string | null): number | null => {
  if (!date) return null;
  const diff = calculateDueInDays(date);
  return diff;
};

export const MilestoneOverviewCard: React.FC<MilestoneOverviewCardProps> = ({ items, onViewDetails, className }) => {
  const summary = useMemo(() => {
    if (!items.length) {
      return {
        total: 0,
        onTrack: 0,
        overdue: 0,
        dueSoon: 0,
      };
    }

    let overdue = 0;
    let dueSoon = 0;
    let onTrack = 0;

    items.forEach(item => {
      const isCompleted = item.requiredCount === 0 || item.approvedCount >= item.requiredCount;
      const overdueDays = calculateOverdueDays(item.plannedDate ?? null);
      const dueInDays = daysUntil(item.plannedDate ?? null);

      if (isCompleted) {
        onTrack += 1;
      } else if (overdueDays > 0) {
        overdue += 1;
      } else if (dueInDays !== null && dueInDays <= 7) {
        dueSoon += 1;
      }
    });

    return {
      total: items.length,
      onTrack,
      overdue,
      dueSoon,
    };
  }, [items]);

  const completionRatio = summary.total > 0 ? Math.round((summary.onTrack / summary.total) * 100) : 0;

  return (
    <Card className={cn('p-5 flex flex-col gap-4', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Milestone Overview</h3>
          <p className="text-sm text-muted-foreground">Track upcoming and overdue contractor milestones</p>
        </div>
        <Button variant="outline" size="sm" onClick={onViewDetails}>
          View timeline
        </Button>
      </div>

      {summary.total === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No milestone data available for the current filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> On track
              </div>
              <p className="text-xs text-muted-foreground">{summary.onTrack} of {summary.total} milestones completed</p>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CalendarClock className="h-4 w-4 text-blue-600" /> Due soon
              </div>
              <p className="text-xs text-muted-foreground">{summary.dueSoon} milestones due within 7 days</p>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <AlertTriangle className="h-4 w-4 text-red-600" /> Overdue
              </div>
              <p className="text-xs text-muted-foreground">{summary.overdue} milestones need immediate attention</p>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Timer className="h-4 w-4 text-amber-600" /> Total milestones
              </div>
              <p className="text-xs text-muted-foreground">{summary.total} tracked across all contractors</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Completion status</span>
              <Badge variant={completionRatio >= 80 ? 'secondary' : 'outline'}>{completionRatio}% on track</Badge>
            </div>
            <Progress value={completionRatio} className="h-2" />
          </div>
        </>
      )}
    </Card>
  );
};
