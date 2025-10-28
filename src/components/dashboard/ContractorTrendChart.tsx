import React, { useMemo, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';
import type { KpiData, DocProgressData } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';
import { Download, Filter, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

interface ContractorTrendChartProps {
  data: KpiData[];
  docProgressData?: DocProgressData[];
  className?: string;
}

interface TrendData {
  date: string;
  [key: string]: string | number;
}

interface TrendStats {
  contractor: string;
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  prediction: number;
}

const COLORS = ['#2563eb', '#f97316', '#22c55e', '#8b5cf6', '#ec4899'];

const METRICS = [
  { key: 'completion', label: 'Hoàn thành (%)', unit: '%' },
  { key: 'mustHaveReady', label: 'Chất lượng (%)', unit: '%' },
  { key: 'quality', label: 'Tốc độ (điểm)', unit: 'điểm' },
  { key: 'speed', label: 'Tuân thủ (%)', unit: '%' }
];

// Calculate KPIs according to the specified formulas
const calculateKPIs = (kpiData: KpiData, docProgressData?: DocProgressData[]) => {
  // 1. Completion: (Số hồ sơ đã duyệt / Tổng số hồ sơ yêu cầu) * 100
  const completion = Math.round(kpiData.completion_ratio * 100);
  
  // 2. Must-have Ready: 100 - (Số "Điểm đỏ" / Tổng số hồ sơ bắt buộc) * 100
  let mustHaveReady = 100;
  if (kpiData.red_items > 0 && docProgressData) {
    const contractorDocs = docProgressData.filter(doc => doc.contractor_id === kpiData.contractor_id);
    const criticalDocs = contractorDocs.filter(doc => doc.is_critical);
    const totalCritical = criticalDocs.reduce((sum, doc) => sum + doc.required_count, 0);
    
    if (totalCritical > 0) {
      mustHaveReady = Math.max(0, 100 - (kpiData.red_items / totalCritical) * 100);
    }
  }
  
  // 3. Quality: (Số hồ sơ đã duyệt / Tổng số hồ sơ đã nộp) * 100
  const quality = Math.round(kpiData.completion_ratio * 100);
  
  // 4. Speed: 100 / (Thời gian phê duyệt trung bình tính bằng ngày + 1)
  const speed = kpiData.avg_approval_days > 0
    ? Math.min(100, Math.round(100 / (kpiData.avg_approval_days + 1)))
    : 100;
  
  return {
    completion,
    mustHaveReady: Math.round(mustHaveReady),
    quality,
    speed
  };
};

// Custom tooltip for trend chart
const CustomTrendTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{entry.value}{entry.dataKey?.includes('prediction') ? ' (dự báo)' : ''}</span>
              {entry.dataKey?.includes('prediction') && (
                <Badge variant="outline" className="text-xs">Dự báo</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ContractorTrendChart: React.FC<ContractorTrendChartProps> = ({
  data,
  docProgressData = [],
  className
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('completion');
  const [selectedContractors, setSelectedContractors] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<number>(7); // days

  // Export functionality
  const handleExport = useCallback((format: 'png' | 'pdf' | 'excel') => {
    console.log(`Exporting as ${format}`);
    // This would integrate with a library like html2canvas, jsPDF, or xlsx
  }, []);

  // Generate mock trend data (in real implementation, this would come from API)
  const generateTrendData = useCallback((contractors: any[], metric: string, days: number): TrendData[] => {
    const today = startOfDay(new Date());
    const trendData: TrendData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'MM/dd');
      
      const dataPoint: TrendData = { date: dateStr };
      
      contractors.forEach((contractor, index) => {
        const kpi = data.find(entry => entry.contractor_id === contractor.id);
        if (kpi) {
          const kpis = calculateKPIs(kpi, docProgressData);
          const baseValue = kpis[metric as keyof typeof kpis] as number;
          
          // Add some variation to simulate trend
          const variation = Math.random() * 20 - 10; // ±10% variation
          const value = Math.max(0, Math.min(100, baseValue + variation));
          
          dataPoint[contractor.name] = Math.round(value);
          
          // Add prediction for future dates
          if (i === 0) {
            const prediction = Math.min(100, value + Math.random() * 10 - 5);
            dataPoint[`${contractor.name}_prediction`] = Math.round(prediction);
          }
        }
      });
      
      trendData.push(dataPoint);
    }
    
    return trendData;
  }, [data, docProgressData]);

  // Calculate trend statistics
  const calculateTrendStats = useCallback((trendData: TrendData[], contractors: any[]): TrendStats[] => {
    return contractors.map(contractor => {
      const values = trendData.map(d => d[contractor.name] as number).filter(v => !isNaN(v));
      if (values.length < 2) {
        return {
          contractor: contractor.name,
          current: 0,
          previous: 0,
          trend: 'stable' as const,
          changePercent: 0,
          prediction: 0
        };
      }
      
      const current = values[values.length - 1];
      const previous = values[values.length - 2];
      const change = current - previous;
      const changePercent = previous !== 0 ? Math.round((change / previous) * 100) : 0;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (changePercent > 5) trend = 'up';
      else if (changePercent < -5) trend = 'down';
      
      // Simple prediction based on trend
      const prediction = trend === 'up' ? Math.min(100, current + Math.abs(changePercent)) :
                       trend === 'down' ? Math.max(0, current - Math.abs(changePercent)) : current;
      
      return {
        contractor: contractor.name,
        current,
        previous,
        trend,
        changePercent,
        prediction: Math.round(prediction)
      };
    });
  }, []);

  const { trendData, contractors, allContractors, trendStats } = useMemo(() => {
    if (!data?.length) {
      return {
        trendData: [],
        contractors: [],
        allContractors: [],
        trendStats: []
      };
    }

    // Get all contractors for filter dropdown
    const allContractors = data.map(item => ({ id: item.contractor_id, name: item.contractor_name }));
    
    // Filter contractors based on selection
    let filteredContractors = allContractors;
    if (selectedContractors.length > 0) {
      filteredContractors = allContractors.filter(c => selectedContractors.includes(c.id));
    }
    
    // Limit to 3 contractors for better visibility
    const contractors = filteredContractors.slice(0, 3);

    const trendData = generateTrendData(contractors, selectedMetric, timeRange);
    const trendStats = calculateTrendStats(trendData, contractors);

    return { trendData, contractors, allContractors, trendStats };
  }, [data, selectedContractors, selectedMetric, timeRange, generateTrendData, calculateTrendStats]);

  if (!trendData.length) {
    return (
      <Card className={cn('p-5 flex flex-col gap-3', className)}>
        <div>
          <h3 className="text-lg font-semibold">Performance Trends</h3>
          <p className="text-sm text-muted-foreground">Track performance over time with predictions</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No trend data available for current filters
        </div>
      </Card>
    );
  }

  const metricConfig = METRICS.find(m => m.key === selectedMetric);

  return (
    <Card className={cn('p-5 space-y-4', className)}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Performance Trends</h3>
            <p className="text-sm text-muted-foreground">Track performance over time with predictions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('png')}
              aria-label="Export as PNG"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Metric:</span>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {METRICS.map((metric) => (
                  <SelectItem key={metric.key} value={metric.key}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Period:</span>
            <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(parseInt(value))}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Contractors:</span>
            <Select
              value={selectedContractors.join(',') || 'all'}
              onValueChange={(value) => setSelectedContractors(value === 'all' ? [] : value.split(','))}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select contractors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All contractors</SelectItem>
                {allContractors.map((contractor) => (
                  <SelectItem key={contractor.id} value={contractor.id}>
                    {contractor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedContractors.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedContractors([])}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{ value: metricConfig?.unit, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTrendTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            
            {contractors.map((contractor, index) => (
              <Line
                key={contractor.id}
                type="monotone"
                dataKey={contractor.name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
            
            {/* Prediction lines (dashed) */}
            {contractors.map((contractor, index) => (
              <Line
                key={`${contractor.id}_prediction`}
                type="monotone"
                dataKey={`${contractor.name}_prediction`}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                legendType="none"
              />
            ))}
            
            {/* Reference line at 80% */}
            <ReferenceLine 
              y={80} 
              stroke="#22c55e" 
              strokeDasharray="3 3" 
              label="Target (80%)" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trendStats.map((stat, index) => (
          <div key={stat.contractor} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{stat.contractor}</span>
              <div className="flex items-center gap-1">
                {stat.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                {stat.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                {stat.trend === 'stable' && <Minus className="w-4 h-4 text-yellow-500" />}
                <span className={cn(
                  "text-xs font-medium",
                  stat.trend === 'up' && "text-green-500",
                  stat.trend === 'down' && "text-red-500",
                  stat.trend === 'stable' && "text-yellow-500"
                )}>
                  {stat.changePercent > 0 && '+'}{stat.changePercent}%
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Hiện tại:</span>
                <span className="font-medium">{stat.current}{metricConfig?.unit}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Dự báo:</span>
                <span className="font-medium">{stat.prediction}{metricConfig?.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0 border-t-2 border-blue-500" />
          <span>Thực tế</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0 border-t-2 border-dashed border-blue-500" />
          <span>Dự báo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0 border-t-2 border-dashed border-green-500" />
          <span>Mục tiêu (80%)</span>
        </div>
      </div>
    </Card>
  );
};