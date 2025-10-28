import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Menu, 
  Home, 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  Filter,
  ChevronRight,
  Plus,
  Search,
  Bell,
  Settings,
  User,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  MessageSquare,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getResponsiveKpiConfig, getResponsiveChartDimensions, getResponsiveTableConfig } from '@/lib/responsiveUtils';

interface TabletLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onMenuToggle?: () => void;
  onFilterToggle?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

interface TabletKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error';
  onClick?: () => void;
  isLoading?: boolean;
  compact?: boolean;
}

interface TabletChartCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  isLoading?: boolean;
  error?: string;
  onMaximize?: () => void;
  onRefresh?: () => void;
  className?: string;
}

interface TabletNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  notificationCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * Tablet KPI Card component
 */
const TabletKpiCard: React.FC<TabletKpiCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'primary',
  onClick,
  isLoading = false,
  compact = false,
}) => {
  const colorClasses = {
    primary: 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100',
    success: 'bg-green-50 border-green-200 text-green-900 hover:bg-green-100',
    warning: 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100',
    error: 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100',
  };

  const trendIcons = {
    up: <TrendingUp className="h-4 w-4 text-green-600" />,
    down: <TrendingDown className="h-4 w-4 text-red-600" />,
    neutral: <div className="h-4 w-4 bg-gray-400 rounded-full" />,
  };

  const sizeClasses = compact 
    ? 'p-3' 
    : 'p-4';

  if (isLoading) {
    return (
      <Card className={cn('cursor-pointer transition-all duration-200 hover:shadow-md', sizeClasses)}>
        <CardContent className="p-0">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-8 w-1/2 mb-1" />
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md active:scale-98',
        colorClasses[color],
        sizeClasses
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={cn(
              'font-medium opacity-80',
              compact ? 'text-sm' : 'text-base'
            )}>{title}</p>
            <p className={cn(
              'font-bold mt-1',
              compact ? 'text-xl' : 'text-2xl'
            )}>{value}</p>
            {subtitle && (
              <p className={cn(
                'opacity-70 mt-1',
                compact ? 'text-xs' : 'text-sm'
              )}>{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className={cn(
              'opacity-70',
              compact ? 'ml-2' : 'ml-3'
            )}>
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trendIcons[trend.direction]}
            <span className={cn(
              'font-medium',
              compact ? 'text-xs' : 'text-sm'
            )}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Tablet Chart Card component
 */
const TabletChartCard: React.FC<TabletChartCardProps> = ({
  title,
  children,
  actions,
  isLoading = false,
  error,
  onMaximize,
  onRefresh,
  className,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    onMaximize?.();
  };

  if (isLoading) {
    return (
      <Card className={cn('h-64', className)}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('h-64', className)}>
        <CardHeader>
          <CardTitle className="text-red-600">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'transition-all duration-300',
      isMaximized ? 'fixed inset-4 z-50' : '',
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {actions}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMaximize}
              className="h-8 w-8 p-0"
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-8 w-8 p-0"
              >
                <Clock className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn(
        'relative',
        isMaximized ? 'h-[calc(100vh-120px)]' : 'h-48'
      )}>
        {children}
      </CardContent>
    </Card>
  );
};

/**
 * Tablet Navigation component
 */
const TabletNavigation: React.FC<TabletNavigationProps> = ({
  activeTab,
  onTabChange,
  notificationCount = 0,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: <Home className="h-4 w-4" /> },
    { id: 'analytics', label: 'Phân tích', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'processing', label: 'Xử lý', icon: <Clock className="h-4 w-4" /> },
    { id: 'ai-actions', label: 'AI Actions', icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <div className="tablet-nav">
      <div className="flex items-center gap-2">
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        )}
        
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              'tablet-tab flex items-center gap-2',
              activeTab === tab.id && 'active'
            )}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon}
            {!isCollapsed && <span>{tab.label}</span>}
            {tab.id === 'ai-actions' && notificationCount > 0 && !isCollapsed && (
              <Badge variant="destructive" className="h-5 px-1 text-xs">
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Tablet Stacked KPI component
 */
const TabletStackedKpi: React.FC<{
  kpiData: Array<{
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: {
      value: number;
      direction: 'up' | 'down' | 'neutral';
    };
    icon?: React.ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'error';
  }>;
  isLoading?: boolean;
}> = ({ kpiData, isLoading = false }) => {
  const config = getResponsiveKpiConfig('tablet');
  
  return (
    <div className="tablet-stacked-kpi">
      <div className={cn(
        'grid gap-3',
        config.columns === 2 ? 'grid-cols-2' : 'grid-cols-1'
      )}>
        {kpiData.map((kpi, index) => (
          <TabletKpiCard
            key={index}
            {...kpi}
            isLoading={isLoading}
            compact={config.compact}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Tablet Compact Chart component
 */
const TabletCompactChart: React.FC<{
  title: string;
  type: 'bar' | 'line' | 'pie' | 'radar';
  data?: any;
  isLoading?: boolean;
  error?: string;
}> = ({ title, type, data, isLoading = false, error }) => {
  const dimensions = getResponsiveChartDimensions('tablet');
  
  return (
    <TabletChartCard
      title={title}
      isLoading={isLoading}
      error={error}
      className="tablet-compact-chart"
    >
      <div className="h-full flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-500">
          {isLoading ? 'Đang tải...' : `${type} chart sẽ được hiển thị ở đây`}
        </p>
      </div>
    </TabletChartCard>
  );
};

/**
 * Main Tablet Layout component
 */
export const TabletLayout: React.FC<TabletLayoutProps> = ({
  children,
  title = 'Dashboard',
  subtitle,
  onMenuToggle,
  onFilterToggle,
  isLoading = false,
  error = null,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFilterToggle = () => {
    setIsFilterOpen(!isFilterOpen);
    onFilterToggle?.();
  };

  const handleNavToggle = () => {
    setIsNavCollapsed(!isNavCollapsed);
    onMenuToggle?.();
  };

  // Sample KPI data for demonstration
  const sampleKpiData = [
    {
      title: 'Hoàn thành',
      value: '78%',
      subtitle: '156/200 hồ sơ',
      trend: { value: 5, direction: 'up' as const },
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'success' as const,
    },
    {
      title: 'Chờ xử lý',
      value: '32',
      subtitle: 'Tăng 8% so với tuần trước',
      trend: { value: 8, direction: 'up' as const },
      icon: <Clock className="h-5 w-5" />,
      color: 'warning' as const,
    },
    {
      title: 'Quá hạn',
      value: '12',
      subtitle: 'Giảm 3% so với tuần trước',
      trend: { value: -3, direction: 'down' as const },
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'error' as const,
    },
    {
      title: 'Thời gian xử lý TB',
      value: '2.4 ngày',
      subtitle: 'Cải thiện 15%',
      trend: { value: -15, direction: 'down' as const },
      icon: <Clock className="h-5 w-5" />,
      color: 'primary' as const,
    },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Đã xảy ra lỗi</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNavToggle}
              className="h-8 w-8 p-0"
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            <div>
              <h1 className="text-xl font-semibold">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleFilterToggle}
              className="h-8 px-3"
            >
              <Filter className="h-4 w-4 mr-2" />
              Bộ lọc
            </Button>
            
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                2
              </Badge>
            </Button>
            
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <TabletNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        notificationCount={2}
        isCollapsed={isNavCollapsed}
        onToggleCollapse={handleNavToggle}
      />

      {/* Main Content */}
      <main className="flex-1">
        <ScrollArea className="h-full">
          <div className="responsive-container">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="overview" className="mt-0 space-y-6">
                {/* KPI Section */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">Chỉ số hiệu suất</h2>
                  <TabletStackedKpi kpiData={sampleKpiData} isLoading={isLoading} />
                </section>

                {/* Charts Section */}
                <section>
                  <h2 className="text-lg font-semibold mb-4">Phân tích dữ liệu</h2>
                  <div className="tablet-chart-grid">
                    <TabletCompactChart
                      title="Tiến độ theo Nhà thầu"
                      type="bar"
                      isLoading={isLoading}
                    />
                    <TabletCompactChart
                      title="Phân loại Hồ sơ"
                      type="pie"
                      isLoading={isLoading}
                    />
                    <TabletCompactChart
                      title="Xu hướng thời gian"
                      type="line"
                      isLoading={isLoading}
                    />
                    <TabletCompactChart
                      title="Hiệu suất so sánh"
                      type="radar"
                      isLoading={isLoading}
                    />
                  </div>
                </section>

                {/* Main Content Area */}
                <section>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Danh sách hồ sơ gần đây</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[1, 2, 3, 4, 5].map((item) => (
                            <div key={item} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Hồ sơ {item}</p>
                                  <p className="text-xs text-gray-600">2 giờ trước</p>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Cảnh báo quan trọng</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[1, 2, 3].map((item) => (
                            <div key={item} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-red-900">Cảnh báo {item}</p>
                                  <p className="text-xs text-red-700 mt-1">
                                    Mô tả chi tiết về cảnh báo cần xử lý
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Phân tích chi tiết</h2>
                  <div className="tablet-chart-grid">
                    <TabletCompactChart
                      title="Phân tích xu hướng"
                      type="line"
                      isLoading={isLoading}
                    />
                    <TabletCompactChart
                      title="So sánh hiệu suất"
                      type="bar"
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="processing" className="mt-0">
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Thời gian xử lý</h2>
                  <div className="tablet-chart-grid">
                    <TabletCompactChart
                      title="Thời gian xử lý TB"
                      type="bar"
                      isLoading={isLoading}
                    />
                    <TabletCompactChart
                      title="Tắc nghẽn quy trình"
                      type="pie"
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ai-actions" className="mt-0">
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">AI Actions</h2>
                  {children}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default TabletLayout;