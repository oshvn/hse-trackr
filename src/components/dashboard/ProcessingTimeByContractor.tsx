import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Trophy,
  Clock,
  Users,
  Eye,
  Download
} from 'lucide-react';
import { ContractorProcessingTimeComparison } from '@/lib/dashboardHelpers';
import { formatDays } from '@/lib/dashboardHelpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ProcessingTimeByContractorProps {
  data: ContractorProcessingTimeComparison[];
  isLoading?: boolean;
  onViewDetails?: (contractorId: string) => void;
}

export const ProcessingTimeByContractor: React.FC<ProcessingTimeByContractorProps> = ({
  data,
  isLoading = false,
  onViewDetails
}) => {
  const [sortBy, setSortBy] = useState<'overallRank' | 'prepTime' | 'approvalTime' | 'totalTime'>('overallRank');
  const [viewMode, setViewMode] = useState<'cards' | 'charts'>('cards');

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50';
    if (rank === 2) return 'text-gray-600 bg-gray-50';
    if (rank === 3) return 'text-amber-600 bg-amber-50';
    return 'text-gray-600';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, label: 'Xuất sắc' };
    if (score >= 60) return { variant: 'secondary' as const, label: 'Tốt' };
    return { variant: 'destructive' as const, label: 'Cần cải thiện' };
  };

  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'overallRank':
        return a.overallRank - b.overallRank;
      case 'prepTime':
        return a.averagePrepDays - b.averagePrepDays;
      case 'approvalTime':
        return a.averageApprovalDays - b.averageApprovalDays;
      case 'totalTime':
        return a.averageTotalDays - b.averageTotalDays;
      default:
        return a.overallRank - b.overallRank;
    }
  });

  const chartData = sortedData.map(item => ({
    name: item.contractorName,
    preparation: item.averagePrepDays,
    approval: item.averageApprovalDays,
    total: item.averageTotalDays,
    score: item.performanceScore
  }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Thời gian Xử lý theo Nhà thầu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
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
              <Users className="h-5 w-5 text-blue-600" />
              Thời gian Xử lý theo Nhà thầu
              <Badge variant="outline" className="ml-2">
                {data.length} nhà thầu
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'cards' | 'charts')}>
                <TabsList>
                  <TabsTrigger value="cards">Thẻ</TabsTrigger>
                  <TabsTrigger value="charts">Biểu đồ</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="overallRank">Xếp hạng</TabsTrigger>
                <TabsTrigger value="prepTime">Thời gian chuẩn bị</TabsTrigger>
                <TabsTrigger value="approvalTime">Thời gian phê duyệt</TabsTrigger>
                <TabsTrigger value="totalTime">Tổng thời gian</TabsTrigger>
              </TabsList>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Xuất báo cáo
              </Button>
            </div>

            <TabsContent value="cards" className="mt-0">
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedData.map((contractor) => (
                    <Card key={contractor.contractorId} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Header with Rank */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(contractor.overallRank)}`}>
                                {getRankIcon(contractor.overallRank)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {contractor.contractorName}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  Điểm hiệu suất: {contractor.performanceScore}
                                </p>
                              </div>
                            </div>
                            
                            <Badge 
                              variant={getPerformanceBadge(contractor.performanceScore).variant}
                              className="text-xs"
                            >
                              {getPerformanceBadge(contractor.performanceScore).label}
                            </Badge>
                          </div>

                          {/* Time Metrics */}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 bg-blue-50 rounded">
                              <div className="text-xs text-blue-600 mb-1">Chuẩn bị</div>
                              <div className="font-semibold text-blue-900">
                                {formatDays(contractor.averagePrepDays)}
                              </div>
                              <div className="text-xs text-blue-600">
                                #{contractor.prepTimeRank}
                              </div>
                            </div>
                            <div className="p-2 bg-amber-50 rounded">
                              <div className="text-xs text-amber-600 mb-1">Phê duyệt</div>
                              <div className="font-semibold text-amber-900">
                                {formatDays(contractor.averageApprovalDays)}
                              </div>
                              <div className="text-xs text-amber-600">
                                #{contractor.approvalTimeRank}
                              </div>
                            </div>
                            <div className="p-2 bg-green-50 rounded">
                              <div className="text-xs text-green-600 mb-1">Tổng cộng</div>
                              <div className="font-semibold text-green-900">
                                {formatDays(contractor.averageTotalDays)}
                              </div>
                              <div className="text-xs text-green-600">
                                #{contractor.totalTimeRank}
                              </div>
                            </div>
                          </div>

                          {/* Performance Score */}
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Điểm hiệu suất</span>
                              <div className="flex items-center gap-1">
                                <Trophy className="h-4 w-4 text-yellow-500" />
                                <span className={`font-bold ${getPerformanceColor(contractor.performanceScore)}`}>
                                  {contractor.performanceScore}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          {onViewDetails && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewDetails(contractor.contractorId)}
                              className="w-full mt-3"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="charts" className="mt-0">
              <div className="space-y-6">
                {/* Bar Chart Comparison */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">So sánh Thời gian Xử lý</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [formatDays(value), '']}
                        labelFormatter={(label) => `Nhà thầu: ${label}`}
                      />
                      <Bar dataKey="preparation" fill="#3B82F6" name="Chuẩn bị" />
                      <Bar dataKey="approval" fill="#F59E0B" name="Phê duyệt" />
                      <Bar dataKey="total" fill="#10B981" name="Tổng cộng" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Performance Score Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Điểm Hiệu suất</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip 
                        formatter={(value: number) => [`${value}`, 'Điểm hiệu suất']}
                        labelFormatter={(label) => `Nhà thầu: ${label}`}
                      />
                      <Bar dataKey="score" fill="#8B5CF6" name="Điểm hiệu suất" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Trend Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Xu hướng 7 ngày qua</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={sortedData[0]?.trendData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [formatDays(value), '']}
                        labelFormatter={(label) => `Ngày: ${label}`}
                      />
                      {sortedData.slice(0, 3).map((contractor, index) => (
                        <Line
                          key={contractor.contractorId}
                          type="monotone"
                          dataKey="totalDays"
                          stroke={['#3B82F6', '#F59E0B', '#10B981'][index]}
                          strokeWidth={2}
                          name={contractor.contractorName}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessingTimeByContractor;