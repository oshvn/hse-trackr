import React, { useState, useMemo, useEffect } from 'react';
import { ModalContainer } from './ModalContainer';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface Metric {
  name: string;
  contractorA?: number;
  contractorB?: number;
  contractorC?: number;
  // Dynamic contractor support
  [contractorName: string]: string | number | undefined;
}

export interface ContractorData {
  id: string;
  name: string;
  completionRate?: number;
  onTimeDelivery?: number;
  qualityScore?: number;
  compliance?: number;
  responseTime?: number;
  // Risk data (optional)
  riskScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  bottlenecks?: string[];
}

export interface RiskData {
  contractorId: string;
  contractorName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  bottlenecks: string[];
  predictedCompletion: number;
  predictedDate: Date;
  estimatedResources: 'Low' | 'Medium' | 'High';
  metrics: {
    completion: number;
    quality: number;
    compliance: number;
    timeline: number;
  };
  trend?: 'improving' | 'worsening' | 'stable';
}

export interface RadarDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics?: Metric[];
  data?: any; // Support contractor data, metrics, or single contractor
  contractors?: ContractorData[]; // Support multiple contractors
  contractor?: ContractorData; // Support single contractor
  riskData?: RiskData[]; // Risk assessment data
  onExport?: () => void;
  defaultView?: 'performance' | 'risk'; // Default view mode
}

// Helper function to get chart dataKey
const getChartDataKey = (contractorKey: string): string => {
  // Legacy A/B/C format
  if (contractorKey === 'contractorA') return 'A';
  if (contractorKey === 'contractorB') return 'B';
  if (contractorKey === 'contractorC') return 'C';
  // Dynamic contractor names - use full name
  return contractorKey;
};

/**
 * RadarDetailModal v2.0
 * Deep dive contractor performance analysis
 * 
 * Layout:
 * - Left: Simple chart
 * - Right: Metrics table + insights
 * - Contractor selector buttons
 */
