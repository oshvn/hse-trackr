import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';

interface MustHaveSplitChartProps {
  mustHaveCount: number;
  standardCount: number;
  className?: string;
}

const COLORS = ['#f97316', '#2563eb'];

export const MustHaveSplitChart: React.FC<MustHaveSplitChartProps> = ({ mustHaveCount, standardCount, className }) => {
  const data = useMemo(() => {
    const total = mustHaveCount + standardCount;
    return [
      {
        name: 'Must-have documents',
        value: mustHaveCount,
        percentage: total > 0 ? Math.round((mustHaveCount / total) * 100) : 0,
      },
      {
        name: 'Standard documents',
        value: standardCount,
        percentage: total > 0 ? Math.round((standardCount / total) * 100) : 0,
      },
    ];
  }, [mustHaveCount, standardCount]);

  const total = mustHaveCount + standardCount;

  return (
    <Card className={cn('p-5 flex flex-col', className)}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold">Document Mix</h3>
          <p className="text-sm text-muted-foreground">Share of must-have vs standard requirements</p>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          Total: {total}
        </Badge>
      </div>

      <div className="flex-1">
        {total === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No document types configured yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _name, { payload }) => [
                  `${value} documents (${payload.percentage}%)`,
                  payload.name,
                ]}
              />
              <Legend verticalAlign="bottom" height={20} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
