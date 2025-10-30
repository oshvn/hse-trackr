import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { ModalContainer } from './ModalContainer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { measurePerformance } from '@/lib/performanceOptimization';
import { generateTimelineChartData } from '@/lib/chartPerformance';
import { 
  validateContractorData, 
  generateColorMap, 
  calculateTimelineSummary,
  prepareExportData,
  createTimelineError,
  getChartConfig,
  type ExportData
} from '@/lib/timelineUtils';
import {
  ChartSkeleton,
  ChartError,
  ChartControls,
  ChartDataTable,
  SummaryCards,
  ExportLoading
} from './TimelineModalComponents';
import { InteractiveChart } from './InteractiveChart';

export interface ContractorTimelineData {
  id: string;
  name: string;
  color: string;
  expectedProgress: number[];
  actualProgress: number[];
}

export interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractors?: ContractorTimelineData[];
  selectedContractors?: string[];
  onContractorToggle?: (contractorId: string) => void;
  onExport?: () => void;
}

/**
 * TimelineModal v2.1 - Enhanced
 * Full project timeline with interactive chart visualization
 * 
 * Features:
 * - Interactive line charts for progress tracking
 * - View modes (Day/Week/Month)
 * - Contractor filtering and selection
 * - Real-time data integration
 * - Performance optimized rendering
 */
