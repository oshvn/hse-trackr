import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  PlayCircle,
  Send,
  Eye,
  Filter
} from 'lucide-react';
import { TimelineEvent } from '@/lib/dashboardHelpers';
import { formatDays } from '@/lib/dashboardHelpers';
import { format } from 'date-fns';

interface TimelineAnalysisProps {
  events: TimelineEvent[];
  isLoading?: boolean;
  onViewDetails?: (eventId: string) => void;
}

export const TimelineAnalysis: React.FC<TimelineAnalysisProps> = ({
  events,
  isLoading = false,
  onViewDetails
}) => {
  const [filter, setFilter] = useState<'all' | 'bottlenecks' | 'critical'>('all');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const getStatusIcon = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'not_started':
        return <PlayCircle className="h-4 w-4 text-gray-400" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'submitted':
        return <Send className="h-4 w-4 text-amber-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'submitted':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'not_started':
        return 'Chưa bắt đầu';
      case 'in_progress':
        return 'Đang thực hiện';
      case 'submitted':
        return 'Đã nộp';
      case 'approved':
        return 'Đã duyệt';
      case 'overdue':
        return 'Quá hạn';
      default:
        return 'Không xác định';
    }
  };

  const getBottleneckBadge = (stage: TimelineEvent['bottleneckStage'], days: number) => {
    if (stage === 'none') return null;
    
    return (
      <Badge variant="destructive" className="text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {stage === 'preparation' ? 'Chuẩn bị' : 'Phê duyệt'} +{days > 0 ? ` +${days} ngày` : ''}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'bottlenecks') return event.bottleneckStage !== 'none';
    if (filter === 'critical') return event.isCritical;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Timeline Phân tích
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Timeline Phân tích
              <Badge variant="outline" className="ml-2">
                {filteredEvents.length} hồ sơ
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Tất cả
              </Button>
              <Button
                variant={filter === 'bottlenecks' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('bottlenecks')}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Tắc nghẽn
              </Button>
              <Button
                variant={filter === 'critical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('critical')}
              >
                <Eye className="h-4 w-4 mr-1" />
                Quan trọng
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Không có dữ liệu timeline</p>
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(event.status)}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {event.docTypeName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {event.contractorName} • {event.category}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {event.isCritical && (
                          <Badge variant="destructive" className="text-xs">
                            Quan trọng
                          </Badge>
                        )}
                        {getBottleneckBadge(event.bottleneckStage, event.bottleneckDays)}
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(event.status)}
                        >
                          {getStatusText(event.status)}
                        </Badge>
                      </div>
                    </div>

                    {/* Timeline Visual */}
                    <div className="relative mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>Bắt đầu</span>
                        <span>Nộp</span>
                        <span>Duyệt</span>
                      </div>
                      
                      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full bg-gradient-to-r from-blue-500 via-amber-500 to-green-500 rounded-full"
                          style={{
                            width: event.totalDays ? `${Math.min(100, (event.totalDays / 15) * 100)}%` : '0%'
                          }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between mt-1">
                        <div className="text-xs text-gray-600">
                          {formatDate(event.startDate)}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatDate(event.submitDate)}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatDate(event.approvalDate)}
                        </div>
                      </div>
                    </div>

                    {/* Time Details */}
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-xs text-blue-600 mb-1">Chuẩn bị</div>
                        <div className="font-semibold text-blue-900">
                          {formatDays(event.prepDays || 0)}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-amber-50 rounded">
                        <div className="text-xs text-amber-600 mb-1">Phê duyệt</div>
                        <div className="font-semibold text-amber-900">
                          {formatDays(event.approvalDays || 0)}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-xs text-green-600 mb-1">Tổng cộng</div>
                        <div className="font-semibold text-green-900">
                          {formatDays(event.totalDays || 0)}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    <div className="border-t pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEventExpansion(event.id)}
                        className="w-full justify-between"
                      >
                        <span>Chi tiết</span>
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {expandedEvents.has(event.id) && (
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Mã hồ sơ:</span>
                            <span className="font-medium">{event.docTypeCode || '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ngày hết hạn:</span>
                            <span className="font-medium">{formatDate(event.plannedDueDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Giai đoạn tắc nghẽn:</span>
                            <span className="font-medium">
                              {event.bottleneckStage === 'none' 
                                ? 'Không' 
                                : event.bottleneckStage === 'preparation' 
                                  ? 'Chuẩn bị' 
                                  : 'Phê duyệt'}
                            </span>
                          </div>
                          {event.bottleneckDays > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Thời gian chậm:</span>
                              <span className="font-medium text-red-600">
                                +{formatDays(event.bottleneckDays)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {onViewDetails && (
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(event.id)}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết hồ sơ
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimelineAnalysis;