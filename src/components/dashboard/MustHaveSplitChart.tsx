import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface MustHaveSplitChartProps {
  mustHaveCount: number;
  standardCount: number;
}

const COLORS = ['#f97316', '#2563eb'];

export const MustHaveSplitChart: React.FC<MustHaveSplitChartProps> = ({ mustHaveCount, standardCount }) => {
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
    <Card className="p-6 h-[260px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Document Mix</h3>
          <p className="text-sm text-muted-foreground">Share of must-have vs standard requirements</p>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          Total: {total}
        </Badge>
      </div>

      <div className="h-[180px]">
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
                innerRadius={45}
                outerRadius={70}
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
              <Legend verticalAlign="bottom" height={24} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
