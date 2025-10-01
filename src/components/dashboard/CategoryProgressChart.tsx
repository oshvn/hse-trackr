import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { CategoryProgressSummary } from '@/lib/dashboardHelpers';

interface CategoryProgressChartProps {
  data: CategoryProgressSummary[];
}

export const CategoryProgressChart: React.FC<CategoryProgressChartProps> = ({ data }) => {
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
    <Card className="p-6 h-[260px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Progress by Category</h3>
          <p className="text-sm text-muted-foreground">Approved vs required must-have and standard documents</p>
        </div>
      </div>

      <div className="h-[180px]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No categories match the current filters
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const approved = payload.find(item => item.dataKey === 'approved')?.value ?? 0;
                  const remaining = payload.find(item => item.dataKey === 'remaining')?.value ?? 0;
                  const required = Number(approved) + Number(remaining);
                  const completion = required > 0 ? Math.round((Number(approved) / required) * 100) : 0;
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
