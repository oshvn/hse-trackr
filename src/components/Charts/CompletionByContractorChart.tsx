import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import type { KpiData } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart3 } from 'lucide-react';

const getStatusColor = (completion: number): string => {
  if (completion >= 80) return 'hsl(var(--status-success))';
  if (completion >= 60) return 'hsl(var(--status-warning))';
  return 'hsl(var(--status-danger))';
};

interface CompletionByContractorBarProps {
  kpiData: KpiData[];
  className?: string;
}

export const CompletionByContractorBar: React.FC<CompletionByContractorBarProps> = ({
  kpiData,
  className,
}) => {
  const chartData = kpiData
    .map(item => ({
      name: item.contractor_name,
      completion: Math.round(item.completion_ratio * 100),
      contractorId: item.contractor_id,
    }))
    .sort((a, b) => b.completion - a.completion);

  if (chartData.length === 0) {
    return (
      <Card className={cn('p-6 flex flex-col gap-4', className)}>
        <div>
          <h3 className="text-lg font-bold">Completion % by Contractor</h3>
          <p className="text-sm text-muted-foreground">Overall progress comparison</p>
        </div>
        <EmptyState
          icon={BarChart3}
          title="No contractor data"
          description="Contractor completion data will appear here"
        />
      </Card>
    );
  }

  return (
    <Card className={cn('p-6 flex flex-col gap-4 h-full', className)}>
      <div>
        <h3 className="text-lg font-bold">Completion % by Contractor</h3>
        <p className="text-sm text-muted-foreground">Overall progress comparison</p>
      </div>

      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const value = payload[0].value as number;
                  return (
                    <div className="bg-card border rounded-lg p-3 shadow-lg text-sm">
                      <p className="font-semibold mb-1">{label}</p>
                      <p style={{ color: getStatusColor(value) }}>
                        Completion: {value}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="completion" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getStatusColor(entry.completion)} />
              ))}
              <LabelList dataKey="completion" position="top" formatter={(value: number) => `${value}%`} style={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
