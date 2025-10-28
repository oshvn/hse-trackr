import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContractorPerformanceRadar } from './ContractorPerformanceRadar';
import { ContractorBarCharts } from './ContractorBarCharts';
import { ContractorHeatmap } from './ContractorHeatmap';
import { ContractorTrendChart } from './ContractorTrendChart';
import { ContractorRankingTable } from './ContractorRankingTable';
import type { KpiData, DocProgressData } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';
import { 
  Download, 
  Filter, 
  Settings, 
  BarChart3, 
  Radar as RadarIcon, 
  TrendingUp,
  Grid3X3,
  Table,
  Calendar,
  Eye
} from 'lucide-react';

interface ContractorComparisonDashboardProps {
  data: KpiData[];
  docProgressData?: DocProgressData[];
  className?: string;
}

interface DashboardConfig {
  showRadar: boolean;
  showBarCharts: boolean;
  showHeatmap: boolean;
  showTrends: boolean;
  showRankings: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // minutes
}

const DEFAULT_CONFIG: DashboardConfig = {
  showRadar: true,
  showBarCharts: true,
  showHeatmap: true,
  showTrends: true,
  showRankings: true,
  autoRefresh: false,
  refreshInterval: 5
};

const VIEW_MODES = [
  { value: 'overview', label: 'Tổng quan', icon: Grid3X3 },
  { value: 'radar', label: 'Biểu đồ Radar', icon: RadarIcon },
  { value: 'bars', label: 'Biểu đồ cột', icon: BarChart3 },
  { value: 'heatmap', label: 'Biểu đồ nhiệt', icon: Grid3X3 },
  { value: 'trends', label: 'Xu hướng', icon: TrendingUp },
  { value: 'rankings', label: 'Bảng xếp hạng', icon: Table }
];

