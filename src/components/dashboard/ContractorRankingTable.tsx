import React, { useMemo, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Filter, 
  Trophy,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye
} from 'lucide-react';
import type { KpiData, DocProgressData } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';

interface ContractorRankingTableProps {
  data: KpiData[];
  docProgressData?: DocProgressData[];
  className?: string;
}

interface RankingItem {
  rank: number;
  contractorId: string;
  contractorName: string;
  completion: number;
  quality: number;
  speed: number;
  compliance: number;
  weightedScore: number;
  completionTrend: 'up' | 'down' | 'stable';
  qualityTrend: 'up' | 'down' | 'stable';
  speedTrend: 'up' | 'down' | 'stable';
  complianceTrend: 'up' | 'down' | 'stable';
  overallTrend: 'up' | 'down' | 'stable';
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

const WEIGHTS = {
  completion: 0.3,
  quality: 0.25,
  speed: 0.2,
  compliance: 0.25
};

const RANK_COLORS = {
  1: '#fbbf24', // Gold
  2: '#9ca3af', // Silver
  3: '#cd7f32', // Bronze
};

// Calculate KPIs according to specified formulas
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

// Calculate weighted score
const calculateWeightedScore = (kpis: { completion: number; quality: number; speed: number; mustHaveReady: number }) => {
  return Math.round(
    kpis.completion * WEIGHTS.completion +
    kpis.quality * WEIGHTS.quality +
    kpis.speed * WEIGHTS.speed +
    kpis.mustHaveReady * WEIGHTS.compliance
  );
};

// Get trend icon based on trend
const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'down':
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    default:
      return <Minus className="w-4 h-4 text-yellow-500" />;
  }
};

// Get rank icon based on rank
const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Award className="w-5 h-5 text-orange-600" />;
    default:
      return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">{rank}</span>;
  }
};

