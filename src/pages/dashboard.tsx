import React from 'react';
import { useSessionRole } from '@/hooks/useSessionRole';

// v2.0 Components
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { KpiSection } from '@/components/dashboard/KpiSection';
import { RadarChart } from '@/components/dashboard/RadarChart';
import { AIActionsPanel } from '@/components/dashboard/AIActionsPanel';
import { BarChartComparison } from '@/components/dashboard/BarChartComparison';
import { CategoryProgress } from '@/components/dashboard/CategoryProgress';
import { MiniTimeline } from '@/components/dashboard/MiniTimeline';

// v2.0 Modals
import { AlertsModal } from '@/components/modals/AlertsModal';
import { RadarDetailModal } from '@/components/modals/RadarDetailModal';
import { ActionsModal } from '@/components/modals/ActionsModal';
import { CategoryModal } from '@/components/modals/CategoryModal';
import { TimelineModal } from '@/components/modals/TimelineModal';

// v2.0 Hooks
import { useDashboardData } from '@/hooks/useDashboardData';
import { useModal } from '@/hooks/useModal';
import { useFilters } from '@/hooks/useFilters';

// UI Components
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { userRole, loading, error, profile } = useSessionRole();
  const { data, isLoading, error: dataError } = useDashboardData();
  const { modal, openModal, closeModal } = useModal();
  const { filters } = useFilters();

  // Show loading state
  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 col-span-full">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  // Show error if session failed
  if (error || dataError) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error ? `Lỗi: ${error}` : `Lỗi tải dashboard: ${dataError?.message}`}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Handle role-based access
  if (userRole === 'guest') {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Bạn không có quyền truy cập. Vui lòng đăng nhập.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const criticalCount = data?.alerts?.filter(a => a.severity === 'blocking').length || 0;
  const blockingCount = data?.alerts?.filter(a => a.severity === 'blocking').length || 0;

  return (
    <DashboardLayout>
      {/* Alert Banner */}
      {criticalCount > 0 && (
        <AlertBanner
          criticalCount={criticalCount}
          blockingCount={blockingCount}
          onViewAll={() => openModal('alerts', data?.alerts)}
          onTakeAction={() => openModal('actions', data?.actions)}
          onDismiss={() => {}}
        />
      )}

      {/* KPI Section - 12 cols total: 3+3+3+3 */}
      <KpiSection
        overallCompletion={data?.overallCompletion || 0}
        processingTime={data?.avgProcessingTime || 0}
        contractorRanking={(data?.contractors || []).map(c => ({
          id: c.id,
          name: c.name,
          score: c.completionRate,
        }))}
        onOverallClick={() => openModal('category')}
        onProcessingClick={() => openModal('timeline')}
        onRankingClick={() => openModal('radar')}
      />

      {/* Radar Chart - 6 cols, 2 rows */}
      <RadarChart
        data={data?.contractors || []}
        onItemClick={(contractor) => openModal('radar', { contractor })}
      />

      {/* AI Actions Panel - 6 cols, 2 rows */}
      <AIActionsPanel
        actions={data?.actions || []}
        onActionClick={(action) => openModal('actions', { action })}
      />

      {/* Bar Chart - 4 cols */}
      <BarChartComparison
        data={data?.contractors || []}
        onItemClick={() => {}}
      />

      {/* Category Progress - 4 cols */}
      <CategoryProgress
        categories={data?.categories || []}
        onCategoryClick={(categoryId) => {
          const cat = data?.categories?.find(c => c.id === categoryId);
          openModal('category', { category: cat });
        }}
      />

      {/* Timeline - 4 cols */}
      <MiniTimeline
        data={data?.timeline || []}
        onViewFullTimeline={() => openModal('timeline', data?.timeline)}
      />

      {/* Modals - Outside grid */}
      {modal.type === 'alerts' && (
        <AlertsModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          alerts={modal.data || data?.alerts || []}
        />
      )}

      {modal.type === 'radar' && (
        <RadarDetailModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          data={modal.data}
        />
      )}

      {modal.type === 'actions' && (
        <ActionsModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          action={modal.data}
        />
      )}

      {modal.type === 'category' && (
        <CategoryModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          category={modal.data}
        />
      )}

      {modal.type === 'timeline' && (
        <TimelineModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          data={modal.data || []}
        />
      )}
    </DashboardLayout>
  );
}
