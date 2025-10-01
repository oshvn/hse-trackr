import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, eachDayOfInterval, min, max } from 'date-fns';
import { cn } from '@/lib/utils';
import { PlannedVsActual as PlannedVsActualFull } from '@/components/Charts/PlannedVsActualChart';

interface RequirementRow {
  doc_type_id: string;
  required_count: number;
  planned_due_date: string | null;
}

interface SubmissionRow {
  doc_type_id: string;
  approved_at: string | null;
  cnt: number;
}

interface PlannedVsActualCompactProps {
  contractorId: string;
  contractorName: string;
  contractorOptions: Array<{ id: string; name: string }>;
  requirements: RequirementRow[];
  submissions: SubmissionRow[];
  onContractorChange: (value: string) => void;
  isLoading: boolean;
  className?: string;
}

interface TimelinePoint {
  date: string;
  dateDisplay: string;
  planned: number;
  actual: number;
}

export const PlannedVsActualCompact: React.FC<PlannedVsActualCompactProps> = ({
  contractorId,
  contractorName,
  contractorOptions,
  requirements,
  submissions,
  onContractorChange,
  isLoading,
  className,
}) => {
  const [fullOpen, setFullOpen] = useState(false);

  const timelineData = useMemo<TimelinePoint[]>(() => {
    if (contractorId === 'all') return [];
    if (!requirements.length && !submissions.length) return [];

    const plannedDates = requirements
      .filter(req => req.planned_due_date)
      .map(req => parseISO(req.planned_due_date as string));

    const approvalDates = submissions
      .filter(sub => sub.approved_at)
      .map(sub => parseISO(sub.approved_at as string));

    const allDates = [...plannedDates, ...approvalDates];
    if (allDates.length === 0) return [];

    const startDate = min(allDates);
    const endDate = max([...allDates, new Date()]);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    return dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');

      const plannedCumulative = requirements
        .filter(req => req.planned_due_date && req.planned_due_date <= dateStr)
        .reduce((sum, req) => sum + req.required_count, 0);

      const actualCumulative = submissions
        .filter(sub => sub.approved_at && sub.approved_at <= `${dateStr}T23:59:59`)
        .reduce((sum, sub) => sum + sub.cnt, 0);

      return {
        date: dateStr,
        dateDisplay: format(date, 'MMM dd'),
        planned: plannedCumulative,
        actual: actualCumulative,
      };
    });
  }, [contractorId, requirements, submissions]);

  const compactData = useMemo(() => {
    if (timelineData.length <= 12) return timelineData;
    return timelineData.slice(-12);
  }, [timelineData]);

  const finalPoint = timelineData.at(-1);
  const plannedTotal = finalPoint?.planned ?? 0;
  const actualTotal = finalPoint?.actual ?? 0;

  const completionPct = plannedTotal > 0 ? Math.round((actualTotal / plannedTotal) * 100) : 0;
  const statusCopy = (() => {
    if (plannedTotal === 0) return 'No baseline plan available';
    if (completionPct >= 110) return 'Ahead of plan';
    if (completionPct >= 90) return 'On track';
    return 'Behind plan';
  })();

  return (
    <Card className={cn('p-5 flex flex-col', className)}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-lg font-semibold">Planned vs Actual</h3>
          <p className="text-sm text-muted-foreground">Timeline of approved submissions vs target dates</p>
        </div>
        <Select value={contractorId} onValueChange={onContractorChange}>
          <SelectTrigger className="w-48 h-9 text-sm">
            <SelectValue placeholder="Select contractor" />
          </SelectTrigger>
          <SelectContent>
            {contractorOptions.map(option => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {contractorId === 'all' ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Select a contractor to view the planned vs actual timeline.
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : compactData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          No progress data available for this contractor yet.
        </div>
      ) : (
        <>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={compactData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="dateDisplay" tick={{ fontSize: 11 }} interval={compactData.length > 8 ? 1 : 0} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const planned = payload.find(item => item.dataKey === 'planned')?.value ?? 0;
                    const actual = payload.find(item => item.dataKey === 'actual')?.value ?? 0;
                    return (
                      <div className="bg-background border rounded-md px-3 py-2 text-sm space-y-1">
                        <p className="font-medium">{label}</p>
                        <p>Planned cumulative: {planned}</p>
                        <p>Actual cumulative: {actual}</p>
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="planned" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" name="Planned" />
                <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2} name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground">{completionPct}%</span> complete · {statusCopy}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setFullOpen(true)} className="text-primary">
              View full timeline
            </Button>
          </div>

          <Dialog open={fullOpen} onOpenChange={setFullOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Planned vs Actual · {contractorName}</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <PlannedVsActualFull
                  contractorId={contractorId}
                  contractorName={contractorName}
                  requirements={requirements}
                  submissions={submissions}
                />
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </Card>
  );
};
