import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { KpiData } from '@/lib/dashboardHelpers';

interface CompletionByContractorBarProps {
  kpiData: KpiData[];
}

export const CompletionByContractorBar: React.FC<CompletionByContractorBarProps> = ({
  kpiData
}) => {
  const chartData = kpiData
    .map(item => ({
      name: item.contractor_name,
      completion: Math.round(item.completion_ratio * 100),
      contractorId: item.contractor_id
    }))
    .sort((a, b) => b.completion - a.completion);

  if (chartData.length === 0) {
    return (
      <Card className="p-6 h-[260px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Completion % by Contractor</h3>
        </div>
        <div className="flex items-center justify-center h-[180px] text-muted-foreground">
          No contractor data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 h-[260px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Completion % by Contractor</h3>
      </div>

      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-md">
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
            <Bar 
              dataKey="completion"
              fill="#8884d8"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};