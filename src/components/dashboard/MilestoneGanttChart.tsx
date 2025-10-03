import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import type { MilestoneProgressItem } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';
import { Gantt, type Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { parseISO } from 'date-fns';

interface MilestoneGanttChartProps {
  items: MilestoneProgressItem[];
  className?: string;
}

type GanttTask = Task & { displayOrder?: number };

const toDate = (value: string | null): Date => {
  if (!value) {
    return new Date();
  }
  try {
    return parseISO(value);
  } catch (error) {
    return new Date(value);
  }
};

export const MilestoneGanttChart: React.FC<MilestoneGanttChartProps> = ({ items, className }) => {
  const tasks = useMemo<GanttTask[]>(() => {
    if (!items?.length) {
      return [];
    }

    return items.slice(0, 25).map((item, index) => {
      const start = toDate(item.startDate ?? item.plannedDate ?? null);
      const plannedEnd = toDate(item.endDate ?? item.plannedDate ?? null);
      const end = plannedEnd.getTime() < start.getTime() ? start : plannedEnd;
      const progress = Number.isFinite(item.completionPercentage) ? item.completionPercentage : 0;

      return {
        id: item.id,
        name: `${item.contractorName} · ${item.docTypeName}`,
        start,
        end,
        progress,
        type: 'task',
        hideChildren: true,
        displayOrder: index,
        styles: {
          progressColor: '#2563eb',
          progressSelectedColor: '#1d4ed8',
          backgroundColor: item.statusColor === 'red' ? '#fee2e2' : item.statusColor === 'amber' ? '#fef3c7' : '#dbeafe',
          backgroundSelectedColor: '#c7d2fe',
        },
      } as GanttTask;
    });
  }, [items]);

  if (!tasks.length) {
    return (
      <Card className={cn('p-5 flex flex-col gap-3', className)}>
        <div>
          <h3 className="text-lg font-semibold">Milestone Gantt</h3>
          <p className="text-sm text-muted-foreground">Timeline of planned vs actual progress</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No milestone data available for the current filters
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-5 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Milestone Gantt</h3>
          <p className="text-sm text-muted-foreground">
            Visualise critical document milestones across contractors
          </p>
        </div>
        {items.length > 25 ? (
          <span className="text-xs text-muted-foreground">
            Showing first 25 milestones
          </span>
        ) : null}
      </div>

      <div className="rounded-md border bg-white overflow-x-auto" style={{ minWidth: 600 }}>
        <Gantt
          tasks={tasks}
          viewMode={ViewMode.Day}
          listCellWidth="220px"
          columnWidth={56}
          fontSize="12"
          barBackgroundColor="#bfdbfe"
        />
      </div>
    </Card>
  );
};
