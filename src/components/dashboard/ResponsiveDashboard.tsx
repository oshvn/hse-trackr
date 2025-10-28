import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { useResponsive, useDeviceCapabilities } from '@/hooks/useResponsive';
import { performanceUtils } from '@/lib/responsiveUtils';
import { getResponsiveKpiConfig, getResponsiveChartDimensions, getResponsiveTableConfig } from '@/lib/responsiveUtils';
import MobileLayout from './MobileLayout';
import TabletLayout from './TabletLayout';
import DesktopLayout from './DesktopLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Lazy load heavy components for performance
const LazyKpiCards = lazy(() => import('./KpiCards').then(module => ({ default: module.KpiCards })));
const LazyContractorComparisonDashboard = lazy(() => import('./ContractorComparisonDashboard').then(module => ({ default: module.ContractorComparisonDashboard })));
const LazyProcessingTimeDashboard = lazy(() => import('./ProcessingTimeDashboard').then(module => ({ default: module.ProcessingTimeDashboard })));
const LazyAIActionsDashboard = lazy(() => import('./AIActionsDashboard').then(module => ({ default: module.AIActionsDashboard })));
const LazyCriticalAlertsCard = lazy(() => import('./CriticalAlertsCard').then(module => ({ default: module.CriticalAlertsCard })));
const LazyActionSuggestions = lazy(() => import('./ActionSuggestions').then(module => ({ default: module.ActionSuggestions })));
const LazyWorkflowDashboard = lazy(() => import('./WorkflowDashboard').then(module => ({ default: module.WorkflowDashboard })));

interface ResponsiveDashboardProps {
  // Data props
  contractors?: Array<{ id: string; name: string }>;
  kpiData?: any[];
  progressData?: any[];
  criticalAlerts?: any[];
  redCardsByLevel?: any;
  overallCompletion?: number;
  totalDocuments?: { approved: number; required: number };
  estimatedCompletion?: string;
  redCardsData?: { total: number; missing: number; overdue: number; contractorsCantStart: number };
  avgApprovalTime?: number;
  avgPrepTime?: number;
  approvalTimeComparison?: { lastWeek: number };
  processingTimeStats?: any[];
  processingTimeMetrics?: any;
  timelineData?: any[];
  contractorProcessingTimeComparison?: any[];
  documentTypeProcessingTime?: any[];
  bottleneckAnalysisData?: any[];
  aiActions?: any[];
  workflowEngine?: any;
  
  // Filter props
  filters?: {
    contractor: string;
    category: string;
    search: string;
  };
  onFiltersChange?: (filters: any) => void;
  
  // Loading and error states
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  
  // Event handlers
  onContractorSelect?: (contractorId: string) => void;
  onDocumentSelect?: (contractorId: string, docTypeId: string) => void;
  onAlertSelect?: (contractorId: string, docTypeId: string) => void;
  onViewAllAlerts?: () => void;
  onRefresh?: () => void;
  
  // Configuration
  title?: string;
  subtitle?: string;
  enableLazyLoading?: boolean;
  enableVirtualScrolling?: boolean;
  reduceAnimations?: boolean;
}

interface PerformanceMonitorProps {
  onPerformanceIssue?: (issue: string) => void;
}

/**
 * Performance Monitor component to track and optimize performance
 */
const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ onPerformanceIssue }) => {
  const { deviceType, isTouchDevice } = useResponsive();
  const { isReducedMotion } = useDeviceCapabilities();

  useEffect(() => {
    // Monitor performance based on device capabilities
    const shouldReduceAnimations = performanceUtils.shouldReduceAnimations(deviceType, isReducedMotion);
    const shouldUseLazyLoading = performanceUtils.shouldUseLazyLoading(deviceType);

    if (shouldReduceAnimations && !isReducedMotion) {
      onPerformanceIssue?.('Animations should be reduced for better performance');
    }

    if (shouldUseLazyLoading) {
      onPerformanceIssue?.('Lazy loading should be enabled for this device');
    }
  }, [deviceType, isTouchDevice, isReducedMotion, onPerformanceIssue]);

  return null;
};

