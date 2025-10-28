import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Clock, Target, BarChart3 } from 'lucide-react';
import { ProcessingTimeMetrics } from '@/lib/dashboardHelpers';
import { formatDays } from '@/lib/dashboardHelpers';

interface ProcessingTimeDashboardProps {
  metrics: ProcessingTimeMetrics;
  isLoading?: boolean;
}

export const ProcessingTimeDashboard: React.FC<ProcessingTimeDashboardProps> = ({
  metrics,
  isLoading = false
}) => {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-red-600';
      case 'down':
        return 'text-green-600';
      case 'stable':
        return 'text-gray-600';
    }
  };

  const getVsTargetColor = (percentage: number) => {
    if (percentage > 20) return 'text-red-600';
    if (percentage > 10) return 'text-amber-600';
    if (percentage > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getVsTargetBadge = (percentage: number) => {
    if (percentage > 20) return { variant: 'destructive' as const, label: 'Quá cao' };
    if (percentage > 10) return { variant: 'secondary' as const, label: 'Cao' };
    if (percentage > 0) return { variant: 'outline' as const, label: 'Hơi cao' };
    return { variant: 'default' as const, label: 'Tốt' };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-[180px]">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-bold">Thời gian Xử lý Hồ sơ</h2>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Preparation Time Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Thời gian Chuẩn bị TB
              </CardTitle>
              <Target className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {formatDays(metrics.averagePrepDays)}
                </span>
                <span className="text-sm text-gray-500">ngày</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {getTrendIcon(metrics.prepTimeTrend)}
                  <span className={`text-sm font-medium ${getTrendColor(metrics.prepTimeTrend)}`}>
                    {metrics.prepTimeTrend === 'up' ? 'Tăng' : 
                     metrics.prepTimeTrend === 'down' ? 'Giảm' : 'Ổn định'}
                  </span>
                  <span className="text-xs text-gray-500">
                    vs tuần trước ({formatDays(metrics.lastWeekPrepDays)})
                  </span>
                </div>
                
                <Badge 
                  variant={getVsTargetBadge(metrics.prepTimeVsTarget).variant}
                  className="text-xs"
                >
                  {getVsTargetBadge(metrics.prepTimeVsTarget).label}
                </Badge>
              </div>
              
              <div className="text-xs text-gray-500">
                Mục tiêu: {formatDays(metrics.targetPrepDays)} 
                <span className={`ml-1 font-medium ${getVsTargetColor(metrics.prepTimeVsTarget)}`}>
                  ({metrics.prepTimeVsTarget > 0 ? '+' : ''}{metrics.prepTimeVsTarget}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Time Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Thời gian Phê duyệt TB
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {formatDays(metrics.averageApprovalDays)}
                </span>
                <span className="text-sm text-gray-500">ngày</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {getTrendIcon(metrics.approvalTimeTrend)}
                  <span className={`text-sm font-medium ${getTrendColor(metrics.approvalTimeTrend)}`}>
                    {metrics.approvalTimeTrend === 'up' ? 'Tăng' : 
                     metrics.approvalTimeTrend === 'down' ? 'Giảm' : 'Ổn định'}
                  </span>
                  <span className="text-xs text-gray-500">
                    vs tuần trước ({formatDays(metrics.lastWeekApprovalDays)})
                  </span>
                </div>
                
                <Badge 
                  variant={getVsTargetBadge(metrics.approvalTimeVsTarget).variant}
                  className="text-xs"
                >
                  {getVsTargetBadge(metrics.approvalTimeVsTarget).label}
                </Badge>
              </div>
              
              <div className="text-xs text-gray-500">
                Mục tiêu: {formatDays(metrics.targetApprovalDays)} 
                <span className={`ml-1 font-medium ${getVsTargetColor(metrics.approvalTimeVsTarget)}`}>
                  ({metrics.approvalTimeVsTarget > 0 ? '+' : ''}{metrics.approvalTimeVsTarget}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Processing Time Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tổng thời gian Xử lý TB
              </CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {formatDays(metrics.averageTotalDays)}
                </span>
                <span className="text-sm text-gray-500">ngày</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {getTrendIcon(metrics.totalTimeTrend)}
                  <span className={`text-sm font-medium ${getTrendColor(metrics.totalTimeTrend)}`}>
                    {metrics.totalTimeTrend === 'up' ? 'Tăng' : 
                     metrics.totalTimeTrend === 'down' ? 'Giảm' : 'Ổn định'}
                  </span>
                  <span className="text-xs text-gray-500">
                    vs tuần trước ({formatDays(metrics.lastWeekTotalDays)})
                  </span>
                </div>
                
                <Badge 
                  variant={getVsTargetBadge(metrics.totalTimeVsTarget).variant}
                  className="text-xs"
                >
                  {getVsTargetBadge(metrics.totalTimeVsTarget).label}
                </Badge>
              </div>
              
              <div className="text-xs text-gray-500">
                Mục tiêu: {formatDays(metrics.targetTotalDays)} 
                <span className={`ml-1 font-medium ${getVsTargetColor(metrics.totalTimeVsTarget)}`}>
                  ({metrics.totalTimeVsTarget > 0 ? '+' : ''}{metrics.totalTimeVsTarget}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Phân tích Hiệu suất</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Điểm mạnh</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {metrics.prepTimeVsTarget <= 0 && (
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Thời gian chuẩn bị đạt mục tiêu
                  </li>
                )}
                {metrics.approvalTimeVsTarget <= 0 && (
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Thời gian phê duyệt hiệu quả
                  </li>
                )}
                {metrics.totalTimeVsTarget <= 0 && (
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Tổng thời gian xử lý tối ưu
                  </li>
                )}
                {(metrics.prepTimeTrend === 'down' || metrics.approvalTimeTrend === 'down') && (
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Có xu hướng cải thiện
                  </li>
                )}
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Cần cải thiện</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {metrics.prepTimeVsTarget > 20 && (
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Thời gian chuẩn bị quá cao
                  </li>
                )}
                {metrics.approvalTimeVsTarget > 20 && (
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Quy trình phê duyệt cần tối ưu
                  </li>
                )}
                {metrics.totalTimeVsTarget > 20 && (
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Tổng thời gian xử lý cần cải thiện
                  </li>
                )}
                {(metrics.prepTimeTrend === 'up' || metrics.approvalTimeTrend === 'up') && (
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    Xu hướng tăng cần theo dõi
                  </li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessingTimeDashboard;