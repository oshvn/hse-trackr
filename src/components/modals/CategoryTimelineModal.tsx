import React, { useState, useMemo, useCallback, memo } from 'react';
import { ModalContainer } from './ModalContainer';
import { CategoryTimelineData } from '@/hooks/useDashboardIntegration';
import { 
  formatCategoryTimelineForChart, 
  calculateCategoryTimelineSummary 
} from '@/lib/categoryTimelineUtils';
import { InteractiveChart } from './InteractiveChart';
import { ChartSkeleton, ChartError, ChartControls, SummaryCards, ExportLoading } from './TimelineModalComponents';
import { measurePerformance } from '@/lib/performanceOptimization';

interface CategoryTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryData: CategoryTimelineData | null;
  onBackToOverview?: () => void;
}

/**
 * CategoryTimelineModal v1.0
 * Detailed view for category-specific timeline analysis
 * 
 * Features:
 * - Full category details and progress
 * - Interactive timeline chart for category
 * - Contractor comparison for this category
 * - Export category-specific report
 * - Drill-down navigation
 */
export const CategoryTimelineModal = memo<CategoryTimelineModalProps>(({
  isOpen,
  onClose,
  categoryData,
  onBackToOverview,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [chartZoom, setChartZoom] = useState<{ start: number; end: number } | null>(null);
  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);
  const [isChartInteractive, setIsChartInteractive] = useState(true);

  // Validate category data
  const dataValidation = useMemo(() => {
    if (!categoryData) {
      return { valid: false, errors: ['No category data provided'] };
    }
    
    const errors: string[] = [];
    if (!categoryData.timelineData || categoryData.timelineData.length === 0) {
      errors.push('No timeline data available');
    }
    if (!categoryData.contractors || categoryData.contractors.length === 0) {
      errors.push('No contractor data available');
    }
    
    return { valid: errors.length === 0, errors };
  }, [categoryData]);

  // Generate chart data
  const chartData = useMemo(() => {
    if (!categoryData || !dataValidation.valid) return [];
    
    return measurePerformance('category-timeline-chart-data', () => {
      return formatCategoryTimelineForChart(categoryData);
    });
  }, [categoryData, dataValidation.valid]);

  // Calculate summary
  const timelineSummary = useMemo(() => {
    if (!categoryData) {
      return { overallProgress: 0, onTrack: 0, needsAttention: 0 };
    }
    
    return measurePerformance('category-timeline-summary', () => {
      return calculateCategoryTimelineSummary(categoryData);
    });
  }, [categoryData]);

  // Chart configuration
  const chartConfig = useMemo(() => {
    return {
      height: 400,
      tickInterval: Math.max(1, Math.floor(chartData.length / 10)),
    };
  }, [chartData.length]);

  // Event handlers
  const handleExport = useCallback(async () => {
    if (!categoryData) return;
    
    setIsExporting(true);
    try {
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const exportData = {
        category: categoryData,
        chartData,
        summary: timelineSummary,
        timestamp: new Date().toISOString(),
        type: 'category-timeline-report',
      };
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `category-timeline-${categoryData.categoryName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [categoryData, chartData, timelineSummary]);

  const handleZoomReset = useCallback(() => {
    setChartZoom(null);
    setSelectedRange(null);
  }, []);

  const handleSelectionClear = useCallback(() => {
    setSelectedRange(null);
  }, []);

  const handleZoomChange = useCallback((range: { start: number; end: number }) => {
    setChartZoom(range);
  }, []);

  const handleSelectionChange = useCallback((range: [number, number] | null) => {
    setSelectedRange(range);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  const handleBackClick = useCallback(() => {
    onBackToOverview?.();
  }, [onBackToOverview]);

  // Loading state
  if (isLoading) {
    return (
      <ModalContainer isOpen={isOpen} onClose={onClose} size="xl">
        <div className="p-6">
          <ChartSkeleton />
        </div>
      </ModalContainer>
    );
  }

  // Error state
  if (error || !dataValidation.valid) {
    return (
      <ModalContainer isOpen={isOpen} onClose={onClose} size="xl">
        <div className="p-6">
          <ChartError 
            error={error || dataValidation.errors.join(', ')} 
            onRetry={handleRetry}
          />
        </div>
      </ModalContainer>
    );
  }

  // No data state
  if (!categoryData) {
    return (
      <ModalContainer isOpen={isOpen} onClose={onClose} size="xl">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Category Selected</h3>
            <p className="text-gray-500 mb-4">Please select a category to view its timeline details.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      </ModalContainer>
    );
  }

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: categoryData.categoryColor }}
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                📂 {categoryData.categoryName} - Timeline Analysis
              </h2>
              <p className="text-sm text-gray-600">
                Detailed progress tracking over time
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onBackToOverview && (
              <button
                onClick={handleBackClick}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                ← Back to Overview
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Chart Controls */}
        <ChartControls
          onZoomReset={handleZoomReset}
          onSelectionClear={handleSelectionClear}
          onExport={handleExport}
          isLoading={isLoading}
          hasSelection={selectedRange !== null}
        />

        {/* Interactive Toggle */}
        <div className="mb-4 flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isChartInteractive}
              onChange={(e) => setIsChartInteractive(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Interactive Chart</span>
          </label>
        </div>

        {/* Chart */}
        <div className="mb-6">
          {isChartInteractive ? (
            <InteractiveChart
              data={chartData}
              contractors={categoryData.contractors.map(c => ({
                id: c.id,
                name: c.name,
                color: c.color,
              }))}
              height={chartConfig.height}
              onSelectionChange={handleSelectionChange}
              selectedRange={selectedRange}
              zoomRange={chartZoom}
              onZoomChange={handleZoomChange}
              isLoading={isLoading}
              error={error}
            />
          ) : (
            <div className="h-96 w-full bg-gray-50 rounded flex items-center justify-center">
              <p className="text-gray-500">Static chart view (interactive mode disabled)</p>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <SummaryCards summary={timelineSummary} />

        {/* Category Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Current Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completion Rate:</span>
                <span className="font-semibold text-blue-600">{timelineSummary.overallProgress}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Contractors On Track:</span>
                <span className="font-semibold text-green-600">{timelineSummary.onTrack}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Needs Attention:</span>
                <span className="font-semibold text-amber-600">{timelineSummary.needsAttention}</span>
              </div>
            </div>
          </div>

          {/* Contractor Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Contractor Performance</h4>
            <div className="space-y-2">
              {categoryData.contractors.map((contractor) => {
                const latestProgress = contractor.progress[contractor.progress.length - 1] || 0;
                return (
                  <div key={contractor.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: contractor.color }}
                      />
                      <span className="text-sm text-gray-700">{contractor.name}</span>
                    </div>
                    <span className={`text-sm font-semibold ${
                      latestProgress >= 80 ? 'text-green-600' :
                      latestProgress >= 60 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {latestProgress}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Export Loading Overlay */}
      <ExportLoading isVisible={isExporting} />
    </ModalContainer>
  );
});

CategoryTimelineModal.displayName = 'CategoryTimelineModal';

export default CategoryTimelineModal;
