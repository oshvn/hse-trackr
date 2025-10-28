import React, { useMemo, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell,
  LabelList
} from 'recharts';
import type { KpiData, DocProgressData } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';
import { BarChart3, TrendingUp, TrendingDown, Minus, Download, Filter } from 'lucide-react';

interface ContractorBarChartsProps {
  data: KpiData[];
  docProgressData?: DocProgressData[];
  className?: string;
}

const METRICS = [
  { key: 'completion', label: 'Hoàn thành (%)', unit: '%' },
  { key: 'mustHaveReady', label: 'Chất lượng (%)', unit: '%' },
  { key: 'quality', label: 'Tốc độ (điểm)', unit: 'điểm' },
  { key: 'speed', label: 'Tuân thủ (%)', unit: '%' }
];

const COLORS = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  blue: '#3b82f6',
  orange: '#f97316',
  purple: '#8b5cf6',
  pink: '#ec4899'
};

const CONTRACTOR_COLORS = ['#2563eb', '#f97316', '#22c55e', '#8b5cf6', '#ec4899'];

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

// Custom tooltip for bar charts
const CustomBarTooltip = ({ active, payload, label }: any) => {
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
              <span className="font-medium">{entry.value}{entry.payload.unit}</span>
              {entry.value >= 80 && <TrendingUp className="w-3 h-3 text-green-500" />}
              {entry.value >= 60 && entry.value < 80 && <Minus className="w-3 h-3 text-yellow-500" />}
              {entry.value < 60 && <TrendingDown className="w-3 h-3 text-red-500" />}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom label for bars
const CustomLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  
  return (
    <text 
      x={x + width / 2} 
      y={y} 
      fill="#fff" 
      textAnchor="middle" 
      dominantBaseline="middle" 
      fontSize={12}
      fontWeight="bold"
    >
      {value}
    </text>
  );
};

export const ContractorBarCharts: React.FC<ContractorBarChartsProps> = ({
  data,
  docProgressData = [],
  className
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('completion');
  const [selectedContractors, setSelectedContractors] = useState<string[]>([]);

  // Export functionality
  const handleExport = useCallback((format: 'png' | 'pdf' | 'excel') => {
    console.log(`Exporting as ${format}`);
    // This would integrate with a library like html2canvas, jsPDF, or xlsx
  }, []);

  // Get color based on value
  const getValueColor = useCallback((value: number, metric: string) => {
    if (metric === 'speed') {
      // For speed, higher is better but scale is different
      return value >= 80 ? COLORS.green : value >= 60 ? COLORS.yellow : COLORS.red;
    }
    // For percentage metrics
    return value >= 80 ? COLORS.green : value >= 60 ? COLORS.yellow : COLORS.red;
  }, []);

  const { chartData, contractors, allContractors } = useMemo(() => {
    if (!data?.length) {
      return {
        chartData: [],
        contractors: [],
        allContractors: []
      };
    }

    // Get all contractors for the filter dropdown
    const allContractors = data.map(item => ({ id: item.contractor_id, name: item.contractor_name }));
    
    // Filter contractors based on selection
    let filteredContractors = allContractors;
    if (selectedContractors.length > 0) {
      filteredContractors = allContractors.filter(c => selectedContractors.includes(c.id));
    }
    
    // Limit to 5 contractors for better visibility
    const contractors = filteredContractors.slice(0, 5);

    const metricConfig = METRICS.find(m => m.key === selectedMetric);
    if (!metricConfig) return { chartData: [], contractors, allContractors };

    const chartData = contractors.map(contractor => {
      const kpi = data.find(entry => entry.contractor_id === contractor.id);
      if (!kpi) return null;

      const kpis = calculateKPIs(kpi, docProgressData);
      const value = kpis[selectedMetric as keyof typeof kpis] as number;

      return {
        name: contractor.name,
        value,
        unit: metricConfig.unit,
        color: CONTRACTOR_COLORS[contractors.findIndex(c => c.id === contractor.id)],
        originalValue: value
      };
    }).filter(Boolean);

    return { chartData, contractors, allContractors };
  }, [data, docProgressData, selectedMetric, selectedContractors]);

  if (!chartData.length) {
    return (
      <Card className={cn('p-5 flex flex-col gap-3', className)}>
        <div>
          <h3 className="text-lg font-semibold">Performance Bar Charts</h3>
          <p className="text-sm text-muted-foreground">Compare contractors across specific metrics</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No KPI data available for the current filters
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
            <h3 className="text-lg font-semibold">Performance Comparison by Metric</h3>
            <p className="text-sm text-muted-foreground">Detailed comparison across specific performance indicators</p>
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
        
        {/* Metric and Contractor Filters */}
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

      {/* Bar Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{ value: metricConfig?.unit, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomBarTooltip />} />
            <Bar 
              dataKey="value" 
              radius={[8, 8, 0, 0]}
              label={<CustomLabel />}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getValueColor(entry.value, selectedMetric)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {chartData.map((item, index) => {
          const trend = item.value >= 80 ? 'up' : item.value >= 60 ? 'stable' : 'down';
          
          return (
            <div key={item.name} className="flex items-center gap-2 p-2 rounded-lg border">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getValueColor(item.value, selectedMetric) }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.name}</p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold">{item.value}{item.unit}</span>
                  {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                  {trend === 'stable' && <Minus className="w-3 h-3 text-yellow-500" />}
                  {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Tốt (&gt;80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Trung bình (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Cần cải thiện (&lt;60%)</span>
        </div>
      </div>
    </Card>
  );
};