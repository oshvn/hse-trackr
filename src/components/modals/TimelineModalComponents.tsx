/**
 * Timeline Modal UI Components
 * - Loading states
 * - Error boundaries
 * - Chart controls
 * - Accessibility components
 */

import React from 'react';
import { Loader2, AlertCircle, RefreshCw, Download, ZoomIn, ZoomOut } from 'lucide-react';

// Loading skeleton for chart
export const ChartSkeleton: React.FC = () => (
  <div className="h-96 w-full bg-gray-100 rounded animate-pulse flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      <div className="text-gray-500 text-sm">Loading chart data...</div>
    </div>
  </div>
);

// Error state component
interface ChartErrorProps {
  error: string;
  onRetry?: () => void;
}

export const ChartError: React.FC<ChartErrorProps> = ({ error, onRetry }) => (
  <div className="h-96 w-full bg-red-50 rounded flex items-center justify-center">
    <div className="text-center max-w-md">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <div className="text-red-600 text-lg font-semibold mb-2">Chart Error</div>
      <div className="text-red-500 text-sm mb-4">{error}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  </div>
);

// Chart controls component
interface ChartControlsProps {
  onZoomReset: () => void;
  onSelectionClear: () => void;
  onExport: () => void;
  isLoading?: boolean;
  hasSelection?: boolean;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
  onZoomReset,
  onSelectionClear,
  onExport,
  isLoading = false,
  hasSelection = false
}) => (
  <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded">
    <button
      onClick={onZoomReset}
      disabled={isLoading}
      className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
    >
      <ZoomOut className="w-3 h-3" />
      Reset Zoom
    </button>
    
    {hasSelection && (
      <button
        onClick={onSelectionClear}
        disabled={isLoading}
        className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
      >
        Clear Selection
      </button>
    )}
    
    <div className="ml-auto">
      <button
        onClick={onExport}
        disabled={isLoading}
        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
      >
        <Download className="w-3 h-3" />
        Export PDF
      </button>
    </div>
  </div>
);

// Data table for accessibility
interface ChartDataTableProps {
  chartData: any[];
  contractors: Array<{ id: string; name: string }>;
  className?: string;
}

export const ChartDataTable: React.FC<ChartDataTableProps> = ({ 
  chartData, 
  contractors, 
  className = "sr-only" 
}) => (
  <div className={className}>
    <h4 className="text-lg font-semibold mb-4">Timeline Data Table</h4>
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-2 text-left">Day</th>
            {contractors.map(contractor => (
              <React.Fragment key={contractor.id}>
                <th className="border border-gray-300 px-3 py-2 text-center">
                  {contractor.name} Expected
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center">
                  {contractor.name} Actual
                </th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {chartData.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-3 py-2 font-medium">
                {row.day}
              </td>
              {contractors.map(contractor => (
                <React.Fragment key={contractor.id}>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {row[`${contractor.name} Expected`] || 0}%
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {row[`${contractor.name} Actual`] || 0}%
                  </td>
                </React.Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Summary cards component
interface SummaryCardsProps {
  summary: {
    overallProgress: number;
    onTrack: number;
    needsAttention: number;
    totalContractors: number;
  };
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="bg-blue-50 rounded-lg p-4">
      <h5 className="text-sm font-semibold text-blue-700 mb-2">📊 Overall Progress</h5>
      <p className="text-2xl font-bold text-blue-900">{summary.overallProgress}%</p>
      <p className="text-xs text-blue-600 mt-1">Average completion</p>
    </div>
    
    <div className="bg-green-50 rounded-lg p-4">
      <h5 className="text-sm font-semibold text-green-700 mb-2">🎯 On Track</h5>
      <p className="text-2xl font-bold text-green-900">{summary.onTrack}</p>
      <p className="text-xs text-green-600 mt-1">
        {summary.totalContractors > 0 
          ? `${Math.round((summary.onTrack / summary.totalContractors) * 100)}% of contractors`
          : 'Contractors meeting targets'
        }
      </p>
    </div>
    
    <div className="bg-amber-50 rounded-lg p-4">
      <h5 className="text-sm font-semibold text-amber-700 mb-2">⚠️ Needs Attention</h5>
      <p className="text-2xl font-bold text-amber-900">{summary.needsAttention}</p>
      <p className="text-xs text-amber-600 mt-1">
        {summary.totalContractors > 0 
          ? `${Math.round((summary.needsAttention / summary.totalContractors) * 100)}% of contractors`
          : 'Contractors below 60%'
        }
      </p>
    </div>
  </div>
);

// Loading overlay for export
interface ExportLoadingProps {
  isVisible: boolean;
}

export const ExportLoading: React.FC<ExportLoadingProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 flex items-center gap-3">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <span className="text-gray-700">Generating PDF export...</span>
      </div>
    </div>
  );
};
