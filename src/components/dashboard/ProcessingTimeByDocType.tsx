import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  Lightbulb,
  Filter,
  Eye,
  Download
} from 'lucide-react';
import { DocumentTypeProcessingTime } from '@/lib/dashboardHelpers';
import { formatDays } from '@/lib/dashboardHelpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ProcessingTimeByDocTypeProps {
  data: DocumentTypeProcessingTime[];
  isLoading?: boolean;
  onViewDetails?: (docTypeId: string) => void;
}

export const ProcessingTimeByDocType: React.FC<ProcessingTimeByDocTypeProps> = ({
  data,
  isLoading = false,
  onViewDetails
}) => {
  const [sortBy, setSortBy] = useState<'totalTime' | 'prepTime' | 'approvalTime' | 'complexity'>('totalTime');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const getComplexityColor = (complexity: DocumentTypeProcessingTime['complexity']) => {
    switch (complexity) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplexityText = (complexity: DocumentTypeProcessingTime['complexity']) => {
    switch (complexity) {
      case 'low':
        return 'Đơn giản';
      case 'medium':
        return 'Trung bình';
      case 'high':
        return 'Phức tạp';
      default:
        return 'Không xác định';
    }
  };

  const getOptimizationColor = (potential: number) => {
    if (potential >= 30) return 'text-red-600';
    if (potential >= 15) return 'text-amber-600';
    if (potential >= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getOptimizationBadge = (potential: number) => {
    if (potential >= 30) return { variant: 'destructive' as const, label: 'Cao' };
    if (potential >= 15) return { variant: 'secondary' as const, label: 'Trung bình' };
    if (potential >= 5) return { variant: 'outline' as const, label: 'Thấp' };
    return { variant: 'default' as const, label: 'Tối ưu' };
  };

  const categories = ['all', ...Array.from(new Set(data.map(item => item.category)))];
  
  const filteredData = data.filter(item => {
    if (filterCategory === 'all') return true;
    return item.category === filterCategory;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case 'totalTime':
        return b.averageTotalDays - a.averageTotalDays;
      case 'prepTime':
        return b.averagePrepDays - a.averagePrepDays;
      case 'approvalTime':
        return b.averageApprovalDays - a.averageApprovalDays;
      case 'complexity':
        return (b.complexity === 'high' ? 3 : b.complexity === 'medium' ? 2 : 1) - 
               (a.complexity === 'high' ? 3 : a.complexity === 'medium' ? 2 : 1);
      default:
        return b.averageTotalDays - a.averageTotalDays;
    }
  });

  // Prepare data for charts
  const chartData = sortedData.slice(0, 10).map(item => ({
    name: item.docTypeName.length > 20 ? item.docTypeName.substring(0, 20) + '...' : item.docTypeName,
    preparation: item.averagePrepDays,
    approval: item.averageApprovalDays,
    total: item.averageTotalDays,
    complexity: item.complexity === 'high' ? 3 : item.complexity === 'medium' ? 2 : 1
  }));

  // Prepare data for complexity pie chart
  const complexityData = [
    { name: 'Đơn giản', value: data.filter(item => item.complexity === 'low').length, color: '#10B981' },
    { name: 'Trung bình', value: data.filter(item => item.complexity === 'medium').length, color: '#F59E0B' },
    { name: 'Phức tạp', value: data.filter(item => item.complexity === 'high').length, color: '#EF4444' }
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Thời gian Xử lý theo Loại Hồ sơ
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
              <FileText className="h-5 w-5 text-blue-600" />
              Thời gian Xử lý theo Loại Hồ sơ
              <Badge variant="outline" className="ml-2">
                {filteredData.length} loại hồ sơ
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <TabsList>
                  <TabsTrigger value="totalTime">Tổng thời gian</TabsTrigger>
                  <TabsTrigger value="prepTime">Thời gian chuẩn bị</TabsTrigger>
                  <TabsTrigger value="approvalTime">Thời gian phê duyệt</TabsTrigger>
                  <TabsTrigger value="complexity">Độ phức tạp</TabsTrigger>
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
          {/* Category Filter */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Tất cả danh mục' : category}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Types List */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Chi tiết theo Loại Hồ sơ</h3>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {sortedData.map((docType) => (
                    <div key={docType.docTypeId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {docType.docTypeName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {docType.docTypeCode} • {docType.category}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={getComplexityColor(docType.complexity)}
                            >
                              {getComplexityText(docType.complexity)}
                            </Badge>
                            
                            <Badge 
                              variant={getOptimizationBadge(docType.optimizationPotential).variant}
                              className="text-xs"
                            >
                              {getOptimizationBadge(docType.optimizationPotential).label}
                            </Badge>
                          </div>
                        </div>

                        {/* Time Metrics */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-blue-50 rounded">
                            <div className="text-xs text-blue-600 mb-1">Chuẩn bị</div>
                            <div className="font-semibold text-blue-900">
                              {formatDays(docType.averagePrepDays)}
                            </div>
                          </div>
                          <div className="p-2 bg-amber-50 rounded">
                            <div className="text-xs text-amber-600 mb-1">Phê duyệt</div>
                            <div className="font-semibold text-amber-900">
                              {formatDays(docType.averageApprovalDays)}
                            </div>
                          </div>
                          <div className="p-2 bg-green-50 rounded">
                            <div className="text-xs text-green-600 mb-1">Tổng cộng</div>
                            <div className="font-semibold text-green-900">
                              {formatDays(docType.averageTotalDays)}
                            </div>
                          </div>
                        </div>

                        {/* Sample Size */}
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Kích cỡ mẫu: {docType.sampleSize} hồ sơ</span>
                          <span className={`font-medium ${getOptimizationColor(docType.optimizationPotential)}`}>
                            Tiềm năng tối ưu: {docType.optimizationPotential}%
                          </span>
                        </div>

                        {/* Recommendations */}
                        {docType.recommendations.length > 0 && (
                          <div className="pt-2 border-t">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-amber-500" />
                              <h5 className="font-medium text-gray-700">Đề xuất cải thiện</h5>
                            </div>
                            <ul className="space-y-1 text-sm text-gray-600">
                              {docType.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1 flex-shrink-0"></div>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Action Button */}
                        {onViewDetails && (
                          <div className="pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewDetails(docType.docTypeId)}
                              className="w-full"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Charts */}
            <div className="space-y-6">
              {/* Bar Chart */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Top 10 Loại Hồ sơ theo Thời gian Xử lý</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 'dataMax']} />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'preparation' ? `Chuẩn bị: ${formatDays(value)}` :
                        name === 'approval' ? `Phê duyệt: ${formatDays(value)}` :
                        name === 'total' ? `Tổng cộng: ${formatDays(value)}` :
                        `${value}`,
                        ''
                      ]}
                      labelFormatter={(label) => `Loại hồ sơ: ${label}`}
                    />
                    <Bar dataKey="total" fill="#10B981" name="Tổng thời gian" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Complexity Pie Chart */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Phân bố Độ phức tạp</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={complexityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {complexityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Optimization Potential */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Tiềm năng Tối ưu</h3>
                <div className="space-y-3">
                  {sortedData
                    .filter(item => item.optimizationPotential > 5)
                    .slice(0, 5)
                    .map((docType, index) => (
                      <div key={docType.docTypeId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {docType.docTypeName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {docType.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getOptimizationColor(docType.optimizationPotential)}`}>
                            {docType.optimizationPotential}%
                          </div>
                          <div className="text-xs text-gray-500">
                            Tiềm năng tiết kiệm
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessingTimeByDocType;