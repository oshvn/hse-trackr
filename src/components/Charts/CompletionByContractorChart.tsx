import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { KpiData } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';

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
      <Card className={cn('p-5 flex flex-col', className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Completion % by Contractor</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          No contractor data available
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-5 flex flex-col', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Completion % by Contractor</h3>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              angle={-35}
              textAnchor="end"
              height={40}
              interval={0}
            />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-sm text-sm">
                      <p className="font-medium">{label}</p>
                      <p style={{ color: payload[0].color }}>
                        Completion: {payload[0].value}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="completion" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