/**
 * Error Boundary component for graceful error handling
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ResponsiveDashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

/**
 * Loading component optimized for different devices
 */
const LoadingComponent: React.FC<{ deviceType: 'mobile' | 'tablet' | 'desktop' }> = ({ deviceType }) => {
  const config = getResponsiveKpiConfig(deviceType);
  
  return (
    <div className="space-y-4">
      <div className={cn(
        'grid gap-4',
        deviceType === 'mobile' ? 'grid-cols-1' :
        deviceType === 'tablet' ? 'grid-cols-2' : 'grid-cols-3'
      )}>
        {Array.from({ length: deviceType === 'mobile' ? 1 : deviceType === 'tablet' ? 4 : 6 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </div>
      <div className={cn(
        'grid gap-4',
        deviceType === 'mobile' ? 'grid-cols-1' :
        deviceType === 'tablet' ? 'grid-cols-2' : 'grid-cols-3'
      )}>
        {Array.from({ length: deviceType === 'mobile' ? 2 : deviceType === 'tablet' ? 4 : 6 }).map((_, index) => (
          <Skeleton key={index} className="h-64 w-full" />
        ))}
      </div>
    </div>
  );
};

/**
 * Main Responsive Dashboard component
 */
export const ResponsiveDashboard: React.FC<ResponsiveDashboardProps> = ({
  contractors = [],
  kpiData = [],
  progressData = [],
  criticalAlerts = [],
  redCardsByLevel = { all: [], level1: [], level2: [], level3: [] },
  overallCompletion = 0,
  totalDocuments = { approved: 0, required: 0 },
  estimatedCompletion = '',
  redCardsData = { total: 0, missing: 0, overdue: 0, contractorsCantStart: 0 },
  avgApprovalTime = 0,
  avgPrepTime = 0,
  approvalTimeComparison = { lastWeek: 0 },
  processingTimeStats = [],
  processingTimeMetrics,
  timelineData = [],
  contractorProcessingTimeComparison = [],
  documentTypeProcessingTime = [],
  bottleneckAnalysisData = [],
  aiActions = [],
  workflowEngine,
  filters = { contractor: 'all', category: 'all', search: '' },
  onFiltersChange,
  isLoading = false,
  error = null,
  onRetry,
  onContractorSelect,
  onDocumentSelect,
  onAlertSelect,
  onViewAllAlerts,
  onRefresh,
  title = 'HSE Dashboard',
  subtitle,
  enableLazyLoading = true,
  enableVirtualScrolling = false,
  reduceAnimations,
}) => {
  const { deviceType, width, height, isTouchDevice } = useResponsive();
  const { isReducedMotion, connectionType } = useDeviceCapabilities();
  const [performanceIssues, setPerformanceIssues] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Determine if we should use lazy loading based on device and connection
  const shouldUseLazyLoading = useMemo(() => {
    if (!enableLazyLoading) return false;
    return performanceUtils.shouldUseLazyLoading(deviceType, connectionType);
  }, [enableLazyLoading, deviceType, connectionType]);

  // Determine if we should reduce animations
  const shouldReduceAnimations = useMemo(() => {
    if (reduceAnimations !== undefined) return reduceAnimations;
    return performanceUtils.shouldReduceAnimations(deviceType, isReducedMotion);
  }, [reduceAnimations, deviceType, isReducedMotion]);

  // Handle performance issues
  const handlePerformanceIssue = useCallback((issue: string) => {
    setPerformanceIssues(prev => [...prev, issue]);
  }, []);

  // Handle refresh with loading state
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  // Memoize common props to prevent unnecessary re-renders
  const commonProps = useMemo(() => ({
    title,
    subtitle,
    isLoading: isLoading || isRefreshing,
    error,
    onMenuToggle: () => console.log('Menu toggle'),
    onFilterToggle: () => console.log('Filter toggle'),
    onRetry,
  }), [title, subtitle, isLoading, isRefreshing, error, onRetry]);

  // Memoize KPI data for mobile layout
  const mobileKpiData = useMemo(() => [
    {
      title: 'Hoàn thành',
      value: `${overallCompletion}%`,
      subtitle: `${totalDocuments.approved}/${totalDocuments.required} hồ sơ`,
      icon: <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
        <span className="text-green-600 text-xs">✓</span>
      </div>,
      color: 'success' as const,
    },
    {
      title: 'Cảnh báo',
      value: redCardsData.total.toString(),
      subtitle: `${redCardsData.missing} thiếu, ${redCardsData.overdue} quá hạn`,
      icon: <div className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center">
        <span className="text-red-600 text-xs">!</span>
      </div>,
      color: 'error' as const,
    },
    {
      title: 'Thời gian xử lý',
      value: `${avgApprovalTime} ngày`,
      subtitle: 'Thời gian trung bình',
      icon: <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
        <span className="text-blue-600 text-xs">⏱</span>
      </div>,
      color: 'primary' as const,
    },
  ], [overallCompletion, totalDocuments, redCardsData, avgApprovalTime]);

  // Render content based on device type
  const renderContent = useCallback(() => {
    const content = (
      <>
        {/* Performance Monitor */}
        <PerformanceMonitor onPerformanceIssue={handlePerformanceIssue} />
        
        {/* Performance Issues Alert */}
        {performanceIssues.length > 0 && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p>Đã phát hiện các vấn đề hiệu suất:</p>
                <ul className="list-disc list-inside text-sm">
                  {performanceIssues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard Content */}
        {deviceType === 'mobile' && (
          <MobileLayout {...commonProps}>
            <div className="space-y-4">
              {/* Mobile KPI Cards */}
              <div className="mobile-kpi-grid">
                {mobileKpiData.map((kpi, index) => (
                  <div key={index} className="touch-button">
                    {/* Mobile KPI Card implementation */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{kpi.title}</p>
                          <p className="text-xl font-bold">{kpi.value}</p>
                          <p className="text-xs text-gray-500">{kpi.subtitle}</p>
                        </div>
                        {kpi.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Charts */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium mb-3">Tiến độ theo Nhà thầu</h3>
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                    <p className="text-gray-500 text-sm">Biểu đồ sẽ được hiển thị ở đây</p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium mb-3">Cảnh báo quan trọng</h3>
                  <div className="space-y-2">
                    {criticalAlerts.slice(0, 3).map((alert, index) => (
                      <div key={index} className="p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm font-medium text-red-900">{alert.docTypeName}</p>
                        <p className="text-xs text-red-700">{alert.contractorName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Workflow Section */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium mb-3">Workflow Management</h3>
                <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                  <Suspense fallback={<div className="text-gray-500 text-sm">Loading workflow dashboard...</div>}>
                    <LazyWorkflowDashboard workflowEngine={workflowEngine} />
                  </Suspense>
                </div>
              </div>
            </div>
          </MobileLayout>
        )}

        {deviceType === 'tablet' && (
          <TabletLayout {...commonProps}>
            <div className="space-y-6">
              {/* Tablet KPI Section */}
              <section>
                <h2 className="text-lg font-semibold mb-4">Chỉ số hiệu suất</h2>
                <div className="tablet-stacked-kpi">
                  <div className="grid grid-cols-2 gap-4">
                    {mobileKpiData.map((kpi, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">{kpi.title}</p>
                            <p className="text-xl font-bold">{kpi.value}</p>
                            <p className="text-xs text-gray-500">{kpi.subtitle}</p>
                          </div>
                          {kpi.icon}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Tablet Charts */}
              <section>
                <h2 className="text-lg font-semibold mb-4">Phân tích dữ liệu</h2>
                <div className="tablet-chart-grid">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-medium mb-3">Tiến độ theo Nhà thầu</h3>
                      <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                        <p className="text-gray-500 text-sm">Biểu đồ sẽ được hiển thị ở đây</p>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h3 className="text-sm font-medium mb-3">Phân loại Hồ sơ</h3>
                      <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                        <p className="text-gray-500 text-sm">Biểu đồ sẽ được hiển thị ở đây</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Tablet Workflow Section */}
              <section>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium mb-3">Workflow Management</h3>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                    <Suspense fallback={<div className="text-gray-500 text-sm">Loading workflow dashboard...</div>}>
                      <LazyWorkflowDashboard workflowEngine={workflowEngine} />
                    </Suspense>
                  </div>
                </div>
              </section>
            </div>
          </TabletLayout>
        )}

        {deviceType === 'desktop' && (
          <DesktopLayout {...commonProps}>
            <div className="space-y-6">
              {/* Desktop KPI Section */}
              <section>
                <div className="desktop-kpi-grid">
                  <div className="grid grid-cols-3 gap-6">
                    {mobileKpiData.map((kpi, index) => (
                      <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">{kpi.title}</p>
                            <p className="text-2xl font-bold">{kpi.value}</p>
                            <p className="text-xs text-gray-500">{kpi.subtitle}</p>
                          </div>
                          {kpi.icon}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Desktop Charts */}
              <section>
                <div className="desktop-chart-grid">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-medium mb-4">Tiến độ theo Nhà thầu</h3>
                      <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                        <p className="text-gray-500">Biểu đồ sẽ được hiển thị ở đây</p>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-medium mb-4">Phân loại Hồ sơ</h3>
                      <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                        <p className="text-gray-500">Biểu đồ sẽ được hiển thị ở đây</p>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-medium mb-4">Xu hướng thời gian</h3>
                      <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                        <p className="text-gray-500">Biểu đồ sẽ được hiển thị ở đây</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Workflow Dashboard Section */}
              <section>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium mb-4">Workflow Management</h3>
                  <div className="h-96 flex items-center justify-center bg-gray-50 rounded">
                    <Suspense fallback={<div className="text-gray-500">Loading workflow dashboard...</div>}>
                      <LazyWorkflowDashboard workflowEngine={workflowEngine} />
                    </Suspense>
                  </div>
                </div>
              </section>
            </div>
          </DesktopLayout>
        )}
      </>
    );

    // Wrap with Suspense if lazy loading is enabled
    if (shouldUseLazyLoading) {
      return (
        <Suspense fallback={<LoadingComponent deviceType={deviceType} />}>
          {content}
        </Suspense>
      );
    }

    return content;
  }, [
    deviceType,
    commonProps,
    performanceIssues,
    handlePerformanceIssue,
    mobileKpiData,
    criticalAlerts,
    shouldUseLazyLoading,
  ]);

  // Error fallback
  const errorFallback = (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg border border-gray-200 max-w-md w-full">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Đã xảy ra lỗi</h3>
          <p className="text-gray-600 mb-4">
            Không thể tải dashboard. Vui lòng thử lại.
          </p>
          <Button onClick={onRetry || (() => window.location.reload())}>
            Thử lại
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={errorFallback}>
      <div 
        className={cn(
          'responsive-dashboard',
          shouldReduceAnimations && 'reduce-animations',
          isTouchDevice && 'touch-enabled'
        )}
        style={{
          // Add CSS variables for responsive design
          '--viewport-width': `${width}px`,
          '--viewport-height': `${height}px`,
          '--device-type': deviceType,
        } as React.CSSProperties}
      >
        {renderContent()}
        
        {/* Refresh Button */}
        {onRefresh && (
          <Button
            className={cn(
              'fixed bottom-4 right-4 z-50',
              deviceType === 'mobile' ? 'bottom-20' : 'bottom-4'
            )}
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            {deviceType !== 'mobile' && <span className="ml-2">Làm mới</span>}
          </Button>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ResponsiveDashboard;