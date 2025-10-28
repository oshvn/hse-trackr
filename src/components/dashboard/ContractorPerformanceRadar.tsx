import React, { useMemo, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import type { KpiData, DocProgressData } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';
import { BarChart3, Radar as RadarIcon, Filter, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PerformanceBarCharts } from './PerformanceBarCharts';

interface PerformanceSummary {
  overallCompletion: number;
  mustHaveReady: number;
  overdueMustHaves: number;
  avgPrepTime: number;
  avgApprovalTime: number;
}

interface ContractorPerformanceRadarProps {
  data: KpiData[];
  docProgressData?: DocProgressData[];
  summary?: PerformanceSummary;
  className?: string;
}

const RADAR_COLORS = ['#2563eb', '#f97316', '#22c55e', '#8b5cf6', '#ec4899'];

const CONTRACTOR_COLORS = [
  { name: 'Contractor 1', color: '#2563eb' },
  { name: 'Contractor 2', color: '#f97316' },
  { name: 'Contractor 3', color: '#22c55e' },
  { name: 'Contractor 4', color: '#8b5cf6' },
  { name: 'Contractor 5', color: '#ec4899' }
];

const toPercent = (value: number | null | undefined): number => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 0;
  }
  const normalized = value > 1 ? value : value * 100;
  return Math.max(0, Math.min(100, Math.round(normalized)));
};

