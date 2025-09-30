import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface CategoryProgressItem {
  category: string;
  completion: number;
  approved: number;
  required: number;
}

interface ProgressByCategoryProps {
  items: CategoryProgressItem[];
  onCategoryClick: (category: string) => void;
}

const getStatusVariant = (completion: number, required: number) => {
  if (required === 0) {
    return 'bg-muted text-muted-foreground';
  }

  if (completion >= 100) {
    return 'bg-green-100 text-green-700 border border-green-200';
  }

  if (completion > 0) {
    return 'bg-amber-100 text-amber-700 border border-amber-200';
  }

  return 'bg-red-100 text-red-700 border border-red-200';
};

const getProgressColor = (completion: number, required: number) => {
  if (required === 0) {
    return 'bg-muted-foreground/40';
  }

  if (completion >= 100) {
    return 'bg-green-500';
  }

  if (completion > 0) {
    return 'bg-amber-500';
  }

  return 'bg-red-500';
};

export const ProgressByCategory: React.FC<ProgressByCategoryProps> = ({ items, onCategoryClick }) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Progress by Category</h2>
        <span className="text-sm text-muted-foreground">Tap a category to drill down</span>
      </div>

      <div className="space-y-4">
        {items.map(item => {
          const completion = Math.min(100, Math.round(item.completion));
          const variantClass = getStatusVariant(completion, item.required);
          const progressColor = getProgressColor(completion, item.required);

          return (
            <button
              key={item.category}
              type="button"
              className="w-full text-left"
              onClick={() => onCategoryClick(item.category)}
              disabled={item.required === 0}
            >
              <div className={`p-4 rounded-lg transition-colors ${variantClass} ${item.required === 0 ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-sm font-medium tracking-wide uppercase text-muted-foreground">
                      {item.category}
                    </div>
                    <div className="text-2xl font-bold">{completion}%</div>
                  </div>
                  <Badge variant="outline" className="bg-white/70 text-muted-foreground">
                    {item.approved}/{item.required} approved
                  </Badge>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/60 overflow-hidden">
                  <div
                    className={`${progressColor} h-full transition-all`}
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};
