import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import type { KpiData } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';

interface PerformanceSummary {
  overallCompletion: number;
  mustHaveReady: number;
  overdueMustHaves: number;
  avgPrepTime: number;
  avgApprovalTime: number;
}

interface ContractorPerformanceRadarProps {
  data: KpiData[];
  summary?: PerformanceSummary;
  className?: string;
}

const RADAR_COLORS = ['#2563eb', '#f97316', '#22c55e'];

const toPercent = (value: number | null | undefined): number => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 0;
  }
  const normalized = value > 1 ? value : value * 100;
  return Math.max(0, Math.min(100, Math.round(normalized)));
};

export const ContractorPerformanceRadar: React.FC<ContractorPerformanceRadarProps> = ({ data, summary, className }) => {
  const { radarData, contractors } = useMemo(() => {
    if (!data?.length) {
      return { radarData: [] as Record<string, number | string>[], contractors: [] as { id: string; name: string }[] };
    }

    const contractors = data.slice(0, 3).map(item => ({ id: item.contractor_id, name: item.contractor_name }));

    const metrics = [
      {
        key: 'completion',
        label: 'Completion',
        accessor: (kpi: KpiData) => toPercent(kpi.completion_ratio),
      },
      {
        key: 'mustHave',
        label: 'Must-have Ready',
        accessor: (kpi: KpiData) => toPercent(kpi.must_have_ready_ratio),
      },
      {
        key: 'quality',
        label: 'Quality',
        accessor: (kpi: KpiData) => toPercent(kpi.quality_score ?? 0),
      },
      {
        key: 'speed',
        label: 'Speed',
        accessor: (kpi: KpiData) => toPercent(kpi.speed_score ?? 0),
      },
    ];

    const radarRows = metrics.map(metric => {
      const row: Record<string, number | string> = { metric: metric.label };
      contractors.forEach(contractor => {
        const kpi = data.find(entry => entry.contractor_id === contractor.id);
        row[contractor.name] = kpi ? metric.accessor(kpi) : 0;
      });
      return row;
    });

    return { radarData: radarRows, contractors };
  }, [data]);

  if (!radarData.length || contractors.length === 0) {
    return (
      <Card className={cn('p-5 flex flex-col gap-3', className)}>
        <div>
          <h3 className="text-lg font-semibold">Performance Radar</h3>
          <p className="text-sm text-muted-foreground">Overview of completion, quality, and speed</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No KPI data available for the current filters
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-5 space-y-4', className)}>
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-lg font-semibold">Performance Radar</h3>
          <p className="text-sm text-muted-foreground">Compare contractors across quality and speed indicators</p>
        </div>
        {summary ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-muted-foreground">
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="font-medium text-foreground">{summary.overallCompletion}%</div>
              <div>Overall completion</div>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="font-medium text-foreground">{summary.mustHaveReady}%</div>
              <div>Must-have ready</div>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="font-medium text-foreground">{summary.overdueMustHaves}</div>
              <div>Overdue must-have</div>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="font-medium text-foreground">{summary.avgPrepTime || '-'}d</div>
              <div>Avg prep</div>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="font-medium text-foreground">{summary.avgApprovalTime || '-'}d</div>
              <div>Avg approval</div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="65%">
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={45} domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(value: number) => [`${value}%`, 'Score']} />
            <Legend />
            {contractors.map((contractor, index) => (
              <Radar
                key={contractor.id}
                dataKey={contractor.name}
                stroke={RADAR_COLORS[index % RADAR_COLORS.length]}
                fill={RADAR_COLORS[index % RADAR_COLORS.length]}
                fillOpacity={0.2}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
