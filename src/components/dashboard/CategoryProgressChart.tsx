import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, LabelList } from 'recharts';
import type { ContractorCategoryProgressItem } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { FolderKanban } from 'lucide-react';

interface CategoryProgressChartProps {
  data: ContractorCategoryProgressItem[];
  onSelect?: (category: string, contractorId: string) => void;
  className?: string;
}

const BAR_COLORS = ['#2563eb', '#f97316', '#22c55e', '#a855f7'];

const getStatusColor = (value: number): string => {
  if (value >= 80) return 'hsl(var(--status-success))';
  if (value >= 60) return 'hsl(var(--status-warning))';
  return 'hsl(var(--status-danger))';
};

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
    <Card className={cn('p-6 flex flex-col gap-4', className)}>
      <div>
        <h3 className="text-lg font-bold">Progress by Category</h3>
        <p className="text-sm text-muted-foreground">Completion percentage per contractor</p>
      </div>

      <div className="flex-1 min-h-0">
        {chartData.length === 0 || contractors.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No category data"
            description="Category progress will appear when filters match data"
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 45 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                formatter={(value, name) => [`${value}%`, name]}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend verticalAlign="top" height={30} />
              {contractors.map((contractor, index) => (
                <Bar
                  key={contractor.id}
                  dataKey={contractor.name}
                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                  onClick={payload => handleBarClick(payload.category as string, contractor.name)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <LabelList 
                    dataKey={contractor.name} 
                    position="top" 
                    formatter={(value: number) => value > 0 ? `${value}%` : ''} 
                    style={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} 
                  />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

