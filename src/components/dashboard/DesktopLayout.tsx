import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Menu, 
  Home, 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  Filter,
  ChevronRight,
  ChevronDown,
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
  Minimize2,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  LayoutGrid,
  List,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getResponsiveKpiConfig, getResponsiveChartDimensions, getResponsiveTableConfig } from '@/lib/responsiveUtils';

interface DesktopLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onMenuToggle?: () => void;
  onFilterToggle?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

interface DesktopKpiCardProps {
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
  actions?: React.ReactNode;
}

interface DesktopChartCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  isLoading?: boolean;
  error?: string;
  onMaximize?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  className?: string;
  fullscreen?: boolean;
}

interface DesktopSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  notificationCount?: number;
}

interface DesktopDataTableProps {
  title: string;
  data: Array<Record<string, any>>;
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
  }>;
  isLoading?: boolean;
  onRowClick?: (row: Record<string, any>) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  actions?: React.ReactNode;
}

/**
 * Desktop KPI Card component with hover effects
 */
const DesktopKpiCard: React.FC<DesktopKpiCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'primary',
  onClick,
  isLoading = false,
  actions,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorClasses = {
    primary: 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100 hover:border-blue-300',
    success: 'bg-green-50 border-green-200 text-green-900 hover:bg-green-100 hover:border-green-300',
    warning: 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100 hover:border-amber-300',
    error: 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100 hover:border-red-300',
  };

  const trendIcons = {
    up: <ArrowUpRight className="h-4 w-4 text-green-600" />,
    down: <ArrowDownRight className="h-4 w-4 text-red-600" />,
    neutral: <div className="h-4 w-4 bg-gray-400 rounded-full" />,
  };

  if (isLoading) {
    return (
      <Card className="desktop-hover-card">
        <CardContent className="p-6">
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
        'desktop-hover-card cursor-pointer transition-all duration-300 relative overflow-hidden',
        colorClasses[color],
        isHovered && 'shadow-lg transform -translate-y-1'
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium opacity-80 mb-1">{title}</p>
            <p className="text-3xl font-bold mb-2">{value}</p>
            {subtitle && (
              <p className="text-sm opacity-70">{subtitle}</p>
            )}
          </div>
          <div className="ml-4 opacity-70">
            {icon}
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-2 mt-4">
            {trendIcons[trend.direction]}
            <span className="text-sm font-medium">
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs opacity-60">so với tháng trước</span>
          </div>
        )}
        {actions && (
          <div className={cn(
            'absolute top-2 right-2 opacity-0 transition-opacity duration-200',
            isHovered && 'opacity-100'
          )}>
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Desktop Chart Card component with full functionality
 */
const DesktopChartCard: React.FC<DesktopChartCardProps> = ({
  title,
  children,
  actions,
  isLoading = false,
  error,
  onMaximize,
  onRefresh,
  onExport,
  className,
  fullscreen = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (isLoading) {
    return (
      <Card className={cn('h-80', className)}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('h-80', className)}>
        <CardHeader>
          <CardTitle className="text-red-600">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
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
      'desktop-hover-card transition-all duration-300 relative',
      fullscreen ? 'fixed inset-4 z-50' : '',
      isHovered && 'shadow-lg',
      className
    )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className={cn(
            'flex items-center gap-1 opacity-0 transition-opacity duration-200',
            isHovered && 'opacity-100'
          )}>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-8 w-8 p-0"
                title="Làm mới"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {onExport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExport}
                className="h-8 w-8 p-0"
                title="Xuất dữ liệu"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onMaximize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMaximize}
                className="h-8 w-8 p-0"
                title="Phóng to"
              >
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
            {actions}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn(
        'relative',
        fullscreen ? 'h-[calc(100vh-140px)]' : 'h-64'
      )}>
        {children}
      </CardContent>
    </Card>
  );
};

/**
 * Desktop Sidebar component
 */
