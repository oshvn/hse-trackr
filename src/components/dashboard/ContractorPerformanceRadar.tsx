import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import type { KpiData, DocProgressData } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';
import { BarChart3, Radar as RadarIcon, Filter } from 'lucide-react';
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

const RADAR_COLORS = ['#2563eb', '#f97316', '#22c55e'];

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

export const ContractorPerformanceRadar: React.FC<ContractorPerformanceRadarProps> = ({
  data,
  docProgressData = [],
  summary,
  className
}) => {
  const [viewMode, setViewMode] = useState<'radar' | 'bars'>('radar');
  const [selectedContractors, setSelectedContractors] = useState<string[]>([]);

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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Contractor Performance Comparison</h3>
            <p className="text-sm text-muted-foreground">Compare contractors across completion, quality, and speed indicators</p>
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'radar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('radar')}
            >
              <RadarIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'bars' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('bars')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
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
            <RadarChart data={radarData} outerRadius="65%">
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={45} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: number) => [`${value}%`, 'Score']} />
              <Legend />
              {contractors.map((contractor, index) => (
                <Radar
                  key={contractor.id}
                  dataKey={contractor.name}
                  stroke={RADAR_COLORS[index % RADAR_COLORS.length]}
                  fill={RADAR_COLORS[index % RADAR_COLORS.length]}
                  fillOpacity={0.2}
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
    </Card>
  );
};