// Get status color based on value
const getStatusColor = (value: number) => {
  if (value >= 80) return 'text-green-600 bg-green-50';
  if (value >= 60) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

export const ContractorRankingTable: React.FC<ContractorRankingTableProps> = ({
  data,
  docProgressData = [],
  className
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'weightedScore', direction: 'desc' });
  const [selectedContractors, setSelectedContractors] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Export functionality
  const handleExport = useCallback((format: 'png' | 'pdf' | 'excel') => {
    console.log(`Exporting as ${format}`);
    // This would integrate with a library like html2canvas, jsPDF, or xlsx
  }, []);

  // Handle sort
  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  // Generate mock trend data (in real implementation, this would come from API)
  const generateTrend = useCallback((): 'up' | 'down' | 'stable' => {
    const trends: ('up' | 'down' | 'stable')[] = ['up', 'down', 'stable'];
    return trends[Math.floor(Math.random() * trends.length)];
  }, []);

  const { rankingData, allContractors } = useMemo(() => {
    if (!data?.length) {
      return {
        rankingData: [],
        allContractors: []
      };
    }

    // Get all contractors for filter dropdown
    const allContractors = data.map(item => ({ id: item.contractor_id, name: item.contractor_name }));
    
    // Filter contractors based on selection
    let filteredContractors = allContractors;
    if (selectedContractors.length > 0) {
      filteredContractors = allContractors.filter(c => selectedContractors.includes(c.id));
    }

    // Calculate rankings
    const rankings: RankingItem[] = filteredContractors.map(contractor => {
      const kpi = data.find(entry => entry.contractor_id === contractor.id);
      if (!kpi) return null;

      const kpis = calculateKPIs(kpi, docProgressData);
      const weightedScore = calculateWeightedScore(kpis);

      return {
        rank: 0, // Will be calculated after sorting
        contractorId: contractor.id,
        contractorName: contractor.name,
        completion: kpis.completion,
        quality: kpis.quality,
        speed: kpis.speed,
        compliance: kpis.mustHaveReady,
        weightedScore,
        completionTrend: generateTrend(),
        qualityTrend: generateTrend(),
        speedTrend: generateTrend(),
        complianceTrend: generateTrend(),
        overallTrend: generateTrend()
      };
    }).filter(Boolean) as RankingItem[];

    // Sort by weighted score
    rankings.sort((a, b) => b.weightedScore - a.weightedScore);

    // Assign ranks
    rankings.forEach((item, index) => {
      item.rank = index + 1;
    });

    // Apply additional sorting if needed
    if (sortConfig.key !== 'weightedScore') {
      rankings.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof RankingItem] as number;
        const bValue = b[sortConfig.key as keyof RankingItem] as number;
        
        if (sortConfig.direction === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }

    return { rankingData: rankings, allContractors };
  }, [data, docProgressData, selectedContractors, sortConfig, generateTrend]);

  if (!rankingData.length) {
    return (
      <Card className={cn('p-5 flex flex-col gap-3', className)}>
        <div>
          <h3 className="text-lg font-semibold">Contractor Rankings</h3>
          <p className="text-sm text-muted-foreground">Detailed performance rankings with weighted scores</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No ranking data available for current filters
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-5 space-y-4', className)}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Contractor Rankings</h3>
            <p className="text-sm text-muted-foreground">Detailed performance rankings with weighted scores</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              aria-label="Toggle detailed view"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel')}
              aria-label="Export as Excel"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Filters */}
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

      {/* Ranking Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleSort('contractorName')}
              >
                <div className="flex items-center gap-1">
                  Contractor
                  {sortConfig.key === 'contractorName' && (
                    sortConfig.direction === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />
                  )}
                  {sortConfig.key !== 'contractorName' && <ArrowUpDown className="w-4 h-4" />}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent text-center"
                onClick={() => handleSort('completion')}
              >
                <div className="flex items-center justify-center gap-1">
                  Hoàn thành
                  {sortConfig.key === 'completion' && (
                    sortConfig.direction === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />
                  )}
                  {sortConfig.key !== 'completion' && <ArrowUpDown className="w-4 h-4" />}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent text-center"
                onClick={() => handleSort('quality')}
              >
                <div className="flex items-center justify-center gap-1">
                  Chất lượng
                  {sortConfig.key === 'quality' && (
                    sortConfig.direction === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />
                  )}
                  {sortConfig.key !== 'quality' && <ArrowUpDown className="w-4 h-4" />}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent text-center"
                onClick={() => handleSort('speed')}
              >
                <div className="flex items-center justify-center gap-1">
                  Tốc độ
                  {sortConfig.key === 'speed' && (
                    sortConfig.direction === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />
                  )}
                  {sortConfig.key !== 'speed' && <ArrowUpDown className="w-4 h-4" />}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent text-center"
                onClick={() => handleSort('compliance')}
              >
                <div className="flex items-center justify-center gap-1">
                  Tuân thủ
                  {sortConfig.key === 'compliance' && (
                    sortConfig.direction === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />
                  )}
                  {sortConfig.key !== 'compliance' && <ArrowUpDown className="w-4 h-4" />}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent text-center font-bold"
                onClick={() => handleSort('weightedScore')}
              >
                <div className="flex items-center justify-center gap-1">
                  Tổng điểm
                  {sortConfig.key === 'weightedScore' && (
                    sortConfig.direction === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />
                  )}
                  {sortConfig.key !== 'weightedScore' && <ArrowUpDown className="w-4 h-4" />}
                </div>
              </TableHead>
              {showDetails && (
                <TableHead className="text-center">Xu hướng</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankingData.map((item) => (
              <TableRow key={item.contractorId} className="hover:bg-accent/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getRankIcon(item.rank)}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{item.contractorName}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Badge className={cn('px-2 py-1', getStatusColor(item.completion))}>
                      {item.completion}%
                    </Badge>
                    {showDetails && getTrendIcon(item.completionTrend)}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Badge className={cn('px-2 py-1', getStatusColor(item.quality))}>
                      {item.quality}%
                    </Badge>
                    {showDetails && getTrendIcon(item.qualityTrend)}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Badge className={cn('px-2 py-1', getStatusColor(item.speed))}>
                      {item.speed}
                    </Badge>
                    {showDetails && getTrendIcon(item.speedTrend)}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Badge className={cn('px-2 py-1', getStatusColor(item.compliance))}>
                      {item.compliance}%
                    </Badge>
                    {showDetails && getTrendIcon(item.complianceTrend)}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-bold text-lg">{item.weightedScore}</span>
                    {showDetails && getTrendIcon(item.overallTrend)}
                  </div>
                </TableCell>
                {showDetails && (
                  <TableCell className="text-center">
                    {getTrendIcon(item.overallTrend)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Weight Information */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Trọng số tính điểm:</strong></p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>• Hoàn thành: {WEIGHTS.completion * 100}%</div>
          <div>• Chất lượng: {WEIGHTS.quality * 100}%</div>
          <div>• Tốc độ: {WEIGHTS.speed * 100}%</div>
          <div>• Tuân thủ: {WEIGHTS.compliance * 100}%</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-50 border border-green-200" />
          <span>Tốt (&gt;80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-50 border border-yellow-200" />
          <span>Trung bình (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-50 border border-red-200" />
          <span>Cần cải thiện (&lt;60%)</span>
        </div>
      </div>
    </Card>
  );
};