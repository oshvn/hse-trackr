import React, { useState } from 'react';
import { AlertBanner } from './AlertBanner';
import { BentoGrid, BentoGridItem } from './BentoGrid';
import './BentoGrid.css';

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
 * DashboardLayout v2.0 with Bento Grid
 * Modern masonry-style layout with flexible component sizing
 * 
 * Features:
 * - Bento Grid layout with auto-fit columns
 * - Flexible item sizing (small, medium, large, wide, tall, full)
 * - Priority-based ordering
 * - Smooth animations and transitions
 * - Responsive design
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
    <div className="w-full min-h-screen bg-white">
      {/* Sticky Alert Banner - Outside Bento Grid */}
      {showAlertBanner && totalCritical > 0 && (
        <div className="w-full sticky top-0 z-50">
          <AlertBanner
            criticalCount={totalCritical}
            blockingCount={alertCounts.blocking}
            onViewAll={() => onAlertBannerAction?.('view-all')}
            onTakeAction={() => onAlertBannerAction?.('take-action')}
            onDismiss={() => setShowAlertBanner(false)}
          />
        </div>
      )}

      {/* Bento Grid Layout - Only for charts/components */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <BentoGrid columns={12} gap={16}>
          {children}
        </BentoGrid>
      </div>
    </div>
  );
};

export default DashboardLayout;
