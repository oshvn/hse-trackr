import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { DocProgress } from '@/pages/my-submissions';

interface CategoryProgressProps {
  categories: string[];
  docProgress: DocProgress[];
}

export const CategoryProgress: React.FC<CategoryProgressProps> = ({
  categories,
  docProgress
}) => {
  const getCategoryStats = (category: string) => {
    const codeFromCategory = (s?: string | null) => (s?.trim() || '').split(' ')[0]?.replace(/[^\d.]/g, '').replace(/\.$/, '');
    const categoryProgress = docProgress.filter(prog => {
      const progCategory = prog.category;
      const progCode = codeFromCategory(progCategory);
      const c = category;
      return (
        progCategory === c ||
        progCategory?.startsWith(c + ' ') ||
        progCode === c ||
        progCode?.startsWith(c + '.')
      );
    });
    const totalRequired = categoryProgress.reduce((sum, prog) => sum + (prog.required_count || 0), 0);
    const totalApproved = categoryProgress.reduce((sum, prog) => sum + (prog.approved_count || 0), 0);
    const percentage = totalRequired > 0 ? Math.round((totalApproved / totalRequired) * 100) : 0;
    
    return {
      approved: totalApproved,
      required: totalRequired,
      percentage
    };
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Progress by Category</h3>
      <div className="space-y-4">
        {categories.map(category => {
          const stats = getCategoryStats(category);
          return (
            <div key={category} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{category}</span>
                <span className="text-sm text-muted-foreground">
                  {stats.approved}/{stats.required} ({stats.percentage}%)
                </span>
              </div>
              <Progress value={stats.percentage} className="h-2" />
            </div>
          );
        })}
      </div>
    </Card>
  );
};