import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface AlertBannerProps {
  criticalCount: number;
  blockingCount: number;
  onViewAll: () => void;
  onTakeAction: () => void;
  onDismiss?: () => void;
}

/**
 * AlertBanner v2.0
 * Sticky banner at top showing critical alerts
 * 
 * Features:
 * - Sticky positioning (top: 0, z-index: 100)
 * - Pulsing animation on icon
 * - Gradient red background
 * - Responsive: stacks on mobile
 * - Smooth hide animation
 */
export const AlertBanner: React.FC<AlertBannerProps> = ({
  criticalCount,
  blockingCount,
  onViewAll,
  onTakeAction,
  onDismiss,
}) => {
  return (
    <div
      className="sticky top-0 z-100 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-600 px-4 sm:px-6 lg:px-8 py-3 shadow-md"
      role="alert"
      aria-live="assertive"
      aria-label={`${criticalCount} critical alerts requiring attention`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left: Icon + Text */}
        <div className="flex items-center gap-3 flex-1">
          <div
            className="animate-pulse flex items-center justify-center"
            aria-hidden="true"
          >
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="font-bold text-sm sm:text-base text-red-700">
              🚨 CRITICAL: {criticalCount} Red Cards Blocking
            </div>
            <div className="text-xs sm:text-sm text-red-600">
              {blockingCount} Blocking | {criticalCount - blockingCount} Overdue/Missing
            </div>
          </div>
        </div>

        {/* Right: Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onViewAll}
            className="flex-1 sm:flex-initial px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white text-xs sm:text-sm font-semibold rounded-md hover:bg-red-700 transition-colors"
            aria-label="View all critical alerts"
          >
            View All
          </button>
          <button
            onClick={onTakeAction}
            className="flex-1 sm:flex-initial px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-red-600 border border-red-600 text-xs sm:text-sm font-semibold rounded-md hover:bg-red-50 transition-colors"
            aria-label="Take recommended action"
          >
            Take Action
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 text-red-600 hover:bg-red-200 rounded transition-colors"
              aria-label="Dismiss alert banner"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertBanner;
