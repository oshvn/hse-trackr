import React, { useState, useEffect } from 'react';
import { useSessionRole } from '@/hooks/useSessionRole';

// v2.0 Components
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BentoGridItem } from '@/components/dashboard/BentoGrid';
import { KpiSection } from '@/components/dashboard/KpiSection';
import { RadarChart } from '@/components/dashboard/RadarChart';
import { AIActionsPanel } from '@/components/dashboard/AIActionsPanel';
import { CategoryProgress } from '@/components/dashboard/CategoryProgress';
import { MiniTimeline } from '@/components/dashboard/MiniTimeline';
import { CategoryDetailModal } from '@/components/modals/CategoryDetailModal';
import { useDashboardIntegration } from '@/hooks/useDashboardIntegration';
import { generateCategoryTimeline } from '@/lib/categoryTimelineUtils';
import { getCachedContractorTimeline, clearChartCache, getCacheStats } from '@/lib/chartPerformance';
import { measurePerformance, logPerformanceReport } from '@/lib/performanceOptimization';
import { ContractorScorecard } from '@/components/dashboard/ContractorScorecard';
import { RiskAssessment } from '@/components/dashboard/RiskAssessment';
import { AdvancedFilters } from '@/components/dashboard/AdvancedFilters';
import { ExportCapabilities } from '@/components/dashboard/ExportCapabilities';
import { AlertBanner } from '@/components/dashboard/AlertBanner';

// v2.0 Modals
import { AlertsModal } from '@/components/modals/AlertsModal';
import { RadarDetailModal } from '@/components/modals/RadarDetailModal';
import { ActionsModal } from '@/components/modals/ActionsModal';
import { CategoryModal } from '@/components/modals/CategoryModal';
import { TimelineModal } from '@/components/modals/TimelineModal';

// v2.0 Hooks
import { useDashboardData, clearDashboardCache } from '@/hooks/useDashboardData';
import { useModal } from '@/hooks/useModal';
import { useFilters } from '@/hooks/useFilters';
import { useAIActions } from '@/hooks/useAIActions';
import { clearAICache } from '@/services/aiRecommendationService';

// UI Components
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Dashboard() {
  // HOOKS (useState, useEffect, ...): DECLARE ALL HERE
  const { role, loading, error, profile } = useSessionRole();
  const { data, isLoading, error: dataError, refetch } = useDashboardData();
  const { modal, openModal, closeModal } = useModal();
  const { filters } = useFilters();
  const [selectedRadarMetrics, setSelectedRadarMetrics] = useState([
    'completionRate', 'onTimeDelivery', 'qualityScore', 'compliance', 'responseTime'
  ]);
  const integration = useDashboardIntegration();
  const [selectedCategoryContractor, setSelectedCategoryContractor] = useState<string | undefined>();
  const contractorTimelineData = React.useMemo(() => measurePerformance('dashboard-contractor-timeline-data', () => {
    const contractors = data?.contractors || [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b'];
    return getCachedContractorTimeline(contractors, colors);
  }), [data?.contractors]);
  const categoryTimelineData = React.useMemo(() => {
    if (!integration.integrationState.selectedCategory) return null;
    if (!data?.categories || !data?.contractors) return null;
    let category = data.categories.find(c => c.id === integration.integrationState.selectedCategory);
    if (!category) {
      let fallbackName: string | null = null;
      if (data.contractorCategories) {
        for (const cats of Object.values(data.contractorCategories)) {
          const hit = cats.find(cc => cc.id === integration.integrationState.selectedCategory);
          if (hit) { fallbackName = hit.name; break; }
        }
      }
      if (fallbackName) category = data.categories.find(c => c.name === fallbackName) as any;
      if (!category) return null;
    }
    return measurePerformance('category-timeline-data-generation', () => {
      const contractors = (data.contractors || []).map(c => ({
        id: c.id, name: c.name, categories: data?.contractorCategories?.[c.id] || data?.categories || []
      }));
      return generateCategoryTimeline(category, contractors);
    });
  }, [integration.integrationState.selectedCategory, data?.categories, data?.contractors]);
  React.useEffect(() => { if (categoryTimelineData) integration.setCategoryTimelineData(categoryTimelineData); }, [categoryTimelineData, integration.setCategoryTimelineData]);
  const resolveCategoryId = React.useCallback((clickedId: string | null): string | null => {
    if (!clickedId) return null;
    const direct = data?.categories?.find(c => c.id === clickedId);
    if (direct) return direct.id;
    let foundName: string | null = null;
    if (data?.contractorCategories) for (const cats of Object.values(data.contractorCategories)) {
      const hit = cats.find(cc => cc.id === clickedId);
      if (hit) { foundName = hit.name; break; }
    }
    if (!foundName) return null;
    const global = data?.categories?.find(c => c.name === foundName);
    return global ? global.id : null;
  }, [data?.categories, data?.contractorCategories]);
  React.useEffect(() => { if (process.env.NODE_ENV === 'development') { const timer = setTimeout(() => { logPerformanceReport(); console.log('Chart Cache Stats:', getCacheStats()); }, 2000); return () => clearTimeout(timer); } }, []);
  React.useEffect(() => { return () => { if (process.env.NODE_ENV === 'development') { clearChartCache(); } }; }, []);
  const benchmarks = React.useMemo(() => ({ completion: 75, quality: 80, compliance: 70, timeline: 75 }), []);
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({ startDate: null, endDate: null, });
  const riskContractors = React.useMemo(() => (data?.contractors || []).map(c => ({ id: c.id, name: c.name, currentMetrics: { completion: c.completionRate, quality: c.qualityScore, compliance: c.compliance, timeline: c.onTimeDelivery, }, })), [data?.contractors]);
  const riskData = React.useMemo(() => {
    if (!data?.contractors) return [];
    const horizonDays = 30;
    return data.contractors.map((contractor) => {
      const metrics = { completion: contractor.completionRate, quality: contractor.qualityScore, compliance: contractor.compliance, timeline: contractor.onTimeDelivery };
      const completionRisk = metrics.completion < 70 ? (70 - metrics.completion) * 2 : 0;
      const qualityRisk = metrics.quality < 75 ? (75 - metrics.quality) * 1.5 : 0;
      const complianceRisk = metrics.compliance < 70 ? (70 - metrics.compliance) * 2.5 : 0;
      const timelineRisk = metrics.timeline < 75 ? (75 - metrics.timeline) * 2 : 0;
      const totalRisk = Math.min(100, completionRisk + qualityRisk + complianceRisk + timelineRisk);
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (totalRisk < 20) riskLevel = 'low'; else if (totalRisk < 40) riskLevel = 'medium'; else if (totalRisk < 60) riskLevel = 'high'; else riskLevel = 'critical';
      const bottlenecks = [ { name: 'Completion', risk: completionRisk }, { name: 'Quality', risk: qualityRisk }, { name: 'Compliance', risk: complianceRisk }, { name: 'Timeline', risk: timelineRisk } ].filter(b => b.risk > 0).sort((a, b) => b.risk - a.risk).slice(0, 2).map(b => b.name);
      const completionRate = metrics.completion;
      const dailyImprovement = (100 - completionRate) / horizonDays;
      const predictedCompletion = completionRate + (dailyImprovement * horizonDays * 0.8);
      const predictedDate = new Date(); predictedDate.setDate(predictedDate.getDate() + horizonDays);
      const resourceGap = 100 - completionRate;
      const estimatedResources = resourceGap > 20 ? 'High' as const : resourceGap > 10 ? 'Medium' as const : 'Low' as const;
      return { contractorId: contractor.id, contractorName: contractor.name, riskScore: Math.round(totalRisk), riskLevel, bottlenecks, predictedCompletion: Math.round(Math.min(100, predictedCompletion)), predictedDate, estimatedResources, metrics, trend: 'stable' as const };
    });
  }, [data?.contractors]);
  const criticalCount = data?.alerts?.filter(a => a.severity === 'blocking').length || 0;
  const blockingCount = data?.alerts?.filter(a => a.severity === 'blocking').length || 0;
  const [timeString, setTimeString] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  useEffect(() => { const interval = setInterval(() => { setTimeString(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })); }, 1000); return () => clearInterval(interval); }, []);

  // Chuẩn bị context (lấy từ data hiện tại; linh động)
  const criticalIssues = data?.alerts?.map(a => ({
    contractorId: a.contractor,
    contractorName: a.contractor,
    docTypeName: a.documentName,
    approvedCount: 0, requiredCount: 0, overdueDays: a.daysOverdue || 0, dueInDays: undefined, docTypeId: '',
    plannedDueDate: (a.deadline || new Date()).toISOString(),
  })) || [];
  const context = { projectPhase: 'execution' as const, deadlinePressure: 'medium' as const, stakeholderVisibility: 'internal' as const };
  // Có thể lấy thêm real redCards nếu cần
  const { actions: aiActionsRaw, fetchActions, isLoading: aiIsLoading, error: aiError } = useAIActions({ criticalIssues, context });
  // Map AIRecommendation -> Action cho panel
  const aiActions = (aiActionsRaw || []).map((rec, i) => {
    let urgency: 'urgent' | 'this-week' | 'planned' = 'planned';
    if (rec.severity === 'high') urgency = 'urgent';
    else if (rec.severity === 'medium') urgency = 'this-week';
    return {
      id: rec.id || `ai-action-${i}`,
      title: rec.message.slice(0, 64),
      description: rec.message,
      urgency,
      contractor: '',
      actionType: (rec.actionType as 'email' | 'meeting' | 'support' | 'escalate') || 'support',
    };
  });

  const [uiGeneratingAI, setUiGeneratingAI] = useState(false);

  const handleRegenerateAI = async () => {
    setUiGeneratingAI(true);
    clearAICache({ contractorId: '', contractorName: '', criticalIssues, redCards: undefined, context });
    await fetchActions();
    setUiGeneratingAI(false);
  };

  // RETURN SỚM LUÔN ĐẶT SAU TOÀN BỘ HOOK!
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

  // Tất cả logic còn lại và RETURN CHÍNH bên dưới
  return (
    <>
      {/* HEADER sticky với đúng style design hệ thống, hiển thị timeString và icon/logo nếu cần */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-6">
        <span className="text-xs text-gray-500 font-mono mr-4">{timeString}</span>
        {/* phần còn lại header nếu cần logo/icon/user... */}
      </div>

      {/* ALERT BANNER dưới header sticky */}
      {(criticalCount > 0 || blockingCount > 0) && (
        <div className="w-full mb-2">
          <AlertBanner
            criticalCount={criticalCount}
            blockingCount={blockingCount}
            onViewAll={() => openModal('alerts', data?.alerts)}
            onTakeAction={() => openModal('actions', data?.actions)}
            onDismiss={() => {}}
          />
        </div>
      )}
      {/* Layout đầu: 2 hàng trên - AI Actions for Bottlenecks tăng chiều rộng 2/5 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {/* KPI Cards - col-span-3 (3/5 trên) */}
        <div className="col-span-3 h-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full items-stretch">
            {/* KPI Card 1 */}
            <div className="h-full">
              <div className="h-full bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between" onClick={() => openModal('category')} role="button" tabIndex={0} onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') openModal('category'); }}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Overall Completion</h3>
                  <span className="text-xl">📊</span>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-blue-600">{data?.overallCompletion || 0}%</div>
                  <div className="text-xs text-gray-500">Total document completion rate</div>
                </div>
                <div className="border-l-4 border-blue-500 pl-3 mt-3 text-xs text-gray-500">Total Progress</div>
              </div>
            </div>
            {/* KPI Card 2 */}
            <div className="h-full">
              <div className="h-full bg-white rounded-lg border border-gray-200 p-5 hover:border-amber-400 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between" onClick={() => openModal('timeline')} role="button" tabIndex={0} onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') openModal('timeline'); }}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Avg Processing Time</h3>
                  <span className="text-xl">⏱️</span>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-amber-600">{data?.avgProcessingTime || 0}d</div>
                  <div className="text-xs text-gray-500">Average document processing days</div>
                </div>
                <div className="border-l-4 border-amber-500 pl-3 mt-3 text-xs text-gray-500">Prep + Approval</div>
              </div>
            </div>
            {/* KPI Card 3 */}
            <div className="h-full">
              <div className="h-full bg-white rounded-lg border-2 border-green-500 p-5 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between" onClick={() => openModal('radar')} role="button" tabIndex={0} onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') openModal('radar'); }}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">🏆 Contractor Ranking</h3>
                  <span className="text-xl">📈</span>
                </div>
                <div className="space-y-2">
                  {(data?.contractors || []).slice(0,3).map((contractor, idx) => (
                    <div key={contractor.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700">{idx+1}.</span>
                        <div className={`w-2 h-2 rounded-full ${contractor.completionRate >= 80 ? 'bg-green-100' : contractor.completionRate >= 60 ? 'bg-amber-100' : 'bg-red-100'}`}/>
                        <span className="text-gray-600">{contractor.name}</span>
                      </div>
                      <span className={`font-semibold ${contractor.completionRate >= 80 ? 'text-green-600' : contractor.completionRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{contractor.completionRate}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* AI Actions Panel tăng chiều rộng 2/5, chiếm 2 hàng */}
        <div className="col-span-2 row-span-2 flex flex-col h-full">
          {/* Đã có icon refresh trong panel header bởi AIActionsPanel */}
          <AIActionsPanel
            actions={aiActions}
            onActionClick={(actionId) => openModal('actions', { actionId })}
            onRegenerate={handleRegenerateAI}
            isLoading={aiIsLoading || uiGeneratingAI}
          />
        </div>
        {/* Radar Chart dưới 3 KPI - col-span-3 */}
        <div className="col-span-3 mt-4 md:mt-0">
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
      </div>
      {/* Hàng 3 + 4: Category Progress chiếm 2 hàng, rộng hơn, Risk Assessment chiếm 3/5 trên, Scorecard chiếm 3/5 dưới */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 items-stretch">
        {/* Category Progress chiếm 2 cột, 2 hàng bên trái */}
        <div className="col-span-2 row-span-2 h-full flex flex-col">
          <div className="h-full flex flex-col">
            <CategoryProgress
              categories={data?.categories || []}
              contractors={(data?.contractors || []).map(c => ({
                id: c.id,
                name: c.name,
                categories: data?.contractorCategories?.[c.id] || data?.categories || []
              }))}
              selectedContractor={selectedCategoryContractor}
              onContractorChange={setSelectedCategoryContractor}
              onCategoryClick={(categoryId, contractorId) => {
                const normalized = resolveCategoryId(categoryId) || categoryId;
                integration.handleCategoryDrillDown(normalized, contractorId);
                openModal('category-detail');
              }}
              onCategoryDrillDown={(categoryId, contractorId) => {
                const normalized = resolveCategoryId(categoryId) || categoryId;
                integration.handleCategoryDrillDown(normalized, contractorId);
                openModal('category-detail');
              }}
              isDrillDownEnabled={true}
              selectedCategoryId={integration.integrationState.selectedCategory}
            />
          </div>
        </div>
        {/* Risk Assessment 3/5 vùng phải hàng trên */}
        <div className="col-span-3 h-full flex flex-col">
          <div className="h-1/2 flex flex-col">
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
          </div>
          {/* Performance Scorecard hàng dưới */}
          <div className="h-1/2 flex flex-row gap-4 mt-4">
            {(data?.contractors || []).slice(0, 3).map((contractor) => (
              <div key={contractor.id} className="flex-1 h-full">
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
                    const c = data?.contractors?.find(c => c.id === contractorId);
                    if (c) openModal('radar', { contractor: c, viewMode: 'performance' });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* DashboardLayout chứa các chart còn lại */}
      <DashboardLayout>
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
          (() => {
            // Helper: map Action -> EmailAction expected by ActionsModal
            const mapToEmailAction = (a: { id: string; title: string; description: string; message?: string; urgency: 'urgent' | 'this-week' | 'planned'; contractor: string; actionType: any; }): any => {
              const contractorSafe = a.contractor && a.contractor !== 'N/A' ? a.contractor : 'nhà thầu liên quan';
              const subject = a.title?.slice(0, 60) || `Yêu cầu hành động liên quan đến dự án`;
              // Lấy nội dung động từ AI output (ưu tiên .description)
              const aiBody = a.description || a.message || '';
              const body = `Kính gửi ${contractorSafe},\n\n${aiBody}\n\nTrân trọng,\nBan QLDA.`;
              return {
                id: a.id,
                title: a.title || 'Recommended Action',
                description: a.description || '',
                urgency: a.urgency === 'urgent' ? 'urgent' : 'this-week',
                contractor: contractorSafe,
                email: {
                  to: `${contractorSafe.replace(/ /g, '').toLowerCase()}@example.com`,
                  subject,
                  body,
                },
                relatedDocs: [],
              };
            };
            // Source list: ưu tiên aiActions đã map; fallback data?.actions mock
            const sourceList = aiActions.length > 0 ? aiActions : (data?.actions || []).map(d => ({
              id: d.id,
              title: d.title,
              description: d.description,
              urgency: d.urgency as any,
              contractor: d.contractor,
              actionType: d.actionType as any,
            }));
            const emailActions = sourceList.map(mapToEmailAction);
            const selectedId = modal.data?.actionId as string | undefined;
            const finalList = selectedId ? emailActions.filter(e => e.id === selectedId) : emailActions;
            return (
              <ActionsModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                actions={finalList}
              />
            );
          })()
        )}

        {/* Unified Category Detail Modal */}
        {modal.type === 'category-detail' && (
          <CategoryDetailModal
            isOpen={modal.isOpen}
            onClose={closeModal}
            categoryData={categoryTimelineData}
            onBackToOverview={integration.handleBackToOverview}
          />
        )}

        {modal.type === 'timeline' && (
          <TimelineModal
            isOpen={modal.isOpen}
            onClose={closeModal}
            contractors={contractorTimelineData}
            selectedContractors={[]}
            onContractorToggle={() => {}}
            onExport={() => {
              console.log('Exporting timeline data...', {
                contractors: contractorTimelineData,
                timestamp: new Date().toISOString()
              });
            }}
          />
        )}
      </DashboardLayout>
    </>
  );
}
