import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface MustHaveSplitChartProps {
  mustHaveCount: number;
  regularCount: number;
}

const COLORS = ['#ef4444', '#3b82f6'];

export const MustHaveSplitChart: React.FC<MustHaveSplitChartProps> = ({
  mustHaveCount,
  regularCount,
}) => {
  const data = useMemo(() => {
    const total = mustHaveCount + regularCount;

    return [
      {
        name: 'Must-have documents',
        value: mustHaveCount,
        percentage: total > 0 ? Math.round((mustHaveCount / total) * 100) : 0,
      },
      {
        name: 'Standard documents',
        value: regularCount,
        percentage: total > 0 ? Math.round((regularCount / total) * 100) : 0,
      },
    ];
  }, [mustHaveCount, regularCount]);

  return (
    <Card className="p-6 h-80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Document Mix</h3>
          <p className="text-sm text-muted-foreground">
            Share of must-have vs standard documents
          </p>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          Total: {mustHaveCount + regularCount}
        </Badge>
      </div>
      <div className="h-64">
        {mustHaveCount + regularCount === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No document types configured
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
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _name, { payload }) => [
                  `${value} docs (${payload.percentage}%)`,
                  payload.name,
                ]}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
