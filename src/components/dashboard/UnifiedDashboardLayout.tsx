import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Maximize2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import '../dashboard/bento-grid-unified.css';

// Components
import { DashboardHeader } from './DashboardHeader';
import { FilterBar } from './FilterBar';
import { KpiCards } from './KpiCards';
import { ContractorPerformanceRadar } from './ContractorPerformanceRadar';
import { ContractorBarCharts } from './ContractorBarCharts';
import { ContractorHeatmap } from './ContractorHeatmap';
import { ContractorTrendChart } from './ContractorTrendChart';
import { CriticalAlertsCard } from './CriticalAlertsCard';
import { AIActionsDashboard } from './AIActionsDashboard';
import { ProcessingTimeDashboard } from './ProcessingTimeDashboard';
import { BottleneckAnalysis } from './BottleneckAnalysis';
import { TimelineAnalysis } from './TimelineAnalysis';
import { MilestoneGanttChart } from './MilestoneGanttChart';
import { CategoryProgressChart } from './CategoryProgressChart';

// Types
interface UnifiedDashboardLayoutProps {
  // Data
  kpiData: any;
  contractorData: any[];
  docProgressData: any[];
  criticalAlerts: any[];
  processingTimeData: any;
  bottleneckData: any;
  aiActions: any[];
  
  // Filters
  filters: {
    contractor?: string;
    category?: string;
  };
  onFiltersChange: (filters: any) => void;
  
  // Loading & Error
  isLoading?: boolean;
  error?: string | null;
  
  // Props
  title?: string;
  subtitle?: string;
}

type ModalType = 'kpi' | 'contractor-radar' | 'contractor-bars' | 'contractor-heat' | 'contractor-trend' | 
                  'alerts' | 'ai-actions' | 'processing-time' | 'bottleneck' | 'timeline' | 'gantt' | 'category' | null;