const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  isCollapsed,
  onToggle,
  activeTab,
  onTabChange,
  notificationCount = 0,
}) => {
  const menuItems = [
    { id: 'overview', label: 'Tổng quan', icon: <Home className="h-4 w-4" /> },
    { id: 'analytics', label: 'Phân tích', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'processing', label: 'Thời gian xử lý', icon: <Clock className="h-4 w-4" /> },
    { id: 'ai-actions', label: 'AI Actions', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'reports', label: 'Báo cáo', icon: <FileText className="h-4 w-4" /> },
    { id: 'settings', label: 'Cài đặt', icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className={cn(
      'bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold">HSE Trackr</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <nav className="flex-1 p-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1',
              activeTab === item.id 
                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700' 
                : 'text-gray-700 hover:bg-gray-50'
            )}
            onClick={() => onTabChange(item.id)}
            title={isCollapsed ? item.label : undefined}
          >
            {item.icon}
            {!isCollapsed && (
              <span className="flex-1 text-left">{item.label}</span>
            )}
            {item.id === 'ai-actions' && notificationCount > 0 && !isCollapsed && (
              <Badge variant="destructive" className="h-5 px-1 text-xs">
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </button>
        ))}
      </nav>
      
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-600">admin@hse.com</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Desktop Data Table component
 */
const DesktopDataTable: React.FC<DesktopDataTableProps> = ({
  title,
  data,
  columns,
  isLoading = false,
  onRowClick,
  onSort,
  actions,
}) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (column: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: column, direction });
    onSort?.(column, direction);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {actions}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'text-left py-3 px-4 font-medium text-gray-700',
                      column.width && `w-${column.width}`
                    )}
                  >
                    {column.sortable ? (
                      <button
                        className="flex items-center gap-1 hover:text-blue-600"
                        onClick={() => handleSort(column.key)}
                      >
                        {column.label}
                        {sortConfig?.key === column.key && (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )
                        )}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={index}
                  className={cn(
                    'border-b hover:bg-gray-50 cursor-pointer transition-colors',
                    onRowClick && 'hover:bg-blue-50'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="py-3 px-4">
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main Desktop Layout component
 */
export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  children,
  title = 'Dashboard',
  subtitle,
  onMenuToggle,
  onFilterToggle,
  isLoading = false,
  error = null,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFilterToggle = () => {
    setIsFilterOpen(!isFilterOpen);
    onFilterToggle?.();
  };

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    onMenuToggle?.();
  };

  // Sample KPI data for demonstration
  const sampleKpiData = [
    {
      title: 'Hoàn thành',
      value: '78%',
      subtitle: '156/200 hồ sơ',
      trend: { value: 5, direction: 'up' as const },
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'success' as const,
    },
    {
      title: 'Chờ xử lý',
      value: '32',
      subtitle: 'Tăng 8% so với tuần trước',
      trend: { value: 8, direction: 'up' as const },
      icon: <Clock className="h-6 w-6" />,
      color: 'warning' as const,
    },
    {
      title: 'Quá hạn',
      value: '12',
      subtitle: 'Giảm 3% so với tuần trước',
      trend: { value: -3, direction: 'down' as const },
      icon: <AlertTriangle className="h-6 w-6" />,
      color: 'error' as const,
    },
    {
      title: 'Thời gian xử lý TB',
      value: '2.4 ngày',
      subtitle: 'Cải thiện 15%',
      trend: { value: -15, direction: 'down' as const },
      icon: <Clock className="h-6 w-6" />,
      color: 'primary' as const,
    },
    {
      title: 'Hiệu suất',
      value: '94%',
      subtitle: 'Vượt mục tiêu 4%',
      trend: { value: 4, direction: 'up' as const },
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'success' as const,
    },
    {
      title: 'Chất lượng',
      value: 'A+',
      subtitle: 'Đánh giá xuất sắc',
      trend: { value: 2, direction: 'up' as const },
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'success' as const,
    },
  ];

  // Sample table data
  const sampleTableData = [
    { id: 1, name: 'Hồ sơ an toàn lao động', contractor: 'Nhà thầu A', status: 'Đã duyệt', date: '2024-01-15' },
    { id: 2, name: 'Kế hoạch PCCC', contractor: 'Nhà thầu B', status: 'Chờ duyệt', date: '2024-01-14' },
    { id: 3, name: 'Báo cáo môi trường', contractor: 'Nhà thầu C', status: 'Đã duyệt', date: '2024-01-13' },
    { id: 4, name: 'Hồ sơ chất lượng', contractor: 'Nhà thầu D', status: 'Quá hạn', date: '2024-01-12' },
    { id: 5, name: 'Kế hoạch đào tạo', contractor: 'Nhà thầu E', status: 'Đang xử lý', date: '2024-01-11' },
  ];

  const tableColumns = [
    { key: 'name', label: 'Tên hồ sơ', sortable: true },
    { key: 'contractor', label: 'Nhà thầu', sortable: true },
    { key: 'status', label: 'Trạng thái', sortable: true },
    { key: 'date', label: 'Ngày gửi', sortable: true },
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <DesktopSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={handleSidebarToggle}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        notificationCount={2}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-gray-600">{subtitle}</p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleFilterToggle}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Bộ lọc
              </Button>
              
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Xuất báo cáo
              </Button>
              
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Thêm mới
              </Button>
              
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  2
                </Badge>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1">
          <ScrollArea className="h-full">
            <div className="responsive-container">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsContent value="overview" className="mt-0 space-y-6">
                  {/* KPI Section */}
                  <section>
                    <div className="desktop-kpi-grid">
                      {sampleKpiData.map((kpi, index) => (
                        <DesktopKpiCard
                          key={index}
                          {...kpi}
                          isLoading={isLoading}
                          actions={
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          }
                        />
                      ))}
                    </div>
                  </section>

                  {/* Charts Section */}
                  <section>
                    <div className="desktop-chart-grid">
                      <DesktopChartCard
                        title="Tiến độ theo Nhà thầu"
                        isLoading={isLoading}
                        onRefresh={() => console.log('Refresh chart')}
                        onExport={() => console.log('Export chart')}
                        onMaximize={() => console.log('Maximize chart')}
                      >
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded">
                          <p className="text-gray-500">Biểu đồ sẽ được hiển thị ở đây</p>
                        </div>
                      </DesktopChartCard>
                      
                      <DesktopChartCard
                        title="Phân loại Hồ sơ"
                        isLoading={isLoading}
                        onRefresh={() => console.log('Refresh chart')}
                        onExport={() => console.log('Export chart')}
                        onMaximize={() => console.log('Maximize chart')}
                      >
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded">
                          <p className="text-gray-500">Biểu đồ sẽ được hiển thị ở đây</p>
                        </div>
                      </DesktopChartCard>
                      
                      <DesktopChartCard
                        title="Xu hướng thời gian"
                        isLoading={isLoading}
                        onRefresh={() => console.log('Refresh chart')}
                        onExport={() => console.log('Export chart')}
                        onMaximize={() => console.log('Maximize chart')}
                        className="desktop-full-width"
                      >
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded">
                          <p className="text-gray-500">Biểu đồ sẽ được hiển thị ở đây</p>
                        </div>
                      </DesktopChartCard>
                    </div>
                  </section>

                  {/* Data Tables Section */}
                  <section>
                    <div className="desktop-side-by-side">
                      <DesktopDataTable
                        title="Hồ sơ gần đây"
                        data={sampleTableData}
                        columns={tableColumns}
                        isLoading={isLoading}
                        onRowClick={(row) => console.log('Row clicked:', row)}
                        onSort={(column, direction) => console.log('Sort:', column, direction)}
                        actions={
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                      
                      <DesktopDataTable
                        title="Cảnh báo quan trọng"
                        data={sampleTableData.slice(0, 3)}
                        columns={tableColumns}
                        isLoading={isLoading}
                        onRowClick={(row) => console.log('Alert row clicked:', row)}
                        onSort={(column, direction) => console.log('Alert sort:', column, direction)}
                      />
                    </div>
                  </section>
                </TabsContent>

                <TabsContent value="analytics" className="mt-0">
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Phân tích chi tiết</h2>
                    <div className="desktop-chart-grid">
                      <DesktopChartCard
                        title="Phân tích xu hướng"
                        isLoading={isLoading}
                        onRefresh={() => console.log('Refresh chart')}
                        onExport={() => console.log('Export chart')}
                        onMaximize={() => console.log('Maximize chart')}
                      >
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded">
                          <p className="text-gray-500">Biểu đồ phân tích sẽ được hiển thị ở đây</p>
                        </div>
                      </DesktopChartCard>
                      
                      <DesktopChartCard
                        title="So sánh hiệu suất"
                        isLoading={isLoading}
                        onRefresh={() => console.log('Refresh chart')}
                        onExport={() => console.log('Export chart')}
                        onMaximize={() => console.log('Maximize chart')}
                      >
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded">
                          <p className="text-gray-500">Biểu đồ so sánh sẽ được hiển thị ở đây</p>
                        </div>
                      </DesktopChartCard>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="processing" className="mt-0">
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Thời gian xử lý</h2>
                    <div className="desktop-chart-grid">
                      <DesktopChartCard
                        title="Thời gian xử lý TB"
                        isLoading={isLoading}
                        onRefresh={() => console.log('Refresh chart')}
                        onExport={() => console.log('Export chart')}
                        onMaximize={() => console.log('Maximize chart')}
                      >
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded">
                          <p className="text-gray-500">Biểu đồ thời gian sẽ được hiển thị ở đây</p>
                        </div>
                      </DesktopChartCard>
                      
                      <DesktopChartCard
                        title="Tắc nghẽn quy trình"
                        isLoading={isLoading}
                        onRefresh={() => console.log('Refresh chart')}
                        onExport={() => console.log('Export chart')}
                        onMaximize={() => console.log('Maximize chart')}
                      >
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded">
                          <p className="text-gray-500">Biểu đồ tắc nghẽn sẽ được hiển thị ở đây</p>
                        </div>
                      </DesktopChartCard>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ai-actions" className="mt-0">
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">AI Actions</h2>
                    {children}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
};

export default DesktopLayout;