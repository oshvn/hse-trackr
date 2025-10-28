import React, { useMemo, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ResponsiveContainer, 
  Tooltip
} from 'recharts';
import type { KpiData, DocProgressData } from '@/lib/dashboardHelpers';
import { cn } from '@/lib/utils';
import { Download, Filter, TrendingUp, TrendingDown, Minus, ArrowDownRight } from 'lucide-react';

interface ContractorHeatmapProps {
  data: KpiData[];
  docProgressData?: DocProgressData[];
  className?: string;
}

interface HeatmapCell {
  contractorId: string;
  contractorName: string;
  docType: string;
  docTypeId: string;
  value: number;
  status: 'good' | 'average' | 'poor';
  approved: number;
  required: number;
}

interface DrilldownData {
  contractorName: string;
  docTypeName: string;
  details: {
    approved: number;
    required: number;
    completion: number;
    status: string;
    plannedDate: string | null;
    submittedDate: string | null;
    approvedDate: string | null;
  }[];
}

const DOC_TYPES = [
  { key: 'MT_CM', label: 'Phương án AT' },
  { key: 'JHA', label: 'JHA' },
  { key: 'SMS', label: 'SMS' },
  { key: 'ERP', label: 'ERP' }
];

const COLORS = {
  good: '#22c55e',
  average: '#eab308',
  poor: '#ef4444',
  hover: '#3b82f6'
};

