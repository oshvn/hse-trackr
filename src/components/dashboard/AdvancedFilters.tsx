import React, { useState } from 'react';
import { Calendar, Filter, X } from 'lucide-react';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface MetricFilter {
  completion: boolean;
  quality: boolean;
  compliance: boolean;
  timeline: boolean;
  response: boolean;
}

export interface AdvancedFiltersProps {
  dateRange?: DateRange;
  selectedMetrics?: string[];
  onDateRangeChange?: (range: DateRange) => void;
  onMetricsChange?: (metrics: string[]) => void;
  onReset?: () => void;
  showMetricsFilter?: boolean;
}

/**
 * AdvancedFilters v2.0
 * Advanced filtering component for date ranges and metrics selection
 * 
 * Features:
 * - Date range picker
 * - Metrics selection
 * - Quick preset filters
 * - Reset functionality
 */
export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  dateRange: initialDateRange,
  selectedMetrics: initialMetrics = [],
  onDateRangeChange,
  onMetricsChange,
  onReset,
  showMetricsFilter = true,
}) => {
  const [dateRange, setDateRange] = useState<DateRange>(
    initialDateRange || { startDate: null, endDate: null }
  );
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(initialMetrics);
  const [isOpen, setIsOpen] = useState(false);

  const availableMetrics = [
    { key: 'completion', label: 'Completion Rate', icon: '📊' },
    { key: 'quality', label: 'Quality Score', icon: '⭐' },
    { key: 'compliance', label: 'Compliance', icon: '✅' },
    { key: 'timeline', label: 'Timeline Adherence', icon: '⏰' },
    { key: 'response', label: 'Response Time', icon: '⚡' },
  ];

  // Quick preset filters
  const presetRanges = [
    {
      label: 'Last 7 Days',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    },
    {
      label: 'Last 30 Days',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    },
    {
      label: 'Last 90 Days',
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    },
    {
      label: 'This Month',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(),
    },
    {
      label: 'Last Month',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
    },
  ];

  const handleDateRangePreset = (preset: typeof presetRanges[0]) => {
    const newRange = {
      startDate: preset.startDate,
      endDate: preset.endDate,
    };
    setDateRange(newRange);
    onDateRangeChange?.(newRange);
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const date = value ? new Date(value) : null;
    const newRange = {
      ...dateRange,
      [type === 'start' ? 'startDate' : 'endDate']: date,
    };
    setDateRange(newRange);
    onDateRangeChange?.(newRange);
  };

  const handleMetricToggle = (metricKey: string) => {
    const newMetrics = selectedMetrics.includes(metricKey)
      ? selectedMetrics.filter(m => m !== metricKey)
      : [...selectedMetrics, metricKey];
    setSelectedMetrics(newMetrics);
    onMetricsChange?.(newMetrics);
  };

  const handleReset = () => {
    setDateRange({ startDate: null, endDate: null });
    setSelectedMetrics([]);
    onReset?.();
    setIsOpen(false);
  };

  const hasActiveFilters = dateRange.startDate || dateRange.endDate || selectedMetrics.length > 0;

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
          hasActiveFilters
            ? 'bg-blue-50 border-blue-300 text-blue-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filters</span>
        {hasActiveFilters && (
          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
            {[
              dateRange.startDate && 'Date',
              selectedMetrics.length > 0 && `Metrics (${selectedMetrics.length})`,
            ].filter(Boolean).length}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Advanced Filters</h3>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Reset
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Date Range */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-700 mb-2 block">
                <Calendar className="w-3 h-3 inline mr-1" />
                Date Range
              </label>
              
              {/* Preset Ranges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {presetRanges.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleDateRangePreset(preset)}
                    className={`px-2 py-1 text-xs rounded border transition-all ${
                      dateRange.startDate?.getTime() === preset.startDate.getTime() &&
                      dateRange.endDate?.getTime() === preset.endDate.getTime()
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Metrics Selection */}
            {showMetricsFilter && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-700 mb-2 block">
                  Metrics
                </label>
                <div className="space-y-2">
                  {availableMetrics.map((metric) => (
                    <label
                      key={metric.key}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(metric.key)}
                        onChange={() => handleMetricToggle(metric.key)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700">
                        <span className="mr-1">{metric.icon}</span>
                        {metric.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {dateRange.startDate && dateRange.endDate && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
                    </span>
                  )}
                  {selectedMetrics.map((metric) => {
                    const metricLabel = availableMetrics.find(m => m.key === metric)?.label;
                    return (
                      <span
                        key={metric}
                        className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded"
                      >
                        {metricLabel}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdvancedFilters;
