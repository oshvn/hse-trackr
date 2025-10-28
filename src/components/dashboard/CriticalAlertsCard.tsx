import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, CheckCircle2, List, XCircle, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import type { RedCardItem } from '@/lib/dashboardHelpers';
import { RED_CARD_LEVELS } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';
import './redCardsAnimations.css';

interface CriticalAlertsCardProps {
  redCards: {
    level1: RedCardItem[];
    level2: RedCardItem[];
    level3: RedCardItem[];
    all: RedCardItem[];
  };
  onSelect: (contractorId: string, docTypeId: string) => void;
  onViewAll?: () => void;
  className?: string;
  maxItems?: number;
  showStatistics?: boolean;
}

// Icon mapping for warning levels
const WarningIcons = {
  1: Clock,
  2: AlertCircle,
  3: XCircle,
};

export const CriticalAlertsCard: React.FC<CriticalAlertsCardProps> = ({
  redCards = { level1: [], level2: [], level3: [], all: [] },
  onSelect,
  onViewAll,
  className,
  maxItems = 3,
  showStatistics = true,
}) => {
  const { level1 = [], level2 = [], level3 = [], all = [] } = redCards || { level1: [], level2: [], level3: [], all: [] };
  const totalAlerts = all?.length ?? 0;

  if (totalAlerts === 0) {
    return (
      <Card className={cn('p-5 flex flex-col justify-between', className)}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-semibold">Red Cards</h3>
          <Badge variant="outline" className="ml-auto text-emerald-600 border-emerald-200">
            Clear
          </Badge>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-2">
            <p className="font-medium text-emerald-600">All documents are on track.</p>
            <p className="text-sm">No red cards at this time.</p>
          </div>
        </div>
      </Card>
    );
  }

  // Get visible items by priority (level 3 first, then 2, then 1)
  const getVisibleItems = () => {
    const itemsByPriority = [...level3, ...level2, ...level1];
    return itemsByPriority.slice(0, maxItems);
  };

  const visibleItems = getVisibleItems();
  const hasMoreItems = totalAlerts > maxItems;

  // Calculate statistics
  const statistics = showStatistics ? {
    highRisk: all.filter(card => card.riskScore > 70).length,
    contractorsAffected: new Set(all.map(card => card.contractorId)).size,
    avgRiskScore: Math.round(all.reduce((sum, card) => sum + card.riskScore, 0) / all.length),
  } : null;

  return (
    <Card className={cn('p-4 flex flex-col', className)}>
      {/* Header with warning levels */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h3 className="text-base font-bold">Red Cards</h3>
          <Badge variant="destructive" className="ml-auto text-xs">
            {totalAlerts}
          </Badge>
        </div>
        
        {/* Warning level indicators */}
        <div className="flex gap-1 mb-2">
          {level3.length > 0 && (
            <div className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
              <XCircle className="h-3 w-3" />
              <span>{level3.length} Quá hạn</span>
            </div>
          )}
          {level2.length > 0 && (
            <div className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>{level2.length} Khẩn</span>
            </div>
          )}
          {level1.length > 0 && (
            <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">
              <Clock className="h-3 w-3" />
              <span>{level1.length} Sớm</span>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-semibold text-red-600">{statistics.highRisk}</div>
            <div className="text-muted-foreground">Rủi ro cao</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-semibold">{statistics.contractorsAffected}</div>
            <div className="text-muted-foreground">Nhà thầu</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-semibold">{statistics.avgRiskScore}</div>
            <div className="text-muted-foreground">Điểm rủi ro</div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 max-h-[200px] pr-1">
        <div className="space-y-2">
          {visibleItems.map((item) => {
            const levelConfig = RED_CARD_LEVELS[item.warningLevel];
            const IconComponent = WarningIcons[item.warningLevel];
            
            return (
              <div
                key={`${item.contractorId}-${item.docTypeId}`}
                className={cn(
                  'p-2.5 border rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer red-card-entry',
                  `red-card-level-${item.warningLevel}`,
                  levelConfig.bgColor,
                  levelConfig.borderColor,
                  'hover:opacity-90'
                )}
                onClick={() => onSelect(item.contractorId, item.docTypeId)}
              >
                <div className="space-y-2">
                  {/* Header with warning level and risk score */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className={cn(`status-indicator-level-${item.warningLevel}`)}></div>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', levelConfig.borderColor, levelConfig.textColor)}
                      >
                        {levelConfig.name}
                      </Badge>
                    </div>
                    <div className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                      item.riskScore > 70 ? 'risk-score-high' :
                      item.riskScore > 40 ? 'risk-score-medium' : 'risk-score-low'
                    )}>
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-medium">
                        {item.riskScore}%
                      </span>
                    </div>
                  </div>

                  {/* Document info */}
                  <div className="space-y-1">
                    <div className={cn('text-sm font-semibold truncate', levelConfig.textColor)}>
                      {item.docTypeName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Nhà thầu: {item.contractorName}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Tiến độ</span>
                      <span className="text-xs font-medium">{item.progressPercentage}%</span>
                    </div>
                    <div className="relative">
                      <Progress
                        value={item.progressPercentage}
                        className={cn('h-1.5', `progress-bar-level-${item.warningLevel}`)}
                      />
                    </div>
                  </div>

                  {/* Time information */}
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {item.daysOverdue > 0 ? (
                      <span className="text-red-600 font-medium">
                        Quá hạn {item.daysOverdue} ngày
                      </span>
                    ) : item.daysUntilDue !== null ? (
                      <span className={cn('font-medium', levelConfig.textColor)}>
                        Còn {item.daysUntilDue} ngày
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Không có hạn</span>
                    )}
                  </div>

                  {/* Progress info */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {item.approvedCount}/{item.requiredCount} đã duyệt
                    </Badge>
                    <div className="flex gap-1">
                      {item.actionButtons.slice(0, 2).map((button, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-[10px] px-1 py-0"
                        >
                          {button.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {hasMoreItems && onViewAll && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-primary">
            <List className="h-4 w-4 mr-1" />
            Xem tất cả ({totalAlerts})
          </Button>
        </div>
      )}
    </Card>
  );
};