// Custom tooltip for heatmap
const CustomHeatmapTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 max-w-xs">
        <div className="space-y-2">
          <div>
            <p className="font-medium text-sm">{data.contractorName}</p>
            <p className="text-xs text-muted-foreground">{data.docType}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">Tiến độ:</span>
            <span className="font-medium text-sm">{data.value}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">Hoàn thành:</span>
            <span className="text-xs">{data.approved}/{data.required}</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: COLORS[data.status] }}
            />
            <span className="text-xs capitalize">
              {data.status === 'good' ? 'Tốt' : data.status === 'average' ? 'Trung bình' : 'Cần cải thiện'}
            </span>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Click để xem chi tiết</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const ContractorHeatmap: React.FC<ContractorHeatmapProps> = ({
  data,
  docProgressData = [],
  className
}) => {
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);
  const [selectedContractors, setSelectedContractors] = useState<string[]>([]);
  const [drilldownData, setDrilldownData] = useState<DrilldownData | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // Export functionality
  const handleExport = useCallback((format: 'png' | 'pdf' | 'excel') => {
    console.log(`Exporting as ${format}`);
    // This would integrate with a library like html2canvas, jsPDF, or xlsx
  }, []);

  // Get status based on completion percentage
  const getStatus = useCallback((value: number) => {
    if (value >= 80) return 'good';
    if (value >= 60) return 'average';
    return 'poor';
  }, []);

  // Handle cell click for drilldown
  const handleCellClick = useCallback((cell: HeatmapCell) => {
    // Find detailed data for this contractor and document type
    const contractorDocs = docProgressData.filter(doc => 
      doc.contractor_id === cell.contractorId && 
      doc.doc_type_name.includes(cell.docType)
    );
    
    const details = contractorDocs.map(doc => ({
      approved: doc.approved_count,
      required: doc.required_count,
      completion: doc.required_count > 0 ? Math.round((doc.approved_count / doc.required_count) * 100) : 0,
      status: doc.status_color,
      plannedDate: doc.planned_due_date,
      submittedDate: doc.first_submitted_at,
      approvedDate: doc.first_approved_at
    }));

    setDrilldownData({
      contractorName: cell.contractorName,
      docTypeName: cell.docType,
      details
    });
  }, [docProgressData]);

  const { heatmapData, contractors, allContractors, docTypes } = useMemo(() => {
    if (!data?.length || !docProgressData?.length) {
      return {
        heatmapData: [],
        contractors: [],
        allContractors: [],
        docTypes: []
      };
    }

    // Get all contractors for filter dropdown
    const allContractors = data.map(item => ({ id: item.contractor_id, name: item.contractor_name }));
    
    // Filter contractors based on selection
    let filteredContractors = allContractors;
    if (selectedContractors.length > 0) {
      filteredContractors = allContractors.filter(c => selectedContractors.includes(c.id));
    }
    
    // Limit to 5 contractors for better visibility
    const contractors = filteredContractors.slice(0, 5);

    // Get unique document types from data
    const uniqueDocTypes = Array.from(new Set(
      docProgressData
        .map(doc => doc.doc_type_name)
        .filter(name => name && !name.includes('Test'))
    )).slice(0, 6);

    // Filter document types based on selection
    let filteredDocTypes = uniqueDocTypes;
    if (selectedDocTypes.length > 0) {
      filteredDocTypes = uniqueDocTypes.filter(type => 
        selectedDocTypes.some(selected => type.includes(selected))
      );
    }

    // Create heatmap data
    const heatmapData: HeatmapCell[] = [];
    
    contractors.forEach(contractor => {
      filteredDocTypes.forEach(docType => {
        const contractorDocs = docProgressData.filter(doc => 
          doc.contractor_id === contractor.id && 
          doc.doc_type_name === docType
        );
        
        if (contractorDocs.length > 0) {
          const totalApproved = contractorDocs.reduce((sum, doc) => sum + doc.approved_count, 0);
          const totalRequired = contractorDocs.reduce((sum, doc) => sum + doc.required_count, 0);
          const completion = totalRequired > 0 ? Math.round((totalApproved / totalRequired) * 100) : 0;
          
          heatmapData.push({
            contractorId: contractor.id,
            contractorName: contractor.name,
            docType,
            docTypeId: contractorDocs[0]?.doc_type_id || '',
            value: completion,
            status: getStatus(completion),
            approved: totalApproved,
            required: totalRequired
          });
        }
      });
    });

    return { heatmapData, contractors, allContractors, docTypes: filteredDocTypes };
  }, [data, docProgressData, selectedContractors, selectedDocTypes, getStatus]);

  if (!heatmapData.length) {
    return (
      <Card className={cn('p-5 flex flex-col gap-3', className)}>
        <div>
          <h3 className="text-lg font-semibold">Performance Heatmap</h3>
          <p className="text-sm text-muted-foreground">Visualize performance by document type and contractor</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No data available for the current filters
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-5 space-y-4', className)}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Performance Heatmap</h3>
            <p className="text-sm text-muted-foreground">Visualize performance by document type and contractor</p>
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
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Doc Types:</span>
            <Select
              value={selectedDocTypes.join(',') || 'all'}
              onValueChange={(value) => setSelectedDocTypes(value === 'all' ? [] : value.split(','))}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select document types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All document types</SelectItem>
                {DOC_TYPES.map((docType) => (
                  <SelectItem key={docType.key} value={docType.key}>
                    {docType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDocTypes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDocTypes([])}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header */}
          <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: `150px repeat(${docTypes.length}, 1fr)` }}>
            <div className="text-xs font-medium text-muted-foreground p-2">Contractor \ Doc Type</div>
            {docTypes.map(docType => (
              <div key={docType} className="text-xs font-medium text-center p-2">
                {docType}
              </div>
            ))}
          </div>
          
          {/* Rows */}
          {contractors.map(contractor => (
            <div key={contractor.id} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `150px repeat(${docTypes.length}, 1fr)` }}>
              <div className="text-xs font-medium p-2 truncate">{contractor.name}</div>
              {docTypes.map(docType => {
                const cell = heatmapData.find(h => 
                  h.contractorId === contractor.id && h.docType === docType
                );
                
                if (!cell) {
                  return (
                    <div key={docType} className="h-12 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-400">—</span>
                    </div>
                  );
                }
                
                const isHovered = hoveredCell === `${contractor.id}-${docType}`;
                
                return (
                  <div
                    key={docType}
                    className={cn(
                      'h-12 rounded flex flex-col items-center justify-center cursor-pointer transition-all duration-200 border',
                      'hover:scale-105 hover:shadow-md',
                      isHovered && 'ring-2 ring-blue-500 ring-offset-1'
                    )}
                    style={{ 
                      backgroundColor: COLORS[cell.status],
                      opacity: isHovered ? 1 : 0.8
                    }}
                    onClick={() => handleCellClick(cell)}
                    onMouseEnter={() => setHoveredCell(`${contractor.id}-${docType}`)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <span className="text-white font-bold text-sm">{cell.value}%</span>
                    <span className="text-white text-xs">{cell.approved}/{cell.required}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.good }} />
          <span>Tốt (&gt;80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.average }} />
          <span>Trung bình (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.poor }} />
          <span>Cần cải thiện (&lt;60%)</span>
        </div>
      </div>

      {/* Drilldown Modal */}
      {drilldownData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Chi tiết Hồ sơ</h3>
                  <p className="text-sm text-muted-foreground">
                    {drilldownData.contractorName} - {drilldownData.docTypeName}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDrilldownData(null)}
                >
                  Đóng
                </Button>
              </div>
              
              <div className="space-y-3">
                {drilldownData.details.map((detail, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Hồ sơ #{index + 1}</span>
                      <Badge variant={
                        detail.status === 'green' ? 'default' :
                        detail.status === 'amber' ? 'secondary' : 'destructive'
                      }>
                        {detail.status === 'green' ? 'Hoàn thành' :
                         detail.status === 'amber' ? 'Đang xử lý' : 'Quá hạn'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tiến độ:</span>
                        <span className="ml-2 font-medium">{detail.completion}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Hoàn thành:</span>
                        <span className="ml-2 font-medium">{detail.approved}/{detail.required}</span>
                      </div>
                      {detail.plannedDate && (
                        <div>
                          <span className="text-muted-foreground">Kế hoạch:</span>
                          <span className="ml-2">{new Date(detail.plannedDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                      )}
                      {detail.submittedDate && (
                        <div>
                          <span className="text-muted-foreground">Nộp:</span>
                          <span className="ml-2">{new Date(detail.submittedDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                      )}
                      {detail.approvedDate && (
                        <div>
                          <span className="text-muted-foreground">Duyệt:</span>
                          <span className="ml-2">{new Date(detail.approvedDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};