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
import { ChevronDown } from 'lucide-react';

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryData: CategoryTimelineData | null;
  onBackToOverview?: () => void;
}

/**
 * CategoryDetailModal v1.0
 * Unified category details modal with 3 tabs:
 * - Overview: Stats + progress ring
 * - Timeline: Interactive chart + analysis  
 * - Contractors: Detailed contractor breakdown
 */
export const CategoryDetailModal = memo<CategoryDetailModalProps>(({
  isOpen,
  onClose,
  categoryData,
  onBackToOverview,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'contractors'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [chartZoom, setChartZoom] = useState<{ start: number; end: number } | null>(null);
  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);
  const [isChartInteractive, setIsChartInteractive] = useState(true);
  const [expandedContractor, setExpandedContractor] = useState<string | null>(null);

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
    
    return measurePerformance('category-detail-chart-data', () => {
      return formatCategoryTimelineForChart(categoryData);
    });
  }, [categoryData, dataValidation.valid]);

  // Calculate summary
  const timelineSummary = useMemo(() => {
    if (!categoryData) {
      return { overallProgress: 0, onTrack: 0, needsAttention: 0 };
    }
    
    return measurePerformance('category-detail-summary', () => {
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
        type: 'category-detail-report',
      };
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `category-detail-${categoryData.categoryName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
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

  // Overview Tab Component
  const OverviewTab = () => {
    if (!categoryData) return <div>No data available</div>;

    const latestData = categoryData.timelineData[categoryData.timelineData.length - 1];
    const completion = latestData ? Math.round((latestData.approved / latestData.total) * 100) : 0;

    return (
      <div className="space-y-6">
        {/* Progress Ring */}
        <div className="text-center">
          <div className="w-32 h-32 mx-auto relative mb-4">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke={categoryData.categoryColor}
                strokeWidth="3"
                strokeDasharray={`${completion * 1.0044} 100.5`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-gray-900">{completion}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded text-center">
            <div className="text-2xl font-bold text-green-600">{latestData?.approved || 0}</div>
            <div className="text-xs text-green-700 font-semibold">Approved ✓</div>
          </div>
          <div className="p-3 bg-amber-50 rounded text-center">
            <div className="text-2xl font-bold text-amber-600">{latestData?.pending || 0}</div>
            <div className="text-xs text-amber-700 font-semibold">Pending ⏳</div>
          </div>
          <div className="p-3 bg-red-50 rounded text-center">
            <div className="text-2xl font-bold text-red-600">{latestData?.missing || 0}</div>
            <div className="text-xs text-red-700 font-semibold">Missing ❌</div>
          </div>
          <div className="p-3 bg-blue-50 rounded text-center">
            <div className="text-2xl font-bold text-blue-600">{latestData?.total || 0}</div>
            <div className="text-xs text-blue-700 font-semibold">Total 📊</div>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards summary={timelineSummary} />
      </div>
    );
  };

  // Timeline Tab Component
  const TimelineTab = () => {
    if (isLoading) {
      return <ChartSkeleton />;
    }

    if (error || !dataValidation.valid) {
      return (
        <ChartError 
          error={error || dataValidation.errors.join(', ')} 
          onRetry={handleRetry}
        />
      );
    }

    if (!categoryData) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Category Selected</h3>
          <p className="text-gray-500 mb-4">Please select a category to view its timeline details.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Chart Controls */}
        <ChartControls
          onZoomReset={handleZoomReset}
          onSelectionClear={handleSelectionClear}
          onExport={handleExport}
          isLoading={isLoading}
          hasSelection={selectedRange !== null}
        />

        {/* Interactive Toggle */}
        <div className="flex items-center gap-2">
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
      </div>
    );
  };

  // Contractors Tab Component
  const ContractorsTab = () => {
    if (!categoryData) return <div>No data available</div>;

    return (
      <div className="space-y-3">
        {categoryData.contractors.map((contractor) => {
          const isExpanded = expandedContractor === contractor.id;
          const latestProgress = contractor.progress[contractor.progress.length - 1] || 0;
          
          return (
            <div key={contractor.id} className="border border-gray-200 rounded">
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedContractor(isExpanded ? null : contractor.id)
                }
                className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="text-left flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">{contractor.name}</h4>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        latestProgress >= 80
                          ? 'bg-green-500'
                          : latestProgress >= 60
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${latestProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-900 w-8 text-right">
                    {latestProgress}%
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Details */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600">Latest Progress:</span>
                      <span className="ml-2 font-semibold">{latestProgress}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-2 font-semibold ${
                        latestProgress >= 80 ? 'text-green-600' :
                        latestProgress >= 60 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {latestProgress >= 80 ? 'On Track' :
                         latestProgress >= 60 ? 'In Progress' : 'Needs Attention'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Timeline */}
                  <div className="mt-3">
                    <div className="text-xs text-gray-600 mb-2">Progress over time:</div>
                    <div className="flex gap-1">
                      {contractor.progress.slice(-10).map((progress, idx) => (
                        <div
                          key={idx}
                          className={`h-2 flex-1 rounded ${
                            progress >= 80 ? 'bg-green-400' :
                            progress >= 60 ? 'bg-amber-400' : 'bg-red-400'
                          }`}
                          title={`Day ${contractor.progress.length - 10 + idx}: ${progress}%`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

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
            <p className="text-gray-500 mb-4">Please select a category to view its details.</p>
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
                📂 {categoryData.categoryName} - Details
              </h2>
              <p className="text-sm text-gray-600">
                Comprehensive category analysis and timeline tracking
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(['overview', 'timeline', 'contractors'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'timeline' && '📈 Timeline'}
              {tab === 'contractors' && '👥 Contractors'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="max-h-[500px] overflow-y-auto">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'timeline' && <TimelineTab />}
          {activeTab === 'contractors' && <ContractorsTab />}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-50 transition-colors"
          >
            📥 Export Report
          </button>
        </div>
      </div>

      {/* Export Loading Overlay */}
      <ExportLoading isVisible={isExporting} />
    </ModalContainer>
  );
});

CategoryDetailModal.displayName = 'CategoryDetailModal';

export default CategoryDetailModal;
