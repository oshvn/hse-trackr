import React from 'react';
import { useDashboardIntegration, UseDashboardIntegrationReturn } from '@/hooks/useDashboardIntegration';

interface DashboardIntegrationControlsProps {
  integration: UseDashboardIntegrationReturn;
  className?: string;
}

/**
 * DashboardIntegrationControls v1.0
 * Control panel for Category-Timeline integration
 * 
 * Features:
 * - Toggle sync mode on/off
 * - Visual indicator of active integration
 * - Reset button to clear selections
 * - Integration status display
 */
export const DashboardIntegrationControls: React.FC<DashboardIntegrationControlsProps> = ({
  integration,
  className = '',
}) => {
  const {
    integrationState,
    setSyncMode,
    resetIntegration,
    isIntegrationActive,
    shouldSyncTimeline,
  } = integration;

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-blue-900">Integration Controls</h3>
        </div>
        
        {/* Status Indicator */}
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isIntegrationActive 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {isIntegrationActive ? '🟢 Active' : '⚪ Inactive'}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sync Mode Toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={integrationState.syncMode}
              onChange={(e) => setSyncMode(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm font-medium text-gray-700">
              Sync Contractor Selection
            </span>
          </label>
          {shouldSyncTimeline && (
            <div className="w-2 h-2 rounded-full bg-green-500" title="Sync Active" />
          )}
        </div>

        {/* Drill-down Status */}
        {integrationState.isDrillDownActive && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
            <span className="text-xs font-medium text-blue-700">
              📂 {integrationState.selectedCategory ? 'Category View' : 'Overview'}
            </span>
            {integrationState.selectedContractor && (
              <span className="text-xs text-blue-600">
                • {integrationState.selectedContractor}
              </span>
            )}
          </div>
        )}

        {/* Reset Button */}
        <button
          onClick={resetIntegration}
          className="ml-auto px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:text-gray-800 transition-colors"
          title="Reset all selections and integration state"
        >
          🔄 Reset
        </button>
      </div>

      {/* Integration Info */}
      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="text-xs text-blue-600">
          <div className="flex items-center gap-4">
            <span>
              💡 Click category to drill down to timeline view
            </span>
            {integrationState.syncMode && (
              <span>
                🔗 Contractor selection syncs between charts
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardIntegrationControls;