export const RadarDetailModal: React.FC<RadarDetailModalProps> = ({
  isOpen,
  onClose,
  metrics,
  data,
  contractors,
  contractor,
  riskData,
  onExport,
  defaultView = 'performance',
}) => {
  const [viewMode, setViewMode] = useState<'performance' | 'risk'>(defaultView);
  
  // Update view mode when defaultView changes
  useEffect(() => {
    setViewMode(defaultView);
  }, [defaultView]);
  
  // Helper functions for Risk view
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#991b1b';
      default: return '#6b7280';
    }
  };
  
  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'Low Risk';
      case 'medium': return 'Medium Risk';
      case 'high': return 'High Risk';
      case 'critical': return 'Critical Risk';
      default: return 'Unknown';
    }
  };
  
  // Auto-detect data type and transform to unified format
  const detectedData = useMemo(() => {
    // Priority 1: Explicit contractors prop
    if (contractors && contractors.length > 0) {
      return { type: 'contractors', contractors };
    }
    
    // Priority 2: Single contractor
    if (contractor) {
      return { type: 'contractor', contractor };
    }
    
    // Priority 3: Data prop with contractor
    if (data?.contractor) {
      return { type: 'contractor', contractor: data.contractor };
    }
    
    // Priority 4: Data prop with contractors array
    if (data?.contractors && Array.isArray(data.contractors)) {
      return { type: 'contractors', contractors: data.contractors };
    }
    
    // Priority 5: Metrics (backward compatibility)
    if (metrics || data?.metrics) {
      return { type: 'metrics', metrics: metrics || data.metrics };
    }
    
    // Default fallback
    return { type: 'metrics', metrics: [
      { name: 'Completion', contractorA: 92, contractorB: 65, contractorC: 78 },
      { name: 'On-Time', contractorA: 88, contractorB: 72, contractorC: 85 },
      { name: 'Quality', contractorA: 95, contractorB: 68, contractorC: 82 },
      { name: 'Compliance', contractorA: 90, contractorB: 58, contractorC: 75 },
      { name: 'Response', contractorA: 89, contractorB: 70, contractorC: 80 },
    ]};
  }, [contractors, contractor, data, metrics]);

  // Get contractor list
  const contractorList = useMemo(() => {
    if (detectedData.type === 'contractors') {
      return detectedData.contractors;
    }
    if (detectedData.type === 'contractor') {
      return [detectedData.contractor];
    }
    return null;
  }, [detectedData]);

  // Transform contractors to metrics format
  const metricsData = useMemo(() => {
    if (detectedData.type === 'metrics') {
      return detectedData.metrics;
    }
    
    if (!contractorList || contractorList.length === 0) {
      return [];
    }

    // Convert contractors to metrics format
    const metricNames = [
      { key: 'completionRate', label: 'Completion' },
      { key: 'onTimeDelivery', label: 'On-Time' },
      { key: 'qualityScore', label: 'Quality' },
      { key: 'compliance', label: 'Compliance' },
      { key: 'responseTime', label: 'Response' },
    ];

    return metricNames.map(({ key, label }) => {
      const metric: Metric = { name: label };
      contractorList.forEach((c) => {
        const value = c[key as keyof ContractorData] as number;
        if (value !== undefined) {
          // Use contractor name as key for dynamic support
          metric[c.name] = value;
          // Also support legacy A/B/C format for backward compatibility
          if (contractorList.length === 3) {
            const index = contractorList.findIndex(ct => ct.id === c.id);
            if (index === 0) metric.contractorA = value;
            else if (index === 1) metric.contractorB = value;
            else if (index === 2) metric.contractorC = value;
          }
        }
      });
      return metric;
    });
  }, [detectedData, contractorList]);

  // Get contractor keys for selection - LUÔN HIỂN THỊ TẤT CẢ để có thể chọn thêm
  // Nếu có single contractor từ props, vẫn cần lấy TẤT CẢ contractors từ data để có thể chọn thêm
  const contractorKeys = useMemo(() => {
    // Nếu có contractors prop hoặc data.contractors, dùng đó (đã có đủ tất cả)
    if (contractors && contractors.length > 0) {
      return contractors.map(c => c.name);
    }
    if (data?.contractors && Array.isArray(data.contractors)) {
      return data.contractors.map((c: any) => c.name);
    }
    // Nếu chỉ có single contractor, vẫn cần tất cả contractors - nhưng không có trong contractorList
    // Fallback: dùng contractorList nếu có
    if (contractorList && contractorList.length > 0) {
      return contractorList.map(c => c.name);
    }
    // Backward compatibility
    return ['contractorA', 'contractorB', 'contractorC'];
  }, [contractors, data?.contractors, contractorList]);

  // Initialize selectedContractors: nếu có single contractor thì chỉ chọn contractor đó, nếu không thì chọn tất cả
  const initialSelected = useMemo(() => {
    if (detectedData.type === 'contractor' && contractorList && contractorList.length > 0) {
      return new Set([contractorList[0].name]);
    }
    return new Set(contractorKeys);
  }, [detectedData.type, contractorList, contractorKeys]);

  const [selectedContractors, setSelectedContractors] = useState<Set<string>>(initialSelected);

  // Sync selectedContractors when contractorKeys changes (nhưng không override nếu đã có selection)
  useEffect(() => {
    if (detectedData.type === 'contractor' && contractorList && contractorList.length > 0) {
      setSelectedContractors(new Set([contractorList[0].name]));
    } else if (selectedContractors.size === 0) {
      setSelectedContractors(new Set(contractorKeys));
    }
  }, [detectedData.type, contractorKeys, contractorList]);
  
  // Filter risk data by selected contractors - MUST be after contractorList and selectedContractors are defined
  const filteredRiskData = useMemo(() => {
    if (!riskData || !contractorList) return [];
    return riskData.filter(risk => {
      const contractor = contractorList.find(c => c.id === risk.contractorId);
      return contractor && selectedContractors.has(contractor.name);
    });
  }, [riskData, contractorList, selectedContractors]);

  // Transform data for chart
  const chartData = useMemo(() => {
    if (!metricsData || metricsData.length === 0) {
      return [];
    }
    
    return metricsData.map((m) => {
      const dataPoint: any = { metric: m.name.slice(0, 8) };
      
      // Support dynamic contractor names
      contractorKeys.forEach((key) => {
        if (selectedContractors.has(key)) {
          const value = m[key];
          if (value !== undefined) {
            // Use consistent dataKey
            const dataKey = getChartDataKey(key);
            dataPoint[dataKey] = value;
          }
        }
      });
      
      return dataPoint;
    });
  }, [metricsData, selectedContractors, contractorKeys]);

  // Calculate insights
  const insights = useMemo(() => {
    if (!contractorList || contractorList.length === 0) {
      // Fallback to old format
      const avgA = metricsData.reduce((sum, m) => sum + (m.contractorA || 0), 0) / metricsData.length;
      const avgB = metricsData.reduce((sum, m) => sum + (m.contractorB || 0), 0) / metricsData.length;
      const avgC = metricsData.reduce((sum, m) => sum + (m.contractorC || 0), 0) / metricsData.length;

      return {
        top: avgA > avgB && avgA > avgC ? 'A' : avgB > avgC ? 'B' : 'C',
        needsAttention: avgA < avgB && avgA < avgC ? 'A' : avgB < avgC ? 'B' : 'C',
        averages: {
          A: Math.round(avgA),
          B: Math.round(avgB),
          C: Math.round(avgC),
        },
      };
    }

    // Calculate averages for dynamic contractors
    const averages: Record<string, number> = {};
    contractorList.forEach((contractor) => {
      const sum = metricsData.reduce((acc, m) => {
        const value = m[contractor.name] as number;
        return acc + (value || 0);
      }, 0);
      averages[contractor.name] = Math.round(sum / metricsData.length);
    });

    // Find top and needs attention từ các contractors đã chọn
    const selectedAverages = Object.entries(averages).filter(([name]) => 
      selectedContractors.has(name)
    );
    const sorted = selectedAverages.sort((a, b) => b[1] - a[1]);
    const top = sorted[0]?.[0] || '';
    const needsAttention = sorted[sorted.length - 1]?.[0] || '';

    return {
      top,
      needsAttention,
      averages,
    };
  }, [metricsData, contractorList, selectedContractors]);

  const toggleContractor = (contractor: string) => {
    const newSet = new Set(selectedContractors);
    if (newSet.has(contractor)) {
      newSet.delete(contractor);
    } else {
      newSet.add(contractor);
    }
    setSelectedContractors(newSet);
  };

  const footer = (
    <div className="flex gap-2">
      <button
        onClick={onExport}
        className="flex-1 px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition-colors"
      >
        📊 Export Report
      </button>
    </div>
  );

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title={viewMode === 'risk' ? '⚠️ Contractor Risk Assessment' : '🎯 Contractor Performance Details'}
      size="xl"
      footer={footer}
    >
      {/* View Mode Toggle - Performance / Risk */}
      {riskData && riskData.length > 0 && (
        <div className="mb-4 flex justify-center">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('performance')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'performance'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Performance
            </button>
            <button
              onClick={() => setViewMode('risk')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'risk'
                  ? 'bg-white text-red-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ⚠️ Risk Assessment
            </button>
          </div>
        </div>
      )}
      
      {/* Risk View */}
      {viewMode === 'risk' && riskData && riskData.length > 0 ? (
        <div className="space-y-4">
          {/* Contractor Selector - Also show in Risk view */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Chọn nhà thầu để xem:</h4>
              {contractorKeys.length > 1 && (
                <button
                  onClick={() => setSelectedContractors(new Set(contractorKeys))}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedContractors.size === contractorKeys.length
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-sm'
                  }`}
                  title="Hiển thị tất cả nhà thầu"
                >
                  👁️ Xem tất cả ({contractorKeys.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {contractorKeys.map((contractorKey, index) => {
                const contractor = contractorList?.find(c => c.name === contractorKey);
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                const color = colors[index % colors.length];
                
                return (
                  <button
                    key={contractorKey}
                    onClick={() => toggleContractor(contractorKey)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                      selectedContractors.has(contractorKey)
                        ? 'text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-2 border-transparent'
                    }`}
                    style={selectedContractors.has(contractorKey) ? { backgroundColor: color } : {}}
                  >
                    {selectedContractors.has(contractorKey) && <span>✓</span>}
                    <span>{contractor?.name || contractorKey.replace('contractor', 'Contractor ')}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Đã chọn: {selectedContractors.size} / {contractorKeys.length} nhà thầu
            </p>
          </div>
          
          {/* Risk Details Cards */}
          {filteredRiskData.length > 0 ? (
            filteredRiskData.map((risk) => (
            <div
              key={risk.contractorId}
              className={`p-4 rounded-lg border-2 transition-all ${
                risk.riskLevel === 'critical' ? 'border-red-500 bg-red-50' :
                risk.riskLevel === 'high' ? 'border-red-300 bg-red-50' :
                risk.riskLevel === 'medium' ? 'border-amber-300 bg-amber-50' :
                'border-green-300 bg-green-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900 mb-1">{risk.contractorName}</h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded text-sm font-semibold`}
                      style={{
                        backgroundColor: getRiskColor(risk.riskLevel) + '20',
                        color: getRiskColor(risk.riskLevel),
                      }}
                    >
                      {risk.riskScore}% - {getRiskLabel(risk.riskLevel)}
                    </span>
                    {risk.trend && (
                      <span className="text-xs text-gray-500">
                        {risk.trend === 'improving' && '📉 Improving'}
                        {risk.trend === 'worsening' && '📈 Worsening'}
                        {risk.trend === 'stable' && '➡️ Stable'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Bottlenecks */}
              {risk.bottlenecks.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">🔴 Bottlenecks:</p>
                  <div className="flex flex-wrap gap-2">
                    {risk.bottlenecks.map((bottleneck, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium"
                      >
                        {bottleneck}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Metrics */}
              <div className="mb-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Completion Rate</p>
                  <p className="text-lg font-semibold text-gray-900">{risk.metrics.completion}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Quality Score</p>
                  <p className="text-lg font-semibold text-gray-900">{risk.metrics.quality}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Compliance</p>
                  <p className="text-lg font-semibold text-gray-900">{risk.metrics.compliance}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Timeline</p>
                  <p className="text-lg font-semibold text-gray-900">{risk.metrics.timeline}%</p>
                </div>
              </div>
              
              {/* Predictions */}
              <div className="pt-3 border-t border-gray-300 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">📅 Predicted Completion</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {risk.predictedCompletion}% by {risk.predictedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">📊 Resource Forecast</p>
                  <p className={`text-sm font-semibold ${
                    risk.estimatedResources === 'High' ? 'text-red-600' :
                    risk.estimatedResources === 'Medium' ? 'text-amber-600' :
                    'text-green-600'
                  }`}>
                    {risk.estimatedResources} Resources Needed
                  </p>
                </div>
              </div>
            </div>
          ))) : (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-1">No contractors selected</p>
                <p className="text-xs text-gray-500">Please select contractors to view risk details</p>
              </div>
            </div>
          )}
        </div>
      ) : viewMode === 'performance' ? (
        <>
      {/* Contractor Selector - LUÔN HIỂN THỊ TẤT CẢ để có thể chọn thêm */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Chọn nhà thầu để so sánh:</h4>
          {contractorKeys.length > 1 && (
            <button
              onClick={() => setSelectedContractors(new Set(contractorKeys))}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedContractors.size === contractorKeys.length
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-sm'
              }`}
              title="Hiển thị tất cả nhà thầu"
            >
              👁️ Xem tất cả ({contractorKeys.length})
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {contractorKeys.map((contractorKey, index) => {
            const contractor = contractorList?.find(c => c.name === contractorKey);
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
            const color = colors[index % colors.length];
            
            return (
              <button
                key={contractorKey}
                onClick={() => toggleContractor(contractorKey)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                  selectedContractors.has(contractorKey)
                    ? 'text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-2 border-transparent'
                }`}
                style={selectedContractors.has(contractorKey) ? { backgroundColor: color } : {}}
              >
                {selectedContractors.has(contractorKey) && <span>✓</span>}
                <span>{contractor?.name || contractorKey.replace('contractor', 'Contractor ')}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Đã chọn: {selectedContractors.size} / {contractorKeys.length} nhà thầu
        </p>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Left: Chart */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => `${value}%`} />
              {contractorKeys.map((contractorKey, index) => {
                if (!selectedContractors.has(contractorKey)) return null;
                
                const contractor = contractorList?.find(c => c.name === contractorKey);
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                const color = colors[index % colors.length];
                
                // Use consistent dataKey
                const dataKey = getChartDataKey(contractorKey);
                
                return (
                  <Line
                    key={contractorKey}
                    type="monotone"
                    dataKey={dataKey}
                    name={contractor?.name || contractorKey.replace('contractor', 'Contractor ')}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Insights */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">🎯 Key Insights</h3>

          {/* Top Performer */}
          {insights.top && selectedContractors.size > 1 && (
            <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
              <p className="text-xs font-semibold text-green-700">✓ Top Performer</p>
              <p className="text-xs text-green-600 mt-1">
                {typeof insights.averages === 'object' && insights.averages !== null
                  ? `${insights.top} leads with ${insights.averages[insights.top]}% average`
                  : `Contractor ${insights.top} leads with ${(insights as any)[`avg${insights.top}`]}% average`}
              </p>
            </div>
          )}

          {/* Needs Attention */}
          {insights.needsAttention && selectedContractors.size > 1 && (
            <div className="p-3 bg-red-50 border-l-4 border-red-600 rounded">
              <p className="text-xs font-semibold text-red-700">⚠️ Needs Attention</p>
              <p className="text-xs text-red-600 mt-1">
                {typeof insights.averages === 'object' && insights.averages !== null
                  ? `${insights.needsAttention} at ${insights.averages[insights.needsAttention]}% - review needed`
                  : `Contractor ${insights.needsAttention} at ${(insights as any)[`avg${insights.needsAttention}`]}% - review needed`}
              </p>
            </div>
          )}

          {/* Single Contractor Detail View */}
          {selectedContractors.size === 1 && contractorList && contractorList.length > 0 && (() => {
            const selectedContractor = contractorList.find(c => selectedContractors.has(c.name));
            if (!selectedContractor) return null;
            
            const avgScore = typeof insights.averages === 'object' && insights.averages !== null
              ? insights.averages[selectedContractor.name] || 0
              : 0;
            
            return (
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-xs font-semibold text-blue-700 mb-2">📊 Chi tiết {selectedContractor.name}</p>
                <div className="space-y-1 text-xs text-blue-600">
                  <p>Completion Rate: <strong>{selectedContractor.completionRate || 0}%</strong></p>
                  <p>On-Time Delivery: <strong>{selectedContractor.onTimeDelivery || 0}%</strong></p>
                  <p>Quality Score: <strong>{selectedContractor.qualityScore || 0}%</strong></p>
                  <p>Compliance: <strong>{selectedContractor.compliance || 0}%</strong></p>
                  <p>Response Time: <strong>{selectedContractor.responseTime || 0}%</strong></p>
                  <p className="mt-2 pt-2 border-t border-blue-300">
                    Trung bình: <strong>{avgScore}%</strong>
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Averages */}
          {selectedContractors.size > 1 && (
            <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-xs font-semibold text-blue-700 mb-2">📊 Averages</p>
              <div className="text-xs text-blue-600 space-y-1">
                {typeof insights.averages === 'object' && insights.averages !== null
                  ? Object.entries(insights.averages)
                      .filter(([name]) => selectedContractors.has(name))
                      .map(([name, avg]) => (
                        <p key={name}>
                          {contractorList?.find(c => c.name === name)?.name || name}: <strong>{avg}%</strong>
                        </p>
                      ))
                  : (
                    <>
                      {selectedContractors.has('contractorA') && <p>A: <strong>{(insights as any).avgA}%</strong></p>}
                      {selectedContractors.has('contractorB') && <p>B: <strong>{(insights as any).avgB}%</strong></p>}
                      {selectedContractors.has('contractorC') && <p>C: <strong>{(insights as any).avgC}%</strong></p>}
                    </>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Table */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">📊 Performance Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Metric</th>
                {contractorKeys.map((contractorKey, index) => {
                  if (!selectedContractors.has(contractorKey)) return null;
                  const contractor = contractorList?.find(c => c.name === contractorKey);
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <th
                      key={contractorKey}
                      className="text-center px-3 py-2 font-semibold"
                      style={{ color }}
                    >
                      {contractor?.name || contractorKey.replace('contractor', 'Contractor ')}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {metricsData.map((metric, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-2 font-semibold text-gray-900">{metric.name}</td>
                  {contractorKeys.map((contractorKey, index) => {
                    if (!selectedContractors.has(contractorKey)) return null;
                    
                    const contractor = contractorList?.find(c => c.name === contractorKey);
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                    const color = colors[index % colors.length];
                    
                    // Get value from metric
                    const value = metric[contractorKey] || 
                                 (contractorKey === 'contractorA' ? metric.contractorA :
                                  contractorKey === 'contractorB' ? metric.contractorB :
                                  contractorKey === 'contractorC' ? metric.contractorC : undefined);
                    
                    return (
                      <td
                        key={contractorKey}
                        className="text-center px-3 py-2 font-semibold"
                        style={{ color }}
                      >
                        {value !== undefined ? `${value}%` : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : null}
    </ModalContainer>
  );
};

export default RadarDetailModal;
