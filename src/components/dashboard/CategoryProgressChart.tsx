import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { ContractorCategoryProgressItem } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';

interface CategoryProgressChartProps {
  data: ContractorCategoryProgressItem[];
  onSelect?: (category: string, contractorId: string) => void;
  className?: string;
}

const BAR_COLORS = ['#2563eb', '#f97316', '#22c55e', '#a855f7'];

type ChartDatum = {
  category: string;
  [contractorName: string]: string | number;
};

export const CategoryProgressChart: React.FC<CategoryProgressChartProps> = ({ data, onSelect, className }) => {
  const { chartData, contractors } = useMemo(() => {
    if (!data.length) {
      return { chartData: [] as ChartDatum[], contractors: [] as { id: string; name: string }[] };
    }

    const contractorMap = new Map<string, string>();
    const categories = new Map<string, ContractorCategoryProgressItem[]>();

    data.forEach(item => {
      contractorMap.set(item.contractorId, item.contractorName);
      const bucket = categories.get(item.categoryName) ?? [];
      bucket.push(item);
      categories.set(item.categoryName, bucket);
    });

    const contractors = Array.from(contractorMap.entries())
      .map(([id, name]) => ({ id, name }))
      .slice(0, 3);

    const chartRows: ChartDatum[] = Array.from(categories.entries()).map(([category, items]) => {
      const row: ChartDatum = { category };
      contractors.forEach(contractor => {
        const match = items.find(entry => entry.contractorId === contractor.id);
        row[contractor.name] = match ? match.completionPercentage : 0;
      });
      return row;
    });

    return { chartData: chartRows, contractors };
  }, [data]);

  const handleBarClick = (category: string | undefined, contractorName: string) => {
    if (!onSelect || !category) return;
    const contractor = contractors.find(entry => entry.name === contractorName);
    if (!contractor) return;
    onSelect(category, contractor.id);
  };

  return (
    <Card className={cn('p-5 flex flex-col', className)}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold">Progress by Category</h3>
          <p className="text-sm text-muted-foreground">Completion percentage per contractor</p>
        </div>
      </div>

      <div className="h-[200px]">
        {chartData.length === 0 || contractors.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No categories match the current filters
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                formatter={(value, name) => [`${value}%`, name]}
              />
              <Legend verticalAlign="top" height={24} />
              {contractors.map((contractor, index) => (
                <Bar
                  key={contractor.id}
                  dataKey={contractor.name}
                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                  onClick={payload => handleBarClick(payload.category as string, contractor.name)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