export const TimelineModal = memo<TimelineModalProps>(({
  isOpen,
  onClose,
  contractors = [],
  selectedContractors = [],
  onContractorToggle,
  onExport,
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [filterContractor, setFilterContractor] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [chartZoom, setChartZoom] = useState({ start: 0, end: 100 });
  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);
  const [isChartInteractive, setIsChartInteractive] = useState(true);

  // Data validation
  const dataValidation = useMemo(() => {
    return validateContractorData(contractors);
  }, [contractors]);

  // Memoize color map for performance
  const contractorColors = useMemo(() => {
    return generateColorMap(contractors);
  }, [contractors]);

  // Memoize filtered contractors
  const filteredContractors = useMemo(() => {
    if (filterContractor === 'all') return contractors;
    return contractors.filter(c => c.id === filterContractor);
  }, [contractors, filterContractor]);

  // Memoize chart data with performance monitoring and error handling
  const chartData = useMemo(() => {
    if (!dataValidation.valid) {
      setError(`Data validation failed: ${dataValidation.errors.join(', ')}`);
      return [];
    }
    
    try {
      return measurePerformance('timeline-modal-chart-data', () => {
        return generateTimelineChartData(filteredContractors, viewMode);
      });
    } catch (err) {
      setError('Failed to generate chart data');
      return [];
    }
  }, [filteredContractors, viewMode, dataValidation]);

  // Memoize timeline summary
  const timelineSummary = useMemo(() => {
    return calculateTimelineSummary(filteredContractors);
  }, [filteredContractors]);

  // Chart configuration
  const chartConfig = useMemo(() => {
    return getChartConfig(viewMode);
  }, [viewMode]);

  // Memoize contractor toggle handler
  const handleContractorToggle = useCallback((contractorId: string) => {
    onContractorToggle?.(contractorId);
  }, [onContractorToggle]);

  // Memoize view mode change handler
  const handleViewModeChange = useCallback((mode: 'day' | 'week' | 'month') => {
    setViewMode(mode);
  }, []);

  // Memoize contractor filter change handler
  const handleContractorFilterChange = useCallback((contractorId: string) => {
    setFilterContractor(contractorId);
  }, []);

  // Enhanced export handler with loading state
  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      setError(null);
      
      const exportData = prepareExportData(chartData, filteredContractors, viewMode);
      
      // Call the original export handler
      onExport?.();
      
      // Simulate export process (replace with actual export logic)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Export data prepared:', exportData);
      
    } catch (err) {
      setError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [chartData, filteredContractors, viewMode, onExport]);

  // Chart control handlers
  const handleZoomReset = useCallback(() => {
    setChartZoom({ start: 0, end: 100 });
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
    setIsLoading(true);
    // Simulate retry
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  // Reset error when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const footer = (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        className="flex-1 px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition-colors"
      >
        📥 Export Timeline (PDF)
      </button>
      <button
        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-50 transition-colors"
      >
        🖨️ Print View
      </button>
    </div>
  );

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title="📅 Full Project Timeline"
      size="xl"
      footer={footer}
    >
      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded">
        {/* View Mode */}
        <div className="flex gap-2" role="group" aria-label="Timeline view mode">
          {['day', 'week', 'month'].map((mode) => (
            <button
              key={mode}
              onClick={() => handleViewModeChange(mode as 'day' | 'week' | 'month')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                viewMode === mode
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
              aria-pressed={viewMode === mode}
              aria-label={`Switch to ${mode} view`}
            >
              {mode === 'day' ? '📅 Day' : mode === 'week' ? '📅 Week' : '📅 Month'} View
            </button>
          ))}
        </div>

        {/* Chart Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsChartInteractive(!isChartInteractive)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              isChartInteractive
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
            aria-pressed={isChartInteractive}
            aria-label={`${isChartInteractive ? 'Disable' : 'Enable'} interactive chart mode`}
          >
            {isChartInteractive ? '🎯 Interactive' : '📊 Static'} Mode
          </button>
        </div>

        {/* Contractor Filter */}
        <div className="flex gap-2 ml-auto">
          <label htmlFor="contractor-filter" className="sr-only">
            Filter contractors
          </label>
          <select 
            id="contractor-filter"
            value={filterContractor}
            onChange={(e) => handleContractorFilterChange(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-xs font-semibold bg-white"
            aria-label="Filter contractors"
          >
            <option value="all">All Contractors</option>
            {contractors.map((contractor) => (
              <option key={contractor.id} value={contractor.id}>
                {contractor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Controls */}
      <ChartControls
        onZoomReset={handleZoomReset}
        onSelectionClear={handleSelectionClear}
        onExport={handleExport}
        isLoading={isLoading || isExporting}
        hasSelection={selectedRange !== null}
      />

      {/* Interactive Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress Timeline</h3>
          <p className="text-sm text-gray-600">
            Showing {viewMode} view for {filterContractor === 'all' ? 'all contractors' : contractors.find(c => c.id === filterContractor)?.name}
          </p>
        </div>
        
        {/* Chart Content */}
        <div className="w-full">
          {isLoading ? (
            <ChartSkeleton />
          ) : error ? (
            <ChartError error={error} onRetry={handleRetry} />
          ) : (
            <>
              {isChartInteractive ? (
                <InteractiveChart
                  data={chartData}
                  contractors={filteredContractors.map(c => ({
                    id: c.id,
                    name: c.name,
                    color: contractorColors[c.id]
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
                <div style={{ height: `${chartConfig.height}px` }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                        interval={chartConfig.tickInterval}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                        label={{ value: 'Progress (%)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${value}%`, name]}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        accessibility={{
                          enabled: true,
                          description: 'Timeline chart data point'
                        }}
                      />
                      <Legend />
                      
                      {filteredContractors.map((contractor) => {
                        const color = contractorColors[contractor.id];
                        
                        return (
                          <React.Fragment key={contractor.id}>
                            <Line
                              type="monotone"
                              dataKey={`${contractor.name} Expected`}
                              name={`${contractor.name} Expected`}
                              stroke={color}
                              strokeDasharray="5 5"
                              strokeWidth={2}
                              dot={false}
                            />
                            <Line
                              type="monotone"
                              dataKey={`${contractor.name} Actual`}
                              name={`${contractor.name} Actual`}
                              stroke={color}
                              strokeWidth={3}
                              dot={{ r: 4 }}
                            />
                          </React.Fragment>
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {/* Accessibility: Data Table */}
              <ChartDataTable 
                chartData={chartData} 
                contractors={filteredContractors}
              />
            </>
          )}
        </div>
      </div>

      {/* Contractor Selection */}
      {contractors.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Contractor Selection</h4>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Contractor selection">
            {contractors.map((contractor) => {
              const color = contractorColors[contractor.id];
              const isSelected = selectedContractors.includes(contractor.id);
              
              return (
                <button
                  key={contractor.id}
                  onClick={() => handleContractorToggle(contractor.id)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-2 border-transparent'
                  }`}
                  style={isSelected ? { backgroundColor: color } : {}}
                  aria-pressed={isSelected}
                  aria-label={`${isSelected ? 'Deselect' : 'Select'} ${contractor.name} contractor`}
                >
                  {isSelected && <span aria-hidden="true">✓</span>}
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  {contractor.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline Summary */}
      <SummaryCards summary={timelineSummary} />

      {/* Export Loading Overlay */}
      <ExportLoading isVisible={isExporting} />
    </ModalContainer>
  );
});

// Set display name for debugging
TimelineModal.displayName = 'TimelineModal';

export default TimelineModal;