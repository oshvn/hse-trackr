import React, { useState } from 'react';
import { AlertBanner } from './AlertBanner';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  alertCounts?: {
    critical: number;
    blocking: number;
    overdue: number;
    missing: number;
  };
  onAlertBannerAction?: (action: 'view-all' | 'take-action') => void;
}

/**
 * DashboardLayout v2.0
 * Main container component with 12-column grid layout
 * 
 * Features:
 * - Responsive: 12-col (desktop), 8-col (tablet), 1-col (mobile)
 * - Sticky AlertBanner at top
 * - Optimal spacing and padding
 * - Error boundary wrapper ready
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  alertCounts = {
    critical: 0,
    blocking: 0,
    overdue: 0,
    missing: 0,
  },
  onAlertBannerAction,
}) => {
  const [showAlertBanner, setShowAlertBanner] = useState(true);

  const totalCritical = alertCounts.blocking + alertCounts.overdue + alertCounts.missing;

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Sticky Alert Banner */}
      {showAlertBanner && totalCritical > 0 && (
        <AlertBanner
          criticalCount={totalCritical}
          blockingCount={alertCounts.blocking}
          onViewAll={() => onAlertBannerAction?.('view-all')}
          onTakeAction={() => onAlertBannerAction?.('take-action')}
          onDismiss={() => setShowAlertBanner(false)}
        />
      )}

      {/* Main Dashboard Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-8 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
