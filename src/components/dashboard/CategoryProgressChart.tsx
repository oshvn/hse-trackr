import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { CategoryProgressSummary } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';

interface CategoryProgressChartProps {
  data: CategoryProgressSummary[];
  onSelectCategory?: (category: string) => void;
  className?: string;
}

export const CategoryProgressChart: React.FC<CategoryProgressChartProps> = ({ data, onSelectCategory, className }) => {
  const chartData = useMemo(() => {
    return data.map(item => ({
      category: item.category,
      approved: item.approved,
      remaining: Math.max(item.required - item.approved, 0),
      required: item.required,
      completion: item.completion,
    }));
  }, [data]);

  return (
    <Card className={cn('p-5 flex flex-col', className)}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold">Progress by Category</h3>
          <p className="text-sm text-muted-foreground">Approved vs required documents per category</p>
        </div>
      </div>

      <div className="h-[150px]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No categories match the current filters
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
              onClick={dataPoint => {
                if (!onSelectCategory || !dataPoint?.activePayload?.[0]) return;
                const category = dataPoint.activePayload[0].payload.category as string;
                onSelectCategory(category);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const approved = Number(payload.find(item => item.dataKey === 'approved')?.value ?? 0);
                  const remaining = Number(payload.find(item => item.dataKey === 'remaining')?.value ?? 0);
                  const required = approved + remaining;
                  const completion = required > 0 ? Math.round((approved / required) * 100) : 0;
                  return (
                    <div className="bg-background border rounded-md px-3 py-2 text-sm space-y-1">
                      <p className="font-medium">{label}</p>
                      <p>Approved: {approved}</p>
                      <p>Remaining: {remaining}</p>
                      <p>Completion: {completion}%</p>
                    </div>
                  );
                }}
              />
              <Legend verticalAlign="top" height={24} />
              <Bar dataKey="approved" stackId="a" fill="#22c55e" name="Approved" radius={[4, 4, 0, 0]} />
              <Bar dataKey="remaining" stackId="a" fill="#f97316" name="Remaining" radius={[0, 0, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
