import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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

/**
 * Dashboard v2.0 - Executive Document Tracking System
 * 
 * Main dashboard page featuring:
 * - 13 v2.0 components
 * - 5 interactive modals
 * - Complete data visualization
 * - Modal-based drill-down system
 */

export default function Dashboard() {
  const { userRole, isAdmin, loading, error, profile } = useSessionRole();
  const { data, isLoading, error: dataError, refetch } = useDashboardData();
  const { modal, openModal, closeModal, switchModal } = useModal();
  const { filters, toggleContractor, toggleCategory, clearFilters } = useFilters();

  // Show loading state while session is being loaded
  if (loading) {
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

  // Show error if session failed to load
  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Lỗi tải thông tin tài khoản: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Handle role-based access - allow admin, super_admin, and contractor
  // guest role means user not logged in or profile not set up
  if (userRole === 'guest') {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Bạn không có quyền truy cập dashboard này. Vui lòng đăng nhập bằng tài khoản quản trị viên hoặc nhà thầu.
            {profile?.status && <p className="text-xs mt-2 text-muted-foreground">Status: {profile.status}</p>}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Lỗi tải dashboard: {error.message}
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  // Calculate alert data
  const criticalCount = data?.alerts?.filter(a => a.severity === 'blocking').length || 0;
  const blockingCount = data?.alerts?.filter(a => a.severity === 'blocking').length || 0;

  return (
    <DashboardLayout>
      {/* Alert Banner */}
      {criticalCount > 0 && (
        <AlertBanner
          criticalCount={criticalCount}
          blockingCount={blockingCount}
          onViewAll={() => openModal('alerts')}
          onTakeAction={() => openModal('actions')}
          onDismiss={() => {}}
        />
      )}

      {/* KPI Section */}
      <div className="mt-6">
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
      </div>

      {/* Radar Chart */}
      <div className="mt-6">
        <RadarChart
          data={data?.contractors || []}
          onItemClick={(contractor) => {
            switchModal('radar', { selectedContractor: contractor });
          }}
        />
      </div>

      {/* AI Actions Panel */}
      <div className="mt-6">
        <AIActionsPanel
          actions={data?.actions || []}
          onActionClick={(action) => {
            switchModal('actions', { selectedAction: action });
          }}
        />
      </div>

      {/* Bar Chart Comparison */}
      <div className="mt-6">
        <BarChartComparison
          data={data?.contractors || []}
          onItemClick={(contractor) => {
            toggleContractor(contractor.id);
          }}
        />
      </div>

      {/* Category Progress */}
      <div className="mt-6">
        <CategoryProgress
          categories={data?.categories || []}
          onCategoryClick={(category) => {
            switchModal('category', { selectedCategory: category });
          }}
        />
          </div>

      {/* Mini Timeline */}
      <div className="mt-6">
        <MiniTimeline
          data={data?.timeline || []}
          onViewFullTimeline={() => openModal('timeline')}
        />
            </div>
            
      {/* Modals */}
      {modal.type === 'alerts' && (
        <AlertsModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          alerts={data?.alerts || []}
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
          data={data?.timeline || []}
        />
      )}
    </DashboardLayout>
  );
}
