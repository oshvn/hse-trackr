import React, { useState } from 'react';
import { useSessionRole } from '@/hooks/useSessionRole';

// v2.0 Components
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BentoGridItem } from '@/components/dashboard/BentoGrid';
import { KpiSection } from '@/components/dashboard/KpiSection';
import { RadarChart } from '@/components/dashboard/RadarChart';
import { AIActionsPanel } from '@/components/dashboard/AIActionsPanel';
import { CategoryProgress } from '@/components/dashboard/CategoryProgress';
import { MiniTimeline } from '@/components/dashboard/MiniTimeline';
import { ContractorScorecard } from '@/components/dashboard/ContractorScorecard';
import { RiskAssessment } from '@/components/dashboard/RiskAssessment';
import { AdvancedFilters } from '@/components/dashboard/AdvancedFilters';
import { ExportCapabilities } from '@/components/dashboard/ExportCapabilities';

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
  const { role, loading, error, profile } = useSessionRole();
  const { data, isLoading, error: dataError } = useDashboardData();
  const { modal, openModal, closeModal } = useModal();
  const { filters } = useFilters();
  
  // Radar chart metrics state
  const [selectedRadarMetrics, setSelectedRadarMetrics] = useState([
    'completionRate',
    'onTimeDelivery', 
    'qualityScore',
    'compliance',
    'responseTime'
  ]);
  
  // Category progress contractor state
  const [selectedCategoryContractor, setSelectedCategoryContractor] = useState<string | undefined>();
  
  // Timeline contractor state
  const [selectedTimelineContractors, setSelectedTimelineContractors] = useState<string[]>([]);
  
  // Contractor timeline data for MiniTimeline
  const contractorTimelineData = React.useMemo(() => {
    const contractors = data?.contractors || [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b'];
    
    return contractors.map((contractor, index) => {
      // Generate expected and actual progress arrays
      const expectedProgress = Array.from({ length: 31 }, (_, i) => (i / 30) * 100);
      const actualProgress = Array.from({ length: 31 }, (_, i) => {
        const base = (i / 30) * contractor.completionRate;
        return Math.min(100, base + (Math.random() - 0.5) * 5);
      });
      
      return {
        id: contractor.id,
        name: contractor.name,
        color: colors[index % colors.length],
        expectedProgress,
        actualProgress,
      };
    });
  }, [data?.contractors]);
  
  // Benchmark data
  const benchmarks = React.useMemo(() => ({
    completion: 75,
    quality: 80,
    compliance: 70,
    timeline: 75,
  }), []);
  
  // Filter state
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null,
  });
  
  // Risk assessment data
  const riskContractors = React.useMemo(() => {
    return (data?.contractors || []).map(c => ({
      id: c.id,
      name: c.name,
      currentMetrics: {
        completion: c.completionRate,
        quality: c.qualityScore,
        compliance: c.compliance,
        timeline: c.onTimeDelivery,
      },
    }));
  }, [data?.contractors]);

  // Calculate risk data for modal
  const riskData = React.useMemo(() => {
    if (!data?.contractors) return [];
    
    const horizonDays = 30; // Default 30d
    return data.contractors.map((contractor) => {
      const metrics = {
        completion: contractor.completionRate,
        quality: contractor.qualityScore,
        compliance: contractor.compliance,
        timeline: contractor.onTimeDelivery,
      };
      
      // Risk factors (lower score = higher risk)
      const completionRisk = metrics.completion < 70 ? (70 - metrics.completion) * 2 : 0;
      const qualityRisk = metrics.quality < 75 ? (75 - metrics.quality) * 1.5 : 0;
      const complianceRisk = metrics.compliance < 70 ? (70 - metrics.compliance) * 2.5 : 0;
      const timelineRisk = metrics.timeline < 75 ? (75 - metrics.timeline) * 2 : 0;
      
      // Total risk score (0-100, higher = more risk)
      const totalRisk = Math.min(100, completionRisk + qualityRisk + complianceRisk + timelineRisk);
      
      // Risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (totalRisk < 20) riskLevel = 'low';
      else if (totalRisk < 40) riskLevel = 'medium';
      else if (totalRisk < 60) riskLevel = 'high';
      else riskLevel = 'critical';
      
      // Bottlenecks
      const bottlenecks = [
        { name: 'Completion', risk: completionRisk },
        { name: 'Quality', risk: qualityRisk },
        { name: 'Compliance', risk: complianceRisk },
        { name: 'Timeline', risk: timelineRisk },
      ]
        .filter(b => b.risk > 0)
        .sort((a, b) => b.risk - a.risk)
        .slice(0, 2)
        .map(b => b.name);
      
      // Predictive completion date
      const completionRate = metrics.completion;
      const dailyImprovement = (100 - completionRate) / horizonDays;
      const predictedCompletion = completionRate + (dailyImprovement * horizonDays * 0.8);
      const predictedDate = new Date();
      predictedDate.setDate(predictedDate.getDate() + horizonDays);
      
      // Resource requirements forecast
      const resourceGap = 100 - completionRate;
      const estimatedResources = resourceGap > 20 ? 'High' as const : resourceGap > 10 ? 'Medium' as const : 'Low' as const;
      
      return {
        contractorId: contractor.id,
        contractorName: contractor.name,
        riskScore: Math.round(totalRisk),
        riskLevel,
        bottlenecks,
        predictedCompletion: Math.round(Math.min(100, predictedCompletion)),
        predictedDate,
        estimatedResources,
        metrics,
        trend: 'stable' as const,
      };
    });
  }, [data?.contractors]);

  // Show loading state
  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <BentoGridItem size="full" priority="high">
          <Skeleton className="h-24 w-full" />
        </BentoGridItem>
        <BentoGridItem size="large" priority="high">
          <Skeleton className="h-96 w-full" />
        </BentoGridItem>
        <BentoGridItem size="large" priority="high">
          <Skeleton className="h-96 w-full" />
        </BentoGridItem>
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
  if (role === 'guest') {
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
    <>
      {/* Header with Filters and Export */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Dashboard Overview</h2>
        </div>
        <div className="flex items-center gap-3">
          <AdvancedFilters
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            showMetricsFilter={true}
          />
          <ExportCapabilities
            data={{
              contractors: data?.contractors,
              categories: data?.categories,
            }}
            fileName="hse-trackr-dashboard"
            onExport={(options) => {
              console.log('Export requested:', options);
              // Handle export
            }}
          />
        </div>
      </div>
      
      <DashboardLayout
        alertCounts={{
          critical: criticalCount,
          blocking: blockingCount,
          overdue: 0,
          missing: 0,
        }}
        onAlertBannerAction={(action) => {
          if (action === 'view-all') openModal('alerts', data?.alerts);
          if (action === 'take-action') openModal('actions', data?.actions);
        }}
      >
      {/* KPI Section - Full width */}
      <BentoGridItem size="full" priority="high">
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
      </BentoGridItem>

      {/* Radar Chart - Performance */}
      <BentoGridItem
        size="wide"
        priority="high"
        className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3 2xl:col-span-4"
      >
        <div className="h-full">
          <RadarChart
            contractors={(data?.contractors || []).map(c => ({
              id: c.id,
              name: c.name,
              color: c.status === 'excellent' ? '#10b981' : c.status === 'good' ? '#f59e0b' : '#ef4444',
              completionRate: c.completionRate,
              onTimeDelivery: c.onTimeDelivery,
              qualityScore: c.qualityScore,
              compliance: c.compliance,
              responseTime: c.responseTime,
              // Trend data
              previousCompletionRate: c.previousCompletionRate,
              previousOnTimeDelivery: c.previousOnTimeDelivery,
              previousQualityScore: c.previousQualityScore,
              previousCompliance: c.previousCompliance,
              previousResponseTime: c.previousResponseTime,
            }))}
            selectedMetrics={selectedRadarMetrics}
            onMetricsChange={setSelectedRadarMetrics}
            onItemClick={(contractor) => openModal('radar', { contractor })}
            onContractorClick={(contractor) => openModal('radar', { contractor })}
          />
        </div>
      </BentoGridItem>

      {/* AI Actions Panel - Insights */}
      <BentoGridItem
        size="wide"
        priority="high"
        className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3 2xl:col-span-2"
      >
        <div className="h-full">
          <AIActionsPanel
            actions={data?.actions || []}
            onActionClick={(action) => openModal('actions', { action })}
          />
        </div>
      </BentoGridItem>

      {/* Timeline - Progress */}
      <BentoGridItem
        size="wide"
        priority="medium"
        className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3 2xl:col-span-3"
      >
        <MiniTimeline
          contractors={contractorTimelineData}
          showContractorBreakdown={true}
          selectedContractors={selectedTimelineContractors}
          onContractorToggle={(contractorId) => {
            setSelectedTimelineContractors(prev => 
              prev.includes(contractorId) 
                ? prev.filter(id => id !== contractorId)
                : [...prev, contractorId]
            );
          }}
          onCardClick={() => openModal('timeline')}
        />
      </BentoGridItem>

      {/* Contractor Scorecards */}
      {/* Risk Assessment - Full Width */}
      <BentoGridItem size="full" priority="high">
        <RiskAssessment
          contractors={riskContractors}
          predictionHorizon="30d"
          onContractorClick={(contractorId) => {
            const contractor = data?.contractors?.find(c => c.id === contractorId);
            if (contractor) openModal('radar', { contractor, viewMode: 'risk', fromRiskChart: true });
          }}
          onRiskDetailClick={(contractorId, riskType) => {
            console.log('Risk detail clicked:', contractorId, riskType);
            // Handle risk detail click
          }}
        />
      </BentoGridItem>

      {/* Category Progress - Portfolio */}
      <BentoGridItem
        size="wide"
        priority="medium"
        className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3 2xl:col-span-3"
      >
        <div className="h-full">
          <CategoryProgress
            categories={data?.categories || []}
            contractors={(data?.contractors || []).map(c => ({
              id: c.id,
              name: c.name,
              categories: data?.contractorCategories?.[c.id] || data?.categories || []
            }))}
            selectedContractor={selectedCategoryContractor}
            onContractorChange={setSelectedCategoryContractor}
            onCategoryClick={(categoryId) => {
              const cat = data?.categories?.find(c => c.id === categoryId);
              openModal('category', { category: cat });
            }}
          />
        </div>
      </BentoGridItem>

      {/* Contractor Scorecards */}
      {(data?.contractors || []).map((contractor) => (
        <BentoGridItem key={contractor.id} size="medium" priority="medium">
          <ContractorScorecard
            contractor={{
              id: contractor.id,
              name: contractor.name,
              completionRate: contractor.completionRate,
              qualityScore: contractor.qualityScore,
              compliance: contractor.compliance,
              onTimeDelivery: contractor.onTimeDelivery,
              responseTime: contractor.responseTime,
            }}
            benchmarks={benchmarks}
            showRecommendations={true}
            onContractorClick={(contractorId) => {
              const contractor = data?.contractors?.find(c => c.id === contractorId);
              if (contractor) {
                openModal('radar', { contractor, viewMode: 'performance' });
              }
            }}
          />
        </BentoGridItem>
      ))}

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
          contractors={modal.data?.contractors || (data?.contractors || []).map(c => ({
            id: c.id,
            name: c.name,
            completionRate: c.completionRate,
            onTimeDelivery: c.onTimeDelivery,
            qualityScore: c.qualityScore,
            compliance: c.compliance,
            responseTime: c.responseTime,
          }))}
          contractor={modal.data?.contractor}
          riskData={modal.data?.viewMode === 'risk' || modal.data?.fromRiskChart ? riskData : undefined}
          defaultView={modal.data?.viewMode === 'risk' ? 'risk' : 'performance'}
        />
      )}

      {modal.type === 'actions' && (
        <ActionsModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          actions={modal.data?.action ? [modal.data.action] : data?.actions || []}
        />
      )}

      {modal.type === 'category' && (
        <CategoryModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          categoryName={modal.data?.category?.name}
        />
      )}

      {modal.type === 'timeline' && (
        <TimelineModal
          isOpen={modal.isOpen}
          onClose={closeModal}
        />
      )}
      </DashboardLayout>
    </>
  );
}
