import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface HistoricalData {
  date: Date;
  completion: number;
  quality: number;
  compliance: number;
  timeline: number;
  contractorId: string;
}

export interface ContractorData {
  id: string;
  name: string;
  currentMetrics: {
    completion: number;
    quality: number;
    compliance: number;
    timeline: number;
  };
  historicalData?: HistoricalData[];
}

export interface RiskAssessmentProps {
  contractors: ContractorData[];
  historicalData?: HistoricalData[];
  predictionHorizon?: '7d' | '30d' | '90d';
  onPredictionHorizonChange?: (horizon: '7d' | '30d' | '90d') => void;
  onContractorClick?: (contractorId: string) => void;
  onRiskDetailClick?: (contractorId: string, riskType: string) => void;
}

/**
 * RiskAssessment v2.0
 * Predictive analytics component for contractor risk assessment
 * 
 * Features:
 * - Risk scoring for each contractor
 * - Predictive completion dates
 * - Bottleneck identification
 * - Resource requirement forecasting
 */
export const RiskAssessment: React.FC<RiskAssessmentProps> = ({
  contractors,
  historicalData,
  predictionHorizon = '30d',
  onPredictionHorizonChange,
  onContractorClick,
  onRiskDetailClick,
}) => {
  // UI State
  const [sortBy, setSortBy] = useState<'risk' | 'name'>('risk');
  const [filterLevel, setFilterLevel] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [localHorizon, setLocalHorizon] = useState<'7d' | '30d' | '90d'>(predictionHorizon);
  const [showCriticalHighOnly, setShowCriticalHighOnly] = useState(false);
  
  // Use local horizon if parent doesn't provide onChange handler
  const activeHorizon = onPredictionHorizonChange ? predictionHorizon : localHorizon;
  
  const handleHorizonChange = (horizon: '7d' | '30d' | '90d') => {
    if (onPredictionHorizonChange) {
      onPredictionHorizonChange(horizon);
    } else {
      setLocalHorizon(horizon);
    }
  };
  // Calculate risk score for each contractor
  const riskScores = useMemo(() => {
    return contractors.map((contractor) => {
      const metrics = contractor.currentMetrics;
      
      // Risk factors (lower score = higher risk)
      const completionRisk = metrics.completion < 70 ? (70 - metrics.completion) * 2 : 0;
      const qualityRisk = metrics.quality < 75 ? (75 - metrics.quality) * 1.5 : 0;
      const complianceRisk = metrics.compliance < 70 ? (70 - metrics.compliance) * 2.5 : 0;
      const timelineRisk = metrics.timeline < 75 ? (75 - metrics.timeline) * 2 : 0;
      
      // Total risk score (0-100, higher = more risk)
      const totalRisk = Math.min(100, completionRisk + qualityRisk + complianceRisk + timelineRisk);
      
      // Risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (totalRisk < 20) riskLevel = 'low';
      else if (totalRisk < 40) riskLevel = 'medium';
      else if (totalRisk < 60) riskLevel = 'high';
      else riskLevel = 'critical';
      
      // Bottlenecks (areas with highest risk)
      const bottlenecks = [
        { name: 'Completion', risk: completionRisk },
        { name: 'Quality', risk: qualityRisk },
        { name: 'Compliance', risk: complianceRisk },
        { name: 'Timeline', risk: timelineRisk },
      ]
        .filter(b => b.risk > 0)
        .sort((a, b) => b.risk - a.risk)
        .slice(0, 2)
        .map(b => b.name);
      
      // Predictive completion date
      const daysUntilCompletion = activeHorizon === '7d' ? 7 : activeHorizon === '30d' ? 30 : 90;
      const completionRate = metrics.completion;
      const dailyImprovement = (100 - completionRate) / daysUntilCompletion;
      const predictedCompletion = completionRate + (dailyImprovement * daysUntilCompletion * 0.8); // Conservative estimate
      const predictedDate = new Date();
      predictedDate.setDate(predictedDate.getDate() + daysUntilCompletion);
      
      // Resource requirements forecast
      const resourceGap = 100 - completionRate;
      const estimatedResources = resourceGap > 20 ? 'High' : resourceGap > 10 ? 'Medium' : 'Low';
      
      // Calculate trend from historical data
      let trend: 'improving' | 'worsening' | 'stable' = 'stable';
      if (historicalData && contractor.historicalData) {
        const recent = contractor.historicalData.slice(-7); // Last 7 days
        if (recent.length >= 2) {
          const oldRisk = recent[0].completion < 70 ? (70 - recent[0].completion) * 2 : 0 +
                         recent[0].quality < 75 ? (75 - recent[0].quality) * 1.5 : 0 +
                         recent[0].compliance < 70 ? (70 - recent[0].compliance) * 2.5 : 0 +
                         recent[0].timeline < 75 ? (75 - recent[0].timeline) * 2 : 0;
          const newRisk = totalRisk;
          if (newRisk < oldRisk * 0.9) trend = 'improving';
          else if (newRisk > oldRisk * 1.1) trend = 'worsening';
        }
      }
      
      return {
        contractorId: contractor.id,
        contractorName: contractor.name,
        riskScore: Math.round(totalRisk),
        riskLevel,
        bottlenecks,
        predictedCompletion: Math.round(Math.min(100, predictedCompletion)),
        predictedDate,
        estimatedResources,
        metrics,
        trend,
      };
    });
  }, [contractors, activeHorizon, historicalData]);

  // Filter and sort risk scores
  const filteredAndSortedScores = useMemo(() => {
    let filtered = riskScores;
    
    // Apply filter
    if (showCriticalHighOnly) {
      // Show both critical and high when quick action is active
      filtered = filtered.filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high');
    } else if (filterLevel !== 'all') {
      filtered = filtered.filter(r => r.riskLevel === filterLevel);
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'risk') {
        return b.riskScore - a.riskScore; // Higher risk first
      } else {
        return a.contractorName.localeCompare(b.contractorName);
      }
    });
    
    return sorted;
  }, [riskScores, filterLevel, sortBy, showCriticalHighOnly]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return filteredAndSortedScores.map((risk) => ({
      name: risk.contractorName.length > 15 ? risk.contractorName.slice(0, 12) + '...' : risk.contractorName,
      fullName: risk.contractorName,
      contractorId: risk.contractorId,
      riskScore: risk.riskScore,
      riskLevel: risk.riskLevel,
      completion: risk.metrics.completion,
      quality: risk.metrics.quality,
      compliance: risk.metrics.compliance,
      timeline: risk.metrics.timeline,
      trend: risk.trend,
    }));
  }, [filteredAndSortedScores]);

  // Get risk color
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#991b1b';
      default: return '#6b7280';
    }
  };

  // Get risk label
  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'Low Risk';
      case 'medium': return 'Medium Risk';
      case 'high': return 'High Risk';
      case 'critical': return 'Critical Risk';
      default: return 'Unknown';
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: 'improving' | 'worsening' | 'stable') => {
    switch (trend) {
      case 'improving': return <TrendingDown className="w-3 h-3 text-green-600" />;
      case 'worsening': return <TrendingUp className="w-3 h-3 text-red-600" />;
      default: return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  // Quick actions - calculate after riskScores
  const criticalCount = useMemo(() => 
    riskScores.filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high').length,
    [riskScores]
  );
  
  const toggleCriticalHigh = () => {
    setShowCriticalHighOnly(!showCriticalHighOnly);
    if (!showCriticalHighOnly) {
      setFilterLevel('all'); // Reset filter when showing critical/high
    }
  };

  // Check if we have original data
  const hasOriginalData = riskScores.length > 0;
  const hasFilteredData = filteredAndSortedScores.length > 0;

  // Don't render if no original data at all
  if (!hasOriginalData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-400 hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">⚠️ Risk Assessment</h3>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-500">
          <p className="text-xs">No risk assessment data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-400 hover:shadow-md transition-all">
      {/* Header - Compact */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-700">⚠️ Risk Assessment</h3>
            {criticalCount > 0 && (
              <button
                onClick={toggleCriticalHigh}
                className={`px-2 py-0.5 text-xs font-semibold rounded transition-colors ${
                  showCriticalHighOnly 
                    ? 'bg-red-600 text-white' 
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
                title={`${criticalCount} critical/high risks - Click to ${showCriticalHighOnly ? 'show all' : 'filter'}`}
              >
                🔴 {criticalCount}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Predictive Analytics & Risk Scoring</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={activeHorizon}
            onChange={(e) => handleHorizonChange(e.target.value as '7d' | '30d' | '90d')}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white hover:border-gray-400 transition-colors"
          >
            <option value="7d">7d</option>
            <option value="30d">30d</option>
            <option value="90d">90d</option>
          </select>
        </div>
      </div>

      {/* Quick Actions & Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded text-xs">
          <button
            onClick={() => setSortBy('risk')}
            className={`px-2 py-1 rounded transition-all ${
              sortBy === 'risk' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Risk
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`px-2 py-1 rounded transition-all ${
              sortBy === 'name' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Name
          </button>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                filterLevel === level
                  ? level === 'critical' ? 'bg-red-100 text-red-700' :
                    level === 'high' ? 'bg-red-50 text-red-600' :
                    level === 'medium' ? 'bg-amber-100 text-amber-700' :
                    level === 'low' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Score Chart - Compact */}
      <div className="mb-4">
        {hasFilteredData ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Risk Score', position: 'insideBottom', offset: -5, style: { fontSize: '10px' } }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10 }}
                  width={80}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload[0]) return null;
                    
                    const data = payload[0].payload;
                    const riskScore = filteredAndSortedScores.find(r => r.contractorId === data.contractorId);
                    
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900 mb-2 text-xs">{data.fullName}</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-600">Risk Score:</span>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(data.trend)}
                              <span className={`font-semibold`} style={{ color: getRiskColor(data.riskLevel) }}>
                                {data.riskScore}% - {getRiskLabel(data.riskLevel)}
                              </span>
                            </div>
                          </div>
                          {riskScore?.bottlenecks && riskScore.bottlenecks.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <span className="text-gray-600">Bottlenecks:</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {riskScore.bottlenecks.map((bottleneck, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs"
                                  >
                                    {bottleneck}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {riskScore?.predictedCompletion && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Predicted:</span>
                                <span className="font-medium">{riskScore.predictedCompletion}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  x={40}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                <ReferenceLine
                  x={60}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                />
                <Bar
                  dataKey="riskScore"
                  onClick={(data) => {
                    const contractor = contractors.find(c => c.id === data.contractorId);
                    contractor && onContractorClick?.(contractor.id);
                  }}
                  cursor="pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getRiskColor(entry.riskLevel)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">No contractors match this filter</p>
              <p className="text-xs text-gray-500">Try selecting a different risk level or click "All"</p>
            </div>
          </div>
        )}
      </div>

      {/* Risk Details - Xóa phần này, sẽ di chuyển vào modal */}
      {/* Click vào chart bar hoặc contractor để xem chi tiết trong modal */}
    </div>
  );
};

export default RiskAssessment;
