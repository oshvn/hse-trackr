import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Download,
  Filter
} from 'lucide-react';
import { BottleneckAnalysis as BottleneckAnalysisType } from '@/lib/dashboardHelpers';
import { formatDays } from '@/lib/dashboardHelpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface BottleneckAnalysisProps {
  data: BottleneckAnalysisType[];
  isLoading?: boolean;
}

export const BottleneckAnalysis: React.FC<BottleneckAnalysisProps> = ({
  data,
  isLoading = false
}) => {
  const [viewMode, setViewMode] = useState<'overview' | 'details' | 'recommendations'>('overview');
  const [selectedStage, setSelectedStage] = useState<'all' | 'preparation' | 'approval' | 'overall'>('all');

  const getSeverityColor = (severity: BottleneckAnalysisType['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityText = (severity: BottleneckAnalysisType['severity']) => {
    switch (severity) {
      case 'critical':
        return 'Nghiêm trọng';
      case 'high':
        return 'Cao';
      case 'medium':
        return 'Trung bình';
      case 'low':
        return 'Thấp';
      default:
        return 'Không xác định';
    }
  };

  const getSeverityIcon = (severity: BottleneckAnalysisType['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStageText = (stage: BottleneckAnalysisType['stage']) => {
    switch (stage) {
      case 'preparation':
        return 'Giai đoạn Chuẩn bị';
      case 'approval':
        return 'Giai đoạn Phê duyệt';
      case 'overall':
        return 'Toàn bộ Quy trình';
      default:
        return 'Không xác định';
    }
  };

  const filteredData = selectedStage === 'all' 
    ? data 
    : data.filter(item => item.stage === selectedStage);

  // Prepare data for charts
  const barChartData = filteredData.map(item => ({
    name: getStageText(item.stage),
    delay: item.averageDelay,
    affected: item.affectedItems,
    impact: item.impactPercentage
  }));

  const pieChartData = [
    { name: 'Chuẩn bị', value: data.find(item => item.stage === 'preparation')?.affectedItems || 0, color: '#3B82F6' },
    { name: 'Phê duyệt', value: data.find(item => item.stage === 'approval')?.affectedItems || 0, color: '#F59E0B' },
    { name: 'Toàn bộ', value: data.find(item => item.stage === 'overall')?.affectedItems || 0, color: '#10B981' }
  ];

  // Prepare data for radar chart
  const radarChartData = [
    {
      stage: 'Chuẩn bị',
      delay: data.find(item => item.stage === 'preparation')?.averageDelay || 0,
      impact: data.find(item => item.stage === 'preparation')?.impactPercentage || 0,
      savings: data.find(item => item.stage === 'preparation')?.estimatedSavings || 0
    },
    {
      stage: 'Phê duyệt',
      delay: data.find(item => item.stage === 'approval')?.averageDelay || 0,
      impact: data.find(item => item.stage === 'approval')?.impactPercentage || 0,
      savings: data.find(item => item.stage === 'approval')?.estimatedSavings || 0
    },
    {
      stage: 'Toàn bộ',
      delay: data.find(item => item.stage === 'overall')?.averageDelay || 0,
      impact: data.find(item => item.stage === 'overall')?.impactPercentage || 0,
      savings: data.find(item => item.stage === 'overall')?.estimatedSavings || 0
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              Phân tích Tắc nghẽn
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
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
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
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              Phân tích Tắc nghẽn
              <Badge variant="outline" className="ml-2">
                {data.length} vấn đề
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                <TabsList>
                  <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                  <TabsTrigger value="details">Chi tiết</TabsTrigger>
                  <TabsTrigger value="recommendations">Đề xuất</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Xuất báo cáo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
            <TabsContent value="overview" className="mt-0">
              <div className="space-y-6">
                {/* Stage Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select 
                    value={selectedStage} 
                    onChange={(e) => setSelectedStage(e.target.value as any)}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="all">Tất cả các giai đoạn</option>
                    <option value="preparation">Giai đoạn Chuẩn bị</option>
                    <option value="approval">Giai đoạn Phê duyệt</option>
                    <option value="overall">Toàn bộ Quy trình</option>
                  </select>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredData.map((bottleneck, index) => (
                    <Card key={index} className="relative overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            {getStageText(bottleneck.stage)}
                          </CardTitle>
                          {getSeverityIcon(bottleneck.severity)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900">
                              {formatDays(bottleneck.averageDelay)}
                            </span>
                            <span className="text-sm text-gray-500">ngày</span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Số lượng bị ảnh hưởng:</span>
                              <span className="font-medium">{bottleneck.affectedItems}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Tỷ lệ ảnh hưởng:</span>
                              <span className="font-medium">{bottleneck.impactPercentage}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Tiềm năng tiết kiệm:</span>
                              <span className="font-medium text-green-600">
                                {formatDays(bottleneck.estimatedSavings)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t">
                            <Badge 
                              variant="outline" 
                              className={`w-full justify-center ${getSeverityColor(bottleneck.severity)}`}
                            >
                              {getSeverityText(bottleneck.severity)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bar Chart */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Thời gian Chậm trễ theo Giai đoạn</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            name === 'delay' ? `Thời gian chậm: ${formatDays(value)}` :
                            name === 'affected' ? `Số lượng: ${value}` :
                            name === 'impact' ? `Tỷ lệ ảnh hưởng: ${value}%` : `${value}`,
                            ''
                          ]}
                        />
                        <Bar dataKey="delay" fill="#EF4444" name="Thời gian chậm" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pie Chart */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Phân bố Tắc nghẽn</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Radar Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Phân tích Tác động</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={radarChartData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="stage" />
                      <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
                      <Radar
                        name="Thời gian chậm"
                        dataKey="delay"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Tỷ lệ ảnh hưởng"
                        dataKey="impact"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredData.map((bottleneck, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(bottleneck.severity)}
                            <CardTitle className="font-semibold">
                              {getStageText(bottleneck.stage)} - {getSeverityText(bottleneck.severity)}
                            </CardTitle>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={getSeverityColor(bottleneck.severity)}
                          >
                            {bottleneck.impactPercentage}% ảnh hưởng
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Metrics */}
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-700">Chỉ số</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Thời gian chậm TB:</span>
                                <span className="font-medium">{formatDays(bottleneck.averageDelay)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Số lượng bị ảnh hưởng:</span>
                                <span className="font-medium">{bottleneck.affectedItems}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Tổng số lượng:</span>
                                <span className="font-medium">{bottleneck.totalItems}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Tiềm năng tiết kiệm:</span>
                                <span className="font-medium text-green-600">{formatDays(bottleneck.estimatedSavings)}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Root Causes */}
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-700">Nguyên nhân Gốc</h4>
                            <ul className="space-y-2">
                              {bottleneck.rootCauses.map((cause, causeIndex) => (
                                <li key={causeIndex} className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-sm text-gray-700">{cause}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="recommendations" className="mt-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredData.map((bottleneck, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          <CardTitle className="font-semibold">
                            Đề xuất cho {getStageText(bottleneck.stage)}
                          </CardTitle>
                          <Badge 
                            variant="outline" 
                            className={getSeverityColor(bottleneck.severity)}
                          >
                            {getSeverityText(bottleneck.severity)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                            <Clock className="h-8 w-8 text-blue-600" />
                            <div>
                              <h4 className="font-semibold text-blue-900">
                                Tiết kiệm tiềm năng: {formatDays(bottleneck.estimatedSavings)}
                              </h4>
                              <p className="text-sm text-blue-700">
                                Nếu áp dụng các đề xuất này
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-700">Hành động đề xuất:</h4>
                            <ul className="space-y-2">
                              {bottleneck.recommendations.map((rec, recIndex) => (
                                <li key={recIndex} className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-sm text-gray-700">{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BottleneckAnalysis;