import React, { useMemo, useCallback, memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { measurePerformance } from '@/lib/performanceOptimization';
import { getCachedContractorTimeline } from '@/lib/chartPerformance';

export interface ContractorTimelineData {
  id: string;
  name: string;
  color: string;
  expectedProgress: number[];
  actualProgress: number[];
}

export interface CategoryTimelineData {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  timelineData: Array<{
    day: string;
    approved: number;
    pending: number;
    missing: number;
    total: number;
  }>;
  contractors: Array<{
    id: string;
    name: string;
    color: string;
    progress: number[];
  }>;
}

export interface TimelineProps {
  days?: number;
  expectedProgress?: number[];
  actualProgress?: number[];
  contractors?: ContractorTimelineData[];
  categoryData?: CategoryTimelineData | null;
  showContractorBreakdown?: boolean;
  selectedContractors?: string[];
  onContractorToggle?: (contractorId: string) => void;
  onCardClick?: () => void;
  onBackToOverview?: () => void;
}

/**
 * MiniTimeline v2.1 - Optimized
 * 30-day progress overview with contractor breakdown
 * 
 * Optimizations:
 * - Memoized component with React.memo
 * - Cached data generation
 * - Performance monitoring
 * - Optimized event handlers
 * 
 * Shows:
 * - Expected vs Actual progress (if no contractors)
 * - Contractor-specific progress lines (if contractors provided)
 */
export const MiniTimeline = memo<TimelineProps>(({
  days = 30,
  expectedProgress,
  actualProgress,
  contractors,
  categoryData,
  showContractorBreakdown = false,
  selectedContractors,
  onContractorToggle,
  onCardClick,
  onBackToOverview,
}) => {
  // Determine display mode: category-specific, contractor, or global
  const useCategoryMode = categoryData !== null && categoryData !== undefined;
  const useContractorMode = !useCategoryMode && showContractorBreakdown && contractors && contractors.length > 0;
  const displayContractors = useContractorMode 
    ? contractors.filter(c => !selectedContractors || selectedContractors.includes(c.id))
    : [];

  // Generate timeline data with performance monitoring and caching
  const timelineData = useMemo(() => {
    return measurePerformance('timeline-data-generation', () => {
      // Use category data if available
      if (useCategoryMode && categoryData) {
        return categoryData.timelineData.map((dayData, index) => {
          const chartData: any = {
            day: dayData.day,
            approved: dayData.approved,
            pending: dayData.pending,
            missing: dayData.missing,
            total: dayData.total,
            completionRate: dayData.total > 0 ? Math.round((dayData.approved / dayData.total) * 100) : 0,
          };

          // Add contractor progress lines
          categoryData.contractors.forEach(contractor => {
            chartData[`${contractor.name} Progress`] = contractor.progress[index] || 0;
          });

          return chartData;
        });
      }

      // Original logic for contractor and global modes
      const data = [];
      
      for (let i = 0; i <= days; i++) {
        const dayLabel = i === 0 ? '0d ago' : i === days ? 'Today' : `${i}d`;
        const dataPoint: any = { day: dayLabel };

        if (useContractorMode && displayContractors.length > 0) {
          // Contractor-specific mode
          displayContractors.forEach((contractor) => {
            const expected = contractor.expectedProgress[i] ?? (i / days) * 100;
            const actual = contractor.actualProgress[i] ?? expected * 0.9;
            
            dataPoint[`${contractor.name} Expected`] = Math.round(expected);
            dataPoint[`${contractor.name} Actual`] = Math.round(actual);
          });
        } else {
          // Global mode
          const expected = expectedProgress?.[i] ?? (i / days) * 100;
          let actual = actualProgress?.[i] ?? (i / days) * 90;
          if (i > days * 0.7) {
            actual = Math.min(100, (i / days) * 100 - 5);
          }
          
          dataPoint.expected = Math.round(expected);
          dataPoint.actual = Math.round(actual);
        }

        data.push(dataPoint);
      }
      return data;
    });
  }, [days, expectedProgress, actualProgress, useContractorMode, displayContractors, useCategoryMode, categoryData]);

  // Memoize contractor toggle handler
  const handleContractorToggle = useCallback((contractorId: string) => {
    onContractorToggle?.(contractorId);
  }, [onContractorToggle]);

  // Memoize card click handler
  const handleCardClick = useCallback(() => {
    onCardClick?.();
  }, [onCardClick]);

  // Memoize keyboard handler
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  }, [handleCardClick]);

  return (
    <div
        className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-400 hover:shadow-md cursor-pointer transition-all flex flex-col h-full min-h-[350px]"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyPress={handleKeyPress}
      aria-label="30-Day Progress Chart - Click to view detailed timeline"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-700">
            {useCategoryMode ? `📂 ${categoryData?.categoryName} - Timeline` : '📅 30-Day Progress'}
          </h3>
          {useCategoryMode && categoryData && (
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: categoryData.categoryColor }}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {useCategoryMode && onBackToOverview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBackToOverview();
              }}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
              title="Back to overview"
            >
              ← Back
            </button>
          )}
          <span className="text-xl">{useCategoryMode ? '📊' : '📈'}</span>
        </div>
      </div>

      {/* Contractor Toggle (if contractor mode or category mode) */}
      {(useContractorMode || useCategoryMode) && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {useCategoryMode && categoryData ? (
              // Category mode - show contractors for this category
              categoryData.contractors.map((contractor) => (
                <div
                  key={contractor.id}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                >
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: contractor.color }}
                    />
                    {contractor.name}
                  </div>
                </div>
              ))
            ) : useContractorMode && contractors ? (
              // Contractor mode - show toggleable contractors
              contractors.map((contractor) => {
                const isSelected = !selectedContractors || selectedContractors.includes(contractor.id);
                return (
                  <button
                    key={contractor.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContractorToggle(contractor.id);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: contractor.color }}
                      />
                      {contractor.name}
                    </div>
                  </button>
                );
              })
            ) : null}
          </div>
        </div>
      )}

      {/* Timeline Chart */}
      <div className="flex-1 min-h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timelineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
            />
            <Tooltip
              formatter={(value) => `${value}%`}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            
            {useCategoryMode && categoryData ? (
              // Category-specific lines
              <>
                <Line
                  type="monotone"
                  dataKey="approved"
                  name="Approved"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  name="Pending"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="missing"
                  name="Missing"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                {categoryData.contractors.map((contractor) => (
                  <Line
                    key={contractor.id}
                    type="monotone"
                    dataKey={`${contractor.name} Progress`}
                    name={`${contractor.name} Progress`}
                    stroke={contractor.color}
                    strokeDasharray="3 3"
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </>
            ) : useContractorMode && displayContractors.length > 0 ? (
              // Contractor-specific lines
              <>
                {displayContractors.map((contractor) => (
                  <React.Fragment key={contractor.id}>
                    <Line
                      type="monotone"
                      dataKey={`${contractor.name} Expected`}
                      name={`${contractor.name} Expected`}
                      stroke={contractor.color}
                      strokeDasharray="5 5"
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey={`${contractor.name} Actual`}
                      name={`${contractor.name} Actual`}
                      stroke={contractor.color}
                      dot={false}
                      strokeWidth={2}
                    />
                  </React.Fragment>
                ))}
              </>
            ) : (
              // Global lines
              <>
                <Line
                  type="monotone"
                  dataKey="expected"
                  name="Expected"
                  stroke="#3b82f6"
                  strokeDasharray="5 5"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="#10b981"
                  dot={false}
                  strokeWidth={2}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Info */}
      <div className="mt-4 flex justify-between text-xs text-gray-600">
        {useCategoryMode && categoryData ? (
          <>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Approved</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Missing</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" style={{ borderStyle: 'dashed' }} />
              <span>Expected (30d)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Actual Progress</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

// Set display name for debugging
MiniTimeline.displayName = 'MiniTimeline';

export default MiniTimeline;
