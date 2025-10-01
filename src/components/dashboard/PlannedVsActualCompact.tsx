import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface PlannedVsActualCompactProps {
  contractorId: string;
  onContractorChange: (value: string) => void;
  contractorOptions: Array<{ id: string; name: string }>;
  totals: Record<string, { planned: number; actual: number }>;
}

export const PlannedVsActualCompact: React.FC<PlannedVsActualCompactProps> = ({
  contractorId,
  onContractorChange,
  contractorOptions,
  totals,
}) => {
  const metrics = totals[contractorId] ?? { planned: 0, actual: 0 };
  const data = useMemo(() => (
    [
      { label: 'Planned', value: metrics.planned },
      { label: 'Actual', value: metrics.actual },
    ]
  ), [metrics.planned, metrics.actual]);

  const completion = metrics.planned > 0
    ? Math.round((metrics.actual / metrics.planned) * 100)
    : 0;

  const statusCopy = metrics.planned === 0
    ? 'No planned submissions'
    : completion >= 100
      ? 'Ahead of plan'
      : completion >= 80
        ? 'On track'
        : 'Behind plan';

  return (
    <Card className="p-6 h-[260px]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Planned vs Actual</h3>
          <p className="text-sm text-muted-foreground">Compare approved submissions against the planned volume</p>
        </div>
        <Select value={contractorId} onValueChange={onContractorChange}>
          <SelectTrigger className="w-52">
            <SelectValue />
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

      <div className="h-[150px]">
        {metrics.planned === 0 && metrics.actual === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No progress data available for this selection
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip formatter={(value: number) => [value, 'Documents']} />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{completion}%</span> completion — {statusCopy}
      </div>
    </Card>
  );
};
