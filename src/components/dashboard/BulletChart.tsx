import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { Target } from 'lucide-react';
import type { ContractorCategoryProgressItem } from '@/lib/dashboardHelpers';

interface BulletChartProps {
  data: ContractorCategoryProgressItem[];
  onSelect?: (category: string, contractorId: string) => void;
  className?: string;
}

interface BulletData {
  category: string;
  actual: number;
  target: number;
  contractorId: string;
  contractorName: string;
}

export const BulletChart: React.FC<BulletChartProps> = ({ data, onSelect, className }) => {
  const bulletData = useMemo(() => {
    if (!data.length) return [];

    // Group by category and get top contractor for each
    const categoryMap = new Map<string, ContractorCategoryProgressItem>();
    
    data.forEach(item => {
      const existing = categoryMap.get(item.categoryName);
      if (!existing || item.completionPercentage > existing.completionPercentage) {
        categoryMap.set(item.categoryName, item);
      }
    });

    return Array.from(categoryMap.values())
      .map(item => ({
        category: item.categoryName,
        actual: item.completionPercentage,
        target: 100, // Target is always 100%
        contractorId: item.contractorId,
        contractorName: item.contractorName,
      }))
      .sort((a, b) => a.actual - b.actual) // Sort by actual progress
      .slice(0, 6); // Show top 6 categories
  }, [data]);

  const getQualitativeColor = (value: number): string => {
    if (value >= 80) return 'bg-status-success';
    if (value >= 60) return 'bg-status-warning';
    if (value >= 40) return 'bg-status-danger/60';
    return 'bg-status-danger';
  };

  const getQualitativeRanges = () => [
    { threshold: 40, color: 'bg-status-danger/10' },
    { threshold: 60, color: 'bg-status-warning/10' },
    { threshold: 80, color: 'bg-status-success/10' },
    { threshold: 100, color: 'bg-status-success/20' },
  ];

  const handleBarClick = (item: BulletData) => {
    if (onSelect) {
      onSelect(item.category, item.contractorId);
    }
  };

  return (
    <Card className={cn('p-6 flex flex-col gap-4', className)}>
      <div>
        <h3 className="text-lg font-bold">Progress by Category (Bullet View)</h3>
        <p className="text-sm text-muted-foreground">
          Performance comparison: Actual vs 100% target
        </p>
      </div>

      <div className="flex-1 min-h-0 space-y-3">
        {bulletData.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No category data"
            description="Category progress will appear when filters match data"
          />
        ) : (
          bulletData.map((item) => {
            const ranges = getQualitativeRanges();
            return (
              <div
                key={item.category}
                className="space-y-1 group cursor-pointer"
                onClick={() => handleBarClick(item)}
              >
                {/* Category name and contractor */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.contractorName}
                  </span>
                </div>

                {/* Bullet chart */}
                <div className="relative h-8 w-full">
                  {/* Qualitative ranges background */}
                  <div className="absolute inset-0 flex rounded overflow-hidden border border-border">
                    {ranges.map((range, idx) => {
                      const prevThreshold = idx > 0 ? ranges[idx - 1].threshold : 0;
                      const width = ((range.threshold - prevThreshold) / 100) * 100;
                      return (
                        <div
                          key={range.threshold}
                          className={cn('h-full transition-all', range.color)}
                          style={{ width: `${width}%` }}
                        />
                      );
                    })}
                  </div>

                  {/* Actual performance bar */}
                  <div className="absolute inset-y-0 left-0 flex items-center">
                    <div
                      className={cn(
                        'h-5 rounded transition-all group-hover:h-6',
                        getQualitativeColor(item.actual)
                      )}
                      style={{ width: `${item.actual}%` }}
                    />
                  </div>

                  {/* Target marker (vertical line at 100%) */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-foreground/80"
                    style={{ left: '100%', transform: 'translateX(-50%)' }}
                  />

                  {/* Value label */}
                  <div className="absolute inset-0 flex items-center justify-end pr-2">
                    <span className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded',
                      item.actual >= 50 ? 'text-white' : 'text-foreground bg-card/90'
                    )}>
                      {item.actual}%
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className={cn('w-3 h-2 rounded', getQualitativeColor(item.actual))} />
                    <span>Actual</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-3 bg-foreground/80" />
                    <span>Target (100%)</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Performance zones legend */}
      <div className="pt-3 border-t">
        <div className="text-xs font-semibold text-muted-foreground mb-2">Performance Zones:</div>
        <div className="grid grid-cols-4 gap-2 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-status-danger/10 border border-status-danger/20" />
            <span className="text-muted-foreground">0-40% Poor</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-status-danger/60" />
            <span className="text-muted-foreground">40-60% Fair</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-status-warning" />
            <span className="text-muted-foreground">60-80% Good</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-status-success" />
            <span className="text-muted-foreground">80-100% Excellent</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