// Calculate KPIs according to the specified formulas
const calculateKPIs = (kpiData: KpiData, docProgressData?: DocProgressData[]) => {
  // 1. Completion: (Số hồ sơ đã duyệt / Tổng số hồ sơ yêu cầu) * 100
  const completion = toPercent(kpiData.completion_ratio);
  
  // 2. Must-have Ready: 100 - (Số "Điểm đỏ" / Tổng số hồ sơ bắt buộc) * 100
  // Where "Điểm đỏ" = hồ sơ có is_critical = True AND (status = 'Rejected' OR due_date đã qua)
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
  // This is the same as completion_ratio in KpiData
  const quality = toPercent(kpiData.completion_ratio);
  
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

// Custom tooltip for radar chart
const CustomRadarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-2">{payload[0].payload.metric}</p>
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
              <span className="font-medium">{entry.value}%</span>
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

export const ContractorPerformanceRadar: React.FC<ContractorPerformanceRadarProps> = ({
  data,
  docProgressData = [],
  summary,
  className
}) => {
  const [viewMode, setViewMode] = useState<'radar' | 'bars'>('radar');
  const [selectedContractors, setSelectedContractors] = useState<string[]>([]);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  // Export functionality
  const handleExport = useCallback((format: 'png' | 'pdf' | 'excel') => {
    // Implementation for export functionality
    console.log(`Exporting as ${format}`);
    // This would integrate with a library like html2canvas, jsPDF, or xlsx
  }, []);

  // Get performance trend for a contractor
  const getPerformanceTrend = useCallback((contractorId: string, metric: string) => {
    // This would calculate trend based on historical data
    // For now, return random trend for demo
    const trends = ['up', 'down', 'stable'];
    return trends[Math.floor(Math.random() * trends.length)];
  }, []);

  const { radarData, contractors, allContractors } = useMemo(() => {
    if (!data?.length) {
      return {
        radarData: [] as Record<string, number | string>[],
        contractors: [] as { id: string; name: string }[],
        allContractors: [] as { id: string; name: string }[]
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

    const metrics = [
      {
        key: 'completion',
        label: 'Completion',
        accessor: (kpi: KpiData) => calculateKPIs(kpi, docProgressData).completion,
      },
      {
        key: 'mustHave',
        label: 'Must-have Ready',
        accessor: (kpi: KpiData) => calculateKPIs(kpi, docProgressData).mustHaveReady,
      },
      {
        key: 'quality',
        label: 'Quality',
        accessor: (kpi: KpiData) => calculateKPIs(kpi, docProgressData).quality,
      },
      {
        key: 'speed',
        label: 'Speed',
        accessor: (kpi: KpiData) => calculateKPIs(kpi, docProgressData).speed,
      },
    ];

    const radarRows = metrics.map(metric => {
      const row: Record<string, number | string> = { metric: metric.label };
      contractors.forEach(contractor => {
        const kpi = data.find(entry => entry.contractor_id === contractor.id);
        row[contractor.name] = kpi ? metric.accessor(kpi) : 0;
      });
      return row;
    });

    return { radarData: radarRows, contractors, allContractors };
  }, [data, docProgressData, selectedContractors]);

  if (!radarData.length || contractors.length === 0) {
    return (
      <Card className={cn('p-5 flex flex-col gap-3', className)}>
        <div>
          <h3 className="text-lg font-semibold">Performance Radar</h3>
          <p className="text-sm text-muted-foreground">Overview of completion, quality, and speed</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No KPI data available for the current filters
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-5 space-y-4', className)}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Contractor Performance Comparison</h3>
            <p className="text-sm text-muted-foreground">Compare contractors across completion, quality, and speed indicators</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'radar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('radar')}
                aria-label="Switch to radar view"
              >
                <RadarIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'bars' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('bars')}
                aria-label="Switch to bar chart view"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-1">
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
        </div>
        
        {/* Contractor Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter contractors:</span>
          <Select
            value={selectedContractors.join(',') || 'all'}
            onValueChange={(value) => setSelectedContractors(value === 'all' ? [] : value.split(','))}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select contractors to compare" />
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
        {summary ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-muted-foreground">
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="font-medium text-foreground">{summary.overallCompletion}%</div>
              <div>Overall completion</div>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="font-medium text-foreground">{summary.mustHaveReady}%</div>
              <div>Must-have ready</div>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="font-medium text-foreground">{summary.overdueMustHaves}</div>
              <div>Overdue must-have</div>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="font-medium text-foreground">{summary.avgPrepTime || '-'}d</div>
              <div>Avg prep</div>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="font-medium text-foreground">{summary.avgApprovalTime || '-'}d</div>
              <div>Avg approval</div>
            </div>
          </div>
        ) : null}
      </div>
      {viewMode === 'radar' ? (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={radarData}
              outerRadius="65%"
              onMouseMove={(e: any) => {
                if (e && e.activeLabel) {
                  setHoveredMetric(e.activeLabel);
                }
              }}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <PolarGrid
                gridType="polygon"
                radialLines={true}
                stroke="#e5e7eb"
              />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 12 }}
                className="font-medium"
              />
              <PolarRadiusAxis
                angle={45}
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickCount={6}
              />
              <Tooltip content={<CustomRadarTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-sm font-medium">{value}</span>
                )}
              />
              {contractors.map((contractor, index) => (
                <Radar
                  key={contractor.id}
                  dataKey={contractor.name}
                  stroke={RADAR_COLORS[index % RADAR_COLORS.length]}
                  fill={RADAR_COLORS[index % RADAR_COLORS.length]}
                  fillOpacity={0.2}
                  strokeWidth={2}
                  name={contractor.name}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <PerformanceBarCharts data={data.filter(kpi =>
          selectedContractors.length === 0 || selectedContractors.includes(kpi.contractor_id)
        )} />
      )}
      
      {/* Performance indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
        {contractors.slice(0, 4).map((contractor, index) => {
          const kpi = data.find(entry => entry.contractor_id === contractor.id);
          if (!kpi) return null;
          
          const kpis = calculateKPIs(kpi, docProgressData);
          const avgScore = Math.round((kpis.completion + kpis.mustHaveReady + kpis.quality + kpis.speed) / 4);
          
          return (
            <div key={contractor.id} className="flex items-center gap-2 p-2 rounded-lg border">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: RADAR_COLORS[index % RADAR_COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{contractor.name}</p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold">{avgScore}%</span>
                  {avgScore >= 80 && <TrendingUp className="w-3 h-3 text-green-500" />}
                  {avgScore >= 60 && avgScore < 80 && <Minus className="w-3 h-3 text-yellow-500" />}
                  {avgScore < 60 && <TrendingDown className="w-3 h-3 text-red-500" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
