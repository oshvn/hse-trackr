import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { KpiData } from '@/lib/dashboardHelpers';

interface PerformanceBarChartsProps {
  data: KpiData[];
}

const getStatusColor = (value: number): string => {
  if (value >= 80) return 'hsl(var(--status-success))';
  if (value >= 60) return 'hsl(var(--status-warning))';
  return 'hsl(var(--status-danger))';
};

const toPercent = (value: number | null | undefined): number => {
  if (value === null || value === undefined || Number.isNaN(value)) return 0;
  const normalized = value > 1 ? value : value * 100;
  return Math.max(0, Math.min(100, Math.round(normalized)));
};

export const PerformanceBarCharts: React.FC<PerformanceBarChartsProps> = ({ data }) => {
  const topContractors = data.slice(0, 3);

  const completionData = topContractors.map(item => ({
    name: item.contractor_name,
    value: toPercent(item.completion_ratio),
  }));

  const qualityData = topContractors.map(item => ({
    name: item.contractor_name,
    value: toPercent(item.quality_score ?? 0),
  }));

  const speedData = topContractors.map(item => ({
    name: item.contractor_name,
    value: toPercent(item.speed_score ?? 0),
  }));

  const mustHaveData = topContractors.map(item => ({
    name: item.contractor_name,
    value: toPercent(item.must_have_ready_ratio),
  }));

  const metrics = [
    { title: 'Completion', data: completionData },
    { title: 'Quality', data: qualityData },
    { title: 'Speed', data: speedData },
    { title: 'Must-Have Ready', data: mustHaveData },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((metric) => (
        <div key={metric.title} className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">{metric.title}</h4>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={metric.data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }} 
                tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
              />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip formatter={(value: number) => [`${value}%`, 'Score']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {metric.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.value)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
};
