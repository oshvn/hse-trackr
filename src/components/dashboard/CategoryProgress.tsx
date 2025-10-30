import React, { useMemo, useState, useEffect } from 'react';

export interface Category {
  id: string;
  name: string;
  approved: number;
  pending: number;
  missing: number;
  isCritical?: boolean;
  criticalReason?: string;
}

export interface CategoryProgressProps {
  categories: Category[];
  onCategoryClick?: (categoryId: string, contractorId?: string) => void;
  onCategoryDrillDown?: (categoryId: string, contractorId?: string) => void;
  contractors?: ContractorData[];
  selectedContractor?: string;
  onContractorChange?: (contractorId: string) => void;
  maxVisibleCategories?: number; // Maximum categories to show before "Show more"
  isDrillDownEnabled?: boolean; // Enable drill-down functionality
  selectedCategoryId?: string | null; // Currently selected category for drill-down
}

export interface ContractorData {
  id: string;
  name: string;
  categories: Category[];
}

/**
 * CategoryProgress v2.0 - Optimized
 * Compact category progress display with stacked bars
 * 
 * Optimizations:
 * - Reduced padding and spacing
 * - Compact contractor tabs
 * - Optimized progress bars
 * - Better critical highlighting
 * - Completion percentage display
 * - Show more/less functionality
 * - Memoized calculations
 */
export const CategoryProgress: React.FC<CategoryProgressProps> = ({
  categories,
  onCategoryClick,
  onCategoryDrillDown,
  contractors,
  selectedContractor,
  onContractorChange,
  maxVisibleCategories = 5,
  isDrillDownEnabled = false,
  selectedCategoryId = null,
}) => {
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Reset showAllCategories when contractor changes
  useEffect(() => {
    setShowAllCategories(false);
  }, [selectedContractor]);

  // Use contractor-specific data if available, otherwise use global categories
  const displayCategories = useMemo(() => {
    // If no contractors or no contractor selected, show all categories
    if (!contractors || contractors.length === 0 || !selectedContractor) {
      return categories;
    }
    
    // Find selected contractor's categories
    const contractorCategories = contractors.find(c => c.id === selectedContractor)?.categories;
    
    // If contractor has specific categories, use them; otherwise fallback to global
    return contractorCategories && contractorCategories.length > 0 
      ? contractorCategories 
      : categories;
  }, [contractors, selectedContractor, categories]);

  // Sort categories: critical first, then by missing count
  const sortedCategories = useMemo(() => {
    return [...displayCategories].sort((a, b) => {
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      return b.missing - a.missing;
    });
  }, [displayCategories]);

  // Memoize category calculations
  const categoryCalculations = useMemo(() => {
    return sortedCategories.map(cat => {
      const total = cat.approved + cat.pending + cat.missing;
      const percentages = total === 0 
        ? { approved: 0, pending: 0, missing: 0 }
        : {
            approved: (cat.approved / total) * 100,
            pending: (cat.pending / total) * 100,
            missing: (cat.missing / total) * 100,
          };
      const completionRate = total === 0 ? 0 : (cat.approved / total) * 100;
      
      return {
        category: cat,
        total,
        percentages,
        completionRate: Math.round(completionRate),
      };
    });
  }, [sortedCategories]);

  // Categories to display (limited or all)
  const visibleCategories = showAllCategories 
    ? categoryCalculations 
    : categoryCalculations.slice(0, maxVisibleCategories);
  
  const hasMoreCategories = categoryCalculations.length > maxVisibleCategories;

  // Don't render if no categories
  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-400 hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">📂 Category Progress</h3>
        </div>
        <div className="flex items-center justify-center h-32 text-gray-500">
          <p className="text-xs">No category data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-400 hover:shadow-md transition-all">
      {/* Header - Compact */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">📂 Category Progress</h3>
      </div>

      {/* Contractor Tabs - Compact */}
      {contractors && contractors.length > 0 && (
        <div className="mb-3">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {/* All Contractors Option */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onContractorChange?.(undefined);
              }}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex-1 ${
                !selectedContractor || selectedContractor === undefined
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Tất cả
            </button>
            
            {/* Individual Contractors */}
            {contractors.map((contractor) => (
              <button
                key={contractor.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onContractorChange?.(contractor.id);
                }}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex-1 ${
                  selectedContractor === contractor.id
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {contractor.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories - Compact */}
      {categoryCalculations.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <div className="text-center">
            <p className="text-xs font-medium mb-1">No categories found</p>
            <p className="text-xs text-gray-400">Try selecting a different contractor</p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {visibleCategories.map((calc) => {
              const { category, total, percentages, completionRate } = calc;

              return (
                <div
                  key={category.id}
                  className={`space-y-1.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                    category.isCritical 
                      ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                      : selectedCategoryId === category.id
                      ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isDrillDownEnabled && onCategoryDrillDown) {
                      onCategoryDrillDown(category.id, selectedContractor);
                    } else {
                      onCategoryClick?.(category.id, selectedContractor);
                    }
                  }}
                >
                  {/* Category Name - Compact */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-gray-900 truncate">{category.name}</h4>
                      {category.isCritical && (
                        <span 
                          className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full cursor-help flex-shrink-0"
                          title={category.criticalReason || 'This category is critical for project completion'}
                        >
                          🚨
                        </span>
                      )}
                      {isDrillDownEnabled && (
                        <span 
                          className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex-shrink-0"
                          title="Click to view timeline details"
                        >
                          📊
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`text-xs font-semibold ${
                        completionRate >= 80 ? 'text-green-600' :
                        completionRate >= 60 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {completionRate}%
                      </span>
                      <span className="text-xs text-gray-500">({total})</span>
                    </div>
                  </div>

                  {/* Stacked Progress Bar - Compact */}
                  <div className="flex h-4 rounded overflow-hidden bg-gray-100">
                    {/* Approved Segment */}
                    {percentages.approved > 0 && (
                      <div
                        className="bg-green-500 transition-all"
                        style={{ width: `${percentages.approved}%` }}
                        title={`Approved: ${category.approved}`}
                      />
                    )}
                    {/* Pending Segment */}
                    {percentages.pending > 0 && (
                      <div
                        className="bg-amber-500 transition-all"
                        style={{ width: `${percentages.pending}%` }}
                        title={`Pending: ${category.pending}`}
                      />
                    )}
                    {/* Missing Segment */}
                    {percentages.missing > 0 && (
                      <div
                        className="bg-red-500 transition-all"
                        style={{ width: `${percentages.missing}%` }}
                        title={`Missing: ${category.missing}`}
                      />
                    )}
                  </div>

                  {/* Stats - Compact */}
                  <div className="flex gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span className="text-gray-600">{category.approved}✓</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      <span className="text-gray-600">{category.pending}⏳</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full" />
                      <span className="text-gray-600">{category.missing}✕</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show More/Less Button */}
          {hasMoreCategories && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllCategories(!showAllCategories);
                }}
                className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {showAllCategories 
                  ? `Show less (${maxVisibleCategories} categories)` 
                  : `Show all (${categoryCalculations.length} categories)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CategoryProgress;
