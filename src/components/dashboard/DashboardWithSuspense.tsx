import React, { Suspense, lazy, useMemo } from 'react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useModal } from '../../hooks/useModal';
import { useFilters } from '../../hooks/useFilters';
import DashboardLayout from './DashboardLayout';
import AlertBanner from './AlertBanner';
import KpiSection from './KpiSection';
import RadarChart from './RadarChart';
import AIActionsPanel from './AIActionsPanel';
import BarChartComparison from './BarChartComparison';
import CategoryProgress from './CategoryProgress';
import MiniTimeline from './MiniTimeline';

// Lazy load modals (code splitting)
const AlertsModal = lazy(() => import('../modals/AlertsModal'));
const RadarDetailModal = lazy(() => import('../modals/RadarDetailModal'));
const ActionsModal = lazy(() => import('../modals/ActionsModal'));
const CategoryModal = lazy(() => import('../modals/CategoryModal'));
const TimelineModal = lazy(() => import('../modals/TimelineModal'));

// Loading fallback
const ModalFallback = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  </div>
);

/**
 * Main Dashboard Component with Code Splitting
 * - Lazy loads all modals
 * - Memoized data transformations
 * - Performance optimized rendering
 */
export const DashboardWithSuspense: React.FC = () => {
  const { data, isLoading, error, refetch } = useDashboardData();
  const { modal, openModal, closeModal } = useModal();
  const { filters } = useFilters();

  // Memoize filtered data
  const filteredData = useMemo(() => {
    if (!data) return null;

    let filtered = data;

    // Apply contractor filter
    if (filters.contractors.length > 0) {
      filtered = {
        ...filtered,
        contractors: filtered.contractors.filter(c => 
          filters.contractors.includes(c.id)
        ),
      };
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = {
        ...filtered,
        categories: filtered.categories.filter(c => 
          filters.categories.includes(c.id)
        ),
      };
    }

    return filtered;
  }, [data, filters]);

  // Memoize alert counts
  const alertCounts = useMemo(() => {
    if (!data) return { critical: 0, blocking: 0, overdue: 0, missing: 0 };

    return {
      critical: data.alerts.filter(a => a.severity === 'blocking').length +
               data.alerts.filter(a => a.severity === 'overdue').length,
      blocking: data.alerts.filter(a => a.severity === 'blocking').length,
      overdue: data.alerts.filter(a => a.severity === 'overdue').length,
      missing: data.alerts.filter(a => a.severity === 'missing').length,
    };
  }, [data]);

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h1>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      alertCounts={alertCounts}
      onAlertBannerAction={(action) => {
        if (action === 'view-all') {
          openModal('alerts');
        } else if (action === 'take-action') {
          openModal('actions');
        }
      }}
    >
      {/* KPI Section */}
      <KpiSection
        overallCompletion={filteredData?.overallCompletion ?? 0}
        completionTrend={5}
        trendDirection="up"
        avgProcessingTime={filteredData?.avgProcessingTime ?? 0}
        prepTime={5}
        approvalTime={3.5}
        contractors={filteredData?.contractors ?? []}
        onCardClick={(type) => {
          if (type === 'overall') openModal('category');
          else if (type === 'processing') openModal('timeline');
          else if (type === 'ranking') openModal('radar');
        }}
      />

      {/* Radar Chart */}
      <RadarChart
        contractors={filteredData?.contractors ?? []}
        onCardClick={() => openModal('radar')}
      />

      {/* AI Actions Panel */}
      <AIActionsPanel
        actions={filteredData?.actions ?? []}
        onActionClick={(actionId) => {
          openModal('actions', { actionId });
        }}
      />

      {/* Bar Chart */}
      <BarChartComparison
        contractors={filteredData?.contractors?.map(c => ({
          id: c.id,
          name: c.name,
          completion: c.completionRate,
        })) ?? []}
        onBarClick={() => openModal('category')}
      />

      {/* Category Progress */}
      <CategoryProgress
        categories={filteredData?.categories ?? []}
        onCategoryClick={(categoryId) => {
          openModal('category', { categoryId });
        }}
      />

      {/* Mini Timeline */}
      <MiniTimeline
        days={30}
        onCardClick={() => openModal('timeline')}
      />

      {/* Lazy Loaded Modals */}
      <Suspense fallback={<ModalFallback />}>
        {modal.type === 'alerts' && (
          <AlertsModal
            isOpen={modal.isOpen}
            onClose={closeModal}
            alerts={filteredData?.alerts ?? []}
          />
        )}

        {modal.type === 'radar' && (
          <RadarDetailModal
            isOpen={modal.isOpen}
            onClose={closeModal}
            metrics={[
              { name: 'Completion', contractorA: 92, contractorB: 65, contractorC: 78 },
              { name: 'On-time', contractorA: 88, contractorB: 72, contractorC: 85 },
              { name: 'Quality', contractorA: 95, contractorB: 68, contractorC: 82 },
              { name: 'Compliance', contractorA: 90, contractorB: 58, contractorC: 75 },
              { name: 'Response', contractorA: 89, contractorB: 70, contractorC: 80 },
            ]}
          />
        )}

        {modal.type === 'actions' && (
          <ActionsModal
            isOpen={modal.isOpen}
            onClose={closeModal}
            actions={filteredData?.actions ?? []}
          />
        )}

        {modal.type === 'category' && (
          <CategoryModal
            isOpen={modal.isOpen}
            onClose={closeModal}
            categoryName={modal.data?.categoryName ?? 'Documents'}
            completion={75}
            approved={12}
            pending={3}
            missing={1}
            overdue={2}
          />
        )}

        {modal.type === 'timeline' && (
          <TimelineModal
            isOpen={modal.isOpen}
            onClose={closeModal}
            contractors={filteredData?.contractors?.map(c => ({
              name: c.name,
              submission: c.completionRate,
              review: Math.round(c.completionRate * 0.8),
              approval: Math.round(c.completionRate * 0.7),
            })) ?? []}
          />
        )}
      </Suspense>
    </DashboardLayout>
  );
};

export default DashboardWithSuspense;
