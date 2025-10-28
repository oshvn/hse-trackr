import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, CheckCircle, FileText, AlertCircle, Eye, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface KpiCardData {
  title: string;
  value: string;
  subtitle: string;
  tooltip?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'info';
  actionButton?: {
    text: string;
    onClick: () => void;
  };
  details?: string[];
}

interface KpiCardsProps {
  data?: {
    overallCompletion?: number;
    totalDocuments?: { approved: number; required: number };
    estimatedCompletion?: string;
    redCardsTotal?: number;
    redCardsMissing?: number;
    redCardsOverdue?: number;
    contractorsCantStart?: number;
    avgApprovalTime?: number;
    avgPrepTime?: number;
    lastWeekApprovalTime?: number;
    targetApprovalTime?: number;
  } | null;
  isLoading?: boolean;
  error?: string | null;
  onViewCompletionDetails?: () => void;
  onViewRedCardsDetails?: () => void;
  onViewApprovalTimeDetails?: () => void;
  className?: string;
  compact?: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  data = null,
  isLoading = false,
  error,
  onViewCompletionDetails,
  onViewRedCardsDetails,
  onViewApprovalTimeDetails,
  className,
  compact = false
}) => {
  // Safe data extraction with defaults
  const totalApproved = data?.totalDocuments?.approved ?? 0;
  const totalRequired = data?.totalDocuments?.required ?? 32;
  const redCardsCount = data?.redCardsTotal ?? 0;
  const missingDocsCount = data?.redCardsMissing ?? 0;
  const overdueDocsCount = data?.redCardsOverdue ?? 0;
  const contractorsCantStart = data?.contractorsCantStart ?? 0;
  const estimatedCompletion = data?.estimatedCompletion ?? 'N/A';
  const overallCompletion = data?.overallCompletion ?? 0;
  const avgApprovalTime = data?.avgApprovalTime ?? 0;
  const avgPrepTime = data?.avgPrepTime ?? 0;
  const lastWeekApprovalTime = data?.lastWeekApprovalTime ?? 0;
  const targetApprovalTime = data?.targetApprovalTime ?? 3;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((index) => (
          <Card key={index} className="p-6">
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-3 w-full mb-4" />
            <Skeleton className="h-9 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const cards: KpiCardData[] = [
    {
      title: 'Tỷ lệ Hoàn thành Toàn bộ Hồ sơ',
      value: `${overallCompletion}%`,
      subtitle: `${totalApproved}/${totalRequired} yêu cầu đã duyệt`,
      tooltip: 'Tỷ lệ hoàn thành tổng thể của tất cả các hồ sơ yêu cầu',
      trend: overallCompletion >= 80 ? 'up' : overallCompletion >= 50 ? 'neutral' : 'down',
      icon: <CheckCircle className="h-5 w-5" />,
      variant: overallCompletion >= 80 ? 'success' : overallCompletion >= 50 ? 'warning' : 'default',
      details: [
        `Dự kiến hoàn thành: ${estimatedCompletion}`,
        `Còn lại: ${totalRequired - totalApproved} hồ sơ`
      ],
      actionButton: {
        text: 'Xem chi tiết theo loại hồ sơ',
        onClick: () => onViewCompletionDetails?.()
      }
    },
    {
      title: 'Red Cards - Cảnh báo Rủi ro Thi công',
      value: redCardsCount.toString(),
      subtitle: `${missingDocsCount} thiếu + ${overdueDocsCount} quá hạn`,
      tooltip: 'Tổng số red cards và phân loại rủi ro',
      trend: redCardsCount === 0 ? 'up' : 'down',
      icon: <AlertCircle className="h-5 w-5" />,
      variant: redCardsCount === 0 ? 'success' : 'warning',
      details: [
        `${contractorsCantStart} nhà thầu chưa thể bắt đầu thi công`,
        'Cần hành động khẩn cấp'
      ],
      actionButton: {
        text: 'Xem danh sách chi tiết',
        onClick: () => onViewRedCardsDetails?.()
      }
    },
    {
      title: 'Thời gian Phê duyệt Trung bình',
      value: `${avgApprovalTime} ngày`,
      subtitle: `Chuẩn bị: ${avgPrepTime} ngày + Phê duyệt: ${avgApprovalTime} ngày`,
      tooltip: 'Thời gian phê duyệt trung bình so với tuần trước và mục tiêu',
      trend: avgApprovalTime <= targetApprovalTime ? 'up' : avgApprovalTime <= targetApprovalTime + 2 ? 'neutral' : 'down',
      icon: <Clock className="h-5 w-5" />,
      variant: avgApprovalTime <= targetApprovalTime ? 'success' : avgApprovalTime <= targetApprovalTime + 2 ? 'warning' : 'default',
      details: [
        `So với tuần trước: ${lastWeekApprovalTime > 0 ? `${avgApprovalTime - lastWeekApprovalTime > 0 ? '+' : ''}${avgApprovalTime - lastWeekApprovalTime} ngày` : 'N/A'}`,
        `Mục tiêu: ${targetApprovalTime} ngày`
      ],
      actionButton: {
        text: 'Xem chi tiết theo nhà thầu',
        onClick: () => onViewApprovalTimeDetails?.()
      }
    }
  ];

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getIconStyles = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-amber-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Card className={`p-6 ${getVariantStyles(card.variant)} hover:shadow-md transition-shadow`}>
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={getIconStyles(card.variant)}>
                        {card.icon}
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {card.title}
                      </span>
                    </div>
                    <div className="flex-shrink-0">
                      {getTrendIcon(card.trend || 'neutral')}
                    </div>
                  </div>
                  
                  <div className="text-3xl font-bold mb-2">
                    {card.value}
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-4">
                    {card.subtitle}
                  </div>
                  
                  {card.details && (
                    <div className="space-y-1 mb-4 flex-grow">
                      {card.details.map((detail, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground">
                          • {detail}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {card.actionButton && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-auto"
                      onClick={card.actionButton.onClick}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {card.actionButton.text}
                    </Button>
                  )}
                </div>
              </Card>
            </TooltipTrigger>
            {card.tooltip && (
              <TooltipContent>
                <p className="max-w-xs">{card.tooltip}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};