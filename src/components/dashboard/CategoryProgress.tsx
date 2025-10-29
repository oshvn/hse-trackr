import React from 'react';

export interface Category {
  id: string;
  name: string;
  approved: number;
  pending: number;
  missing: number;
}

export interface CategoryProgressProps {
  categories: Category[];
  onCategoryClick?: (categoryId: string) => void;
}

/**
 * CategoryProgress v2.0
 * Display category progress with stacked bars
 * 
 * Colors:
 * - Approved: Green (#10b981)
 * - Pending: Orange (#f59e0b)
 * - Missing: Red (#ef4444)
 */
export const CategoryProgress: React.FC<CategoryProgressProps> = ({
  categories,
  onCategoryClick,
}) => {
  const calculatePercentages = (cat: Category) => {
    const total = cat.approved + cat.pending + cat.missing;
    if (total === 0) return { approved: 0, pending: 0, missing: 0 };
    return {
      approved: (cat.approved / total) * 100,
      pending: (cat.pending / total) * 100,
      missing: (cat.missing / total) * 100,
    };
  };

  return (
    <div
      className="lg:col-span-4 col-span-1 bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-400 hover:shadow-md cursor-pointer transition-all"
      onClick={() => onCategoryClick?.(categories[0]?.id)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onCategoryClick?.(categories[0]?.id);
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">📂 Category Progress</h3>
        <span className="text-xl">📋</span>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((category) => {
          const percentages = calculatePercentages(category);
          const total = category.approved + category.pending + category.missing;

          return (
            <div
              key={category.id}
              className="space-y-2"
              onClick={(e) => {
                e.stopPropagation();
                onCategoryClick?.(category.id);
              }}
            >
              {/* Category Name */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">{category.name}</h4>
                <span className="text-xs text-gray-500">({total} docs)</span>
              </div>

              {/* Stacked Progress Bar */}
              <div className="flex h-6 rounded-md overflow-hidden bg-gray-100">
                {/* Approved Segment */}
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${percentages.approved}%` }}
                  title={`Approved: ${category.approved}`}
                />
                {/* Pending Segment */}
                <div
                  className="bg-amber-500 transition-all"
                  style={{ width: `${percentages.pending}%` }}
                  title={`Pending: ${category.pending}`}
                />
                {/* Missing Segment */}
                <div
                  className="bg-red-500 transition-all"
                  style={{ width: `${percentages.missing}%` }}
                  title={`Missing: ${category.missing}`}
                />
              </div>

              {/* Stats */}
              <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-gray-600">{category.approved} ✓</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-amber-500 rounded-full" />
                  <span className="text-gray-600">{category.pending} ⏳</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-gray-600">{category.missing} ✕</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">No categories</p>
        </div>
      )}
    </div>
  );
};

export default CategoryProgress;
