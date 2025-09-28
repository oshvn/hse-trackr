import React from 'react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface KpiCardData {
  title: string;
  value: string;
  subtitle: string;
  tooltip?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'info';
}

interface KpiCardsProps {
  overallCompletion: number;
  mustHaveReady: number;
  overdueMustHaves: number;
  avgPrepTime: number;
  avgApprovalTime: number;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  overallCompletion,
  mustHaveReady,
  overdueMustHaves,
  avgPrepTime,
  avgApprovalTime
}) => {
  const cards: KpiCardData[] = [
    {
      title: 'Overall Completion',
      value: `${overallCompletion}%`,
      subtitle: 'Approved documents',
      tooltip: 'Percentage of required documents that have been approved',
      trend: overallCompletion >= 80 ? 'up' : overallCompletion >= 50 ? 'neutral' : 'down',
      icon: <CheckCircle className="h-5 w-5" />,
      variant: overallCompletion >= 80 ? 'success' : 'default'
    },
    {
      title: 'Must-have Ready',
      value: `${mustHaveReady}%`,
      subtitle: 'Critical documents approved',
      tooltip: 'Percentage of critical documents that have at least one approved submission',
      trend: mustHaveReady >= 90 ? 'up' : mustHaveReady >= 70 ? 'neutral' : 'down',
      icon: <AlertTriangle className="h-5 w-5" />,
      variant: mustHaveReady >= 90 ? 'success' : mustHaveReady >= 70 ? 'info' : 'warning'
    },
    {
      title: 'Overdue Must-Haves',
      value: overdueMustHaves.toString(),
      subtitle: 'Critical items past due',
      tooltip: 'Number of critical documents that are overdue and not yet approved',
      trend: overdueMustHaves === 0 ? 'up' : 'down',
      icon: <AlertTriangle className="h-5 w-5" />,
      variant: overdueMustHaves === 0 ? 'success' : 'warning'
    },
    {
      title: 'Avg Prep Time',
      value: avgPrepTime > 0 ? `${avgPrepTime} days` : '—',
      subtitle: 'From start to submission',
      tooltip: 'Average time from document preparation start to submission',
      trend: avgPrepTime <= 5 ? 'up' : avgPrepTime <= 10 ? 'neutral' : 'down',
      icon: <Clock className="h-5 w-5" />,
      variant: 'info'
    },
    {
      title: 'Avg Approval Time',
      value: avgApprovalTime > 0 ? `${avgApprovalTime} days` : '—',
      subtitle: 'From submission to approval',
      tooltip: 'Average time from document submission to final approval',
      trend: avgApprovalTime <= 3 ? 'up' : avgApprovalTime <= 7 ? 'neutral' : 'down',
      icon: <Clock className="h-5 w-5" />,
      variant: 'info'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Card className={`p-4 h-24 ${getVariantStyles(card.variant)}`}>
                <div className="flex items-start justify-between h-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={getIconStyles(card.variant)}>
                        {card.icon}
                      </div>
                      <span className="text-sm font-medium text-muted-foreground truncate">
                        {card.title}
                      </span>
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      {card.value}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {card.subtitle}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {getTrendIcon(card.trend || 'neutral')}
                  </div>
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