export const UnifiedDashboardLayout: React.FC<UnifiedDashboardLayoutProps> = ({
  kpiData,
  contractorData,
  docProgressData,
  criticalAlerts,
  processingTimeData,
  bottleneckData,
  aiActions,
  filters,
  onFiltersChange,
  isLoading = false,
  error = null,
  title = 'HSE Dashboard',
  subtitle,
}) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Modal content mapping
  const modalContent: Record<ModalType, { title: string; component: React.ReactNode }> = {
    'kpi': {
      title: 'Chỉ số hiệu suất chi tiết',
      component: <KpiCards data={kpiData} isLoading={isLoading} />
    },
    'contractor-radar': {
      title: 'So sánh hiệu suất Radar',
      component: <ContractorPerformanceRadar data={contractorData} docProgressData={docProgressData} />
    },
    'contractor-bars': {
      title: 'So sánh hiệu suất Bar Charts',
      component: <ContractorBarCharts data={contractorData} docProgressData={docProgressData} />
    },
    'contractor-heat': {
      title: 'Bảng nhiệt hiệu suất',
      component: <ContractorHeatmap data={contractorData} docProgressData={docProgressData} />
    },
    'contractor-trend': {
      title: 'Xu hướng hiệu suất',
      component: <ContractorTrendChart data={contractorData} docProgressData={docProgressData} />
    },
    'alerts': {
      title: 'Cảnh báo chi tiết',
      component: <CriticalAlertsCard alerts={criticalAlerts} isLoading={isLoading} />
    },
    'ai-actions': {
      title: 'AI Hành động đề xuất',
      component: <AIActionsDashboard actions={aiActions} isLoading={isLoading} />
    },
    'processing-time': {
      title: 'Phân tích thời gian xử lý',
      component: <ProcessingTimeDashboard data={processingTimeData} isLoading={isLoading} />
    },
    'bottleneck': {
      title: 'Phân tích Bottleneck',
      component: <BottleneckAnalysis data={bottleneckData} isLoading={isLoading} />
    },
    'timeline': {
      title: 'Phân tích Timeline',
      component: <TimelineAnalysis data={processingTimeData} isLoading={isLoading} />
    },
    'gantt': {
      title: 'Gantt Chart Dự án',
      component: <MilestoneGanttChart data={processingTimeData} isLoading={isLoading} />
    },
    'category': {
      title: 'Tiến độ theo Danh mục',
      component: <CategoryProgressChart data={docProgressData} isLoading={isLoading} />
    },
    null: {
      title: '',
      component: null
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <DashboardHeader title={title} subtitle={subtitle} />
      </div>

      {/* Filters */}
      <div className="sticky top-[80px] z-30 bg-white shadow-sm">
        <FilterBar 
          contractors={contractorData || []}
          categories={docProgressData?.map((d: any) => d.category).filter(Boolean) || []}
          contractorFilter={filters?.contractor || 'all'}
          categoryFilter={filters?.category || 'all'}
          searchTerm=""
          onContractorChange={(value) => onFiltersChange({ ...filters, contractor: value })}
          onCategoryChange={(value) => onFiltersChange({ ...filters, category: value })}
          onSearchChange={() => {}}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Unified BentoGrid */}
      <div className="unified-bento-grid">
        {/* KPI Cards - 3 cards (4 cols each) */}
        <div
          className="grid-kpi-overall clickable"
          onClick={() => setActiveModal('kpi')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveModal('kpi')}
        >
          <h3 className="text-sm font-semibold mb-4 text-gray-700">Chỉ số Hoàn thành Tổng quát</h3>
          <div className="h-40 flex items-center justify-center">
            <KpiCards data={kpiData} isLoading={isLoading} compact />
          </div>
          <Button variant="ghost" size="sm" className="mt-4 w-full">
            <Maximize2 className="h-4 w-4 mr-2" />
            Xem chi tiết
          </Button>
        </div>

        <div
          className="grid-kpi-critical clickable"
          onClick={() => setActiveModal('alerts')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveModal('alerts')}
        >
          <h3 className="text-sm font-semibold mb-4 text-gray-700">Cảnh báo Rủi ro</h3>
          <div className="h-40 flex items-center justify-center">
            <CriticalAlertsCard alerts={criticalAlerts} isLoading={isLoading} compact />
          </div>
          <Button variant="ghost" size="sm" className="mt-4 w-full">
            <Maximize2 className="h-4 w-4 mr-2" />
            Xem chi tiết
          </Button>
        </div>

        <div
          className="grid-kpi-time clickable"
          onClick={() => setActiveModal('processing-time')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveModal('processing-time')}
        >
          <h3 className="text-sm font-semibold mb-4 text-gray-700">Thời gian Xử lý TB</h3>
          <div className="h-40 flex items-center justify-center">
            <ProcessingTimeDashboard data={processingTimeData} isLoading={isLoading} compact />
          </div>
          <Button variant="ghost" size="sm" className="mt-4 w-full">
            <Maximize2 className="h-4 w-4 mr-2" />
            Xem chi tiết
          </Button>
        </div>

        {/* Primary Charts - 2 large cards (6 cols each) */}
        <div
          className="grid-chart-primary-1 clickable"
          onClick={() => setActiveModal('contractor-radar')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveModal('contractor-radar')}
        >
          <h3 className="text-sm font-semibold mb-4 text-gray-700">So sánh Hiệu suất Radar</h3>
          <div className="h-full min-h-[300px] flex items-center justify-center">
            <ContractorPerformanceRadar 
              data={contractorData} 
              docProgressData={docProgressData} 
              compact 
            />
          </div>
          <Button variant="ghost" size="sm" className="mt-4 w-full">
            <Maximize2 className="h-4 w-4 mr-2" />
            Mở rộng
          </Button>
        </div>

        <div
          className="grid-chart-primary-2 clickable"
          onClick={() => setActiveModal('ai-actions')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveModal('ai-actions')}
        >
          <h3 className="text-sm font-semibold mb-4 text-gray-700">AI Hành động Đề xuất</h3>
          <div className="h-full min-h-[300px] flex items-center justify-center">
            <AIActionsDashboard actions={aiActions} isLoading={isLoading} compact />
          </div>
          <Button variant="ghost" size="sm" className="mt-4 w-full">
            <Maximize2 className="h-4 w-4 mr-2" />
            Mở rộng
          </Button>
        </div>

        {/* Secondary Charts - 3 medium cards (4 cols each) */}
        <div
          className="grid-chart-secondary-1 clickable"
          onClick={() => setActiveModal('contractor-bars')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveModal('contractor-bars')}
        >
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Bar Charts So sánh</h3>
          <div className="h-full min-h-[250px] flex items-center justify-center">
            <ContractorBarCharts data={contractorData} docProgressData={docProgressData} compact />
          </div>
          <Button variant="ghost" size="sm" className="mt-3 w-full">
            <Maximize2 className="h-4 w-4 mr-2" />
            Mở rộng
          </Button>
        </div>

        <div
          className="grid-chart-secondary-2 clickable"
          onClick={() => setActiveModal('contractor-heat')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveModal('contractor-heat')}
        >
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Heatmap Hiệu suất</h3>
          <div className="h-full min-h-[250px] flex items-center justify-center">
            <ContractorHeatmap data={contractorData} docProgressData={docProgressData} compact />
          </div>
          <Button variant="ghost" size="sm" className="mt-3 w-full">
            <Maximize2 className="h-4 w-4 mr-2" />
            Mở rộng
          </Button>
        </div>

        <div
          className="grid-chart-secondary-3 clickable"
          onClick={() => setActiveModal('contractor-trend')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveModal('contractor-trend')}
        >
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Xu hướng Hiệu suất</h3>
          <div className="h-full min-h-[250px] flex items-center justify-center">
            <ContractorTrendChart data={contractorData} docProgressData={docProgressData} compact />
          </div>
          <Button variant="ghost" size="sm" className="mt-3 w-full">
            <Maximize2 className="h-4 w-4 mr-2" />
            Mở rộng
          </Button>
        </div>

        {/* Analysis Cards - 3 cards (4 cols each) */}
        <div
          className="grid-bottleneck clickable"
          onClick={() => setActiveModal('bottleneck')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveModal('bottleneck')}
        >
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Phân tích Bottleneck</h3>
          <div className="h-full min-h-[250px] flex items-center justify-center">
            <BottleneckAnalysis data={bottleneckData} isLoading={isLoading} compact />
          </div>
          <Button variant="ghost" size="sm" className="mt-3 w-full">
            <Maximize2 className="h-4 w-4 mr-2" />
            Mở rộng
          </Button>
        </div>

        <div
          className="grid-timeline clickable"
          onClick={() => setActiveModal('timeline')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveModal('timeline')}
        >
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Timeline Phân tích</h3>
          <div className="h-full min-h-[250px] flex items-center justify-center">
            <TimelineAnalysis data={processingTimeData} isLoading={isLoading} compact />
          </div>
          <Button variant="ghost" size="sm" className="mt-3 w-full">
            <Maximize2 className="h-4 w-4 mr-2" />
            Mở rộng
          </Button>
        </div>

        <div
          className="grid-chart-secondary-1 clickable"
          onClick={() => setActiveModal('category')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveModal('category')}
        >
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Tiến độ Danh mục</h3>
          <div className="h-full min-h-[250px] flex items-center justify-center">
            <CategoryProgressChart data={docProgressData} isLoading={isLoading} compact />
          </div>
          <Button variant="ghost" size="sm" className="mt-3 w-full">
            <Maximize2 className="h-4 w-4 mr-2" />
            Mở rộng
          </Button>
        </div>

        {/* Full-width Chart */}
        <div
          className="grid-processing-time clickable"
          onClick={() => setActiveModal('gantt')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveModal('gantt')}
        >
          <h3 className="text-sm font-semibold mb-4 text-gray-700">Gantt Chart Dự án</h3>
          <div className="h-full min-h-[300px] flex items-center justify-center">
            <MilestoneGanttChart data={processingTimeData} isLoading={isLoading} compact />
          </div>
          <Button variant="ghost" size="sm" className="mt-4 w-full">
            <Maximize2 className="h-4 w-4 mr-2" />
            Mở rộng
          </Button>
        </div>
      </div>

      {/* Modal for detailed view */}
      <Dialog open={activeModal !== null} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{activeModal ? modalContent[activeModal]?.title : ''}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="p-6">
              {activeModal && modalContent[activeModal]?.component}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