export const ContractorComparisonDashboard: React.FC<ContractorComparisonDashboardProps> = ({
  data,
  docProgressData = [],
  className
}) => {
  const [activeView, setActiveView] = useState<string>('overview');
  const [selectedContractors, setSelectedContractors] = useState<string[]>([]);
  const [config, setConfig] = useState<DashboardConfig>(DEFAULT_CONFIG);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Export functionality
  const handleExport = useCallback((format: 'png' | 'pdf' | 'excel', view?: string) => {
    const exportView = view || activeView;
    console.log(`Exporting ${exportView} as ${format}`);
    // This would integrate with a library like html2canvas, jsPDF, or xlsx
  }, [activeView]);

  // Toggle dashboard components
  const toggleConfig = useCallback((key: keyof DashboardConfig) => {
    setConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  // Handle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Auto-refresh functionality
  const handleAutoRefresh = useCallback(() => {
    if (config.autoRefresh) {
      const interval = setInterval(() => {
        window.location.reload();
      }, config.refreshInterval * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [config.autoRefresh, config.refreshInterval]);

  React.useEffect(() => {
    const cleanup = handleAutoRefresh();
    return cleanup;
  }, [handleAutoRefresh]);

  if (!data?.length) {
    return (
      <Card className={cn('p-5 flex flex-col gap-3', className)}>
        <div>
          <h3 className="text-lg font-semibold">Contractor Comparison Dashboard</h3>
          <p className="text-sm text-muted-foreground">Comprehensive performance analysis and comparison</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No data available for contractor comparison
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className, isFullscreen && 'fixed inset-0 z-50 bg-background p-4')}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">So sánh Hiệu suất Nhà thầu</h2>
          <p className="text-sm text-muted-foreground">
            Phân tích và so sánh toàn diện hiệu suất các nhà thầu
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Selector */}
          <Select value={activeView} onValueChange={setActiveView}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Chọn chế độ xem" />
            </SelectTrigger>
            <SelectContent>
              {VIEW_MODES.map((mode) => {
                const Icon = mode.icon;
                return (
                  <SelectItem key={mode.value} value={mode.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {mode.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          {/* Contractor Filter */}
          <Select
            value={selectedContractors.join(',') || 'all'}
            onValueChange={(value) => setSelectedContractors(value === 'all' ? [] : value.split(','))}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Lọc nhà thầu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nhà thầu</SelectItem>
              {data.map((contractor) => (
                <SelectItem key={contractor.contractor_id} value={contractor.contractor_id}>
                  {contractor.contractor_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
            aria-label="Export as Excel"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Cài đặt Dashboard</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Hiển thị các component:</label>
              <div className="space-y-2">
                {Object.entries(config).filter(([key]) => key !== 'autoRefresh' && key !== 'refreshInterval').map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => toggleConfig(key as keyof DashboardConfig)}
                      className="rounded"
                    />
                    {key === 'showRadar' && 'Biểu đồ Radar'}
                    {key === 'showBarCharts' && 'Biểu đồ cột'}
                    {key === 'showHeatmap' && 'Biểu đồ nhiệt'}
                    {key === 'showTrends' && 'Xu hướng'}
                    {key === 'showRankings' && 'Bảng xếp hạng'}
                  </label>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tự động làm mới:</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.autoRefresh}
                    onChange={() => toggleConfig('autoRefresh')}
                    className="rounded"
                  />
                  Bật tự động làm mới
                </label>
                {config.autoRefresh && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Khoảng thời gian:</span>
                    <Select 
                      value={config.refreshInterval.toString()} 
                      onValueChange={(value) => setConfig(prev => ({ ...prev, refreshInterval: parseInt(value) }))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 phút</SelectItem>
                        <SelectItem value="5">5 phút</SelectItem>
                        <SelectItem value="10">10 phút</SelectItem>
                        <SelectItem value="30">30 phút</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Export:</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('png')}
                >
                  PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                >
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('excel')}
                >
                  Excel
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content */}
      <div className={cn('space-y-6', isFullscreen && 'overflow-y-auto max-h-screen')}>
        {activeView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {config.showRadar && (
              <ContractorPerformanceRadar
                data={data}
                docProgressData={docProgressData}
                className="col-span-1"
              />
            )}
            {config.showBarCharts && (
              <ContractorBarCharts
                data={data}
                docProgressData={docProgressData}
                className="col-span-1"
              />
            )}
            {config.showHeatmap && (
              <ContractorHeatmap
                data={data}
                docProgressData={docProgressData}
                className="col-span-1"
              />
            )}
            {config.showTrends && (
              <ContractorTrendChart
                data={data}
                docProgressData={docProgressData}
                className="col-span-1"
              />
            )}
          </div>
        )}
        
        {activeView === 'radar' && config.showRadar && (
          <ContractorPerformanceRadar
            data={data}
            docProgressData={docProgressData}
          />
        )}
        
        {activeView === 'bars' && config.showBarCharts && (
          <ContractorBarCharts
            data={data}
            docProgressData={docProgressData}
          />
        )}
        
        {activeView === 'heatmap' && config.showHeatmap && (
          <ContractorHeatmap
            data={data}
            docProgressData={docProgressData}
          />
        )}
        
        {activeView === 'trends' && config.showTrends && (
          <ContractorTrendChart
            data={data}
            docProgressData={docProgressData}
          />
        )}
        
        {activeView === 'rankings' && config.showRankings && (
          <ContractorRankingTable
            data={data}
            docProgressData={docProgressData}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
        <div className="flex items-center gap-4">
          <span>Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}</span>
          {config.autoRefresh && (
            <Badge variant="outline" className="text-xs">
              Tự động làm mới: {config.refreshInterval} phút
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>{data.length} nhà thầu</span>
          <span>{docProgressData.length} hồ sơ</span>
          {selectedContractors.length > 0 && (
            <span>{selectedContractors.length} nhà thầu được chọn</span>
          )}
        </div>
      </div>
    </div>
  );
};