import React, { useState } from 'react';

export interface ContractorBenchmark {
  completion: number;
  quality: number;
  compliance: number;
  timeline: number;
}

export interface ContractorScorecardProps {
  contractor: {
    id: string;
    name: string;
    completionRate: number;
    qualityScore: number;
    compliance: number;
    onTimeDelivery: number;
    responseTime: number;
  };
  benchmarks?: ContractorBenchmark;
  showRecommendations?: boolean;
  onContractorClick?: (contractorId: string) => void;
}

/**
 * ContractorScorecard v2.0 - Optimized
 * Compact performance scoring component for individual contractors
 * 
 * Optimizations:
 * - Reduced padding and spacing
 * - Compact metrics display
 * - Collapsible recommendations
 * - Click to open detailed modal
 */
export const ContractorScorecard: React.FC<ContractorScorecardProps> = ({
  contractor,
  benchmarks,
  showRecommendations = true,
  onContractorClick,
}) => {
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  
  // Calculate overall score (weighted average)
  const calculateOverallScore = () => {
    const weights = {
      completion: 0.3,
      quality: 0.25,
      compliance: 0.25,
      timeline: 0.2,
    };
    
    const scores = {
      completion: contractor.completionRate,
      quality: contractor.qualityScore,
      compliance: contractor.compliance,
      timeline: contractor.onTimeDelivery,
    };
    
    const overallScore = 
      scores.completion * weights.completion +
      scores.quality * weights.quality +
      scores.compliance * weights.compliance +
      scores.timeline * weights.timeline;
    
    return Math.round(overallScore);
  };

  const overallScore = calculateOverallScore();

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  // Get score status
  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Attention';
  };

  // Compare with benchmark
  const compareWithBenchmark = (metric: keyof ContractorBenchmark, value: number) => {
    if (!benchmarks) return null;
    const benchmark = benchmarks[metric];
    const diff = value - benchmark;
    
    if (diff >= 5) return { status: 'above', diff: `+${diff.toFixed(1)}%` };
    if (diff <= -5) return { status: 'below', diff: `${diff.toFixed(1)}%` };
    return { status: 'meets', diff: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%` };
  };

  // Generate recommendations
  const generateRecommendations = () => {
    const recommendations: string[] = [];
    
    if (contractor.completionRate < 70) {
      recommendations.push('Focus on document completion to meet project deadlines');
    }
    if (contractor.qualityScore < 75) {
      recommendations.push('Improve document quality through review processes');
    }
    if (contractor.compliance < 70) {
      recommendations.push('Address compliance gaps to avoid regulatory issues');
    }
    if (contractor.onTimeDelivery < 75) {
      recommendations.push('Improve timeline adherence to meet milestones');
    }
    if (contractor.responseTime < 70) {
      recommendations.push('Reduce response time for better communication');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Continue maintaining current performance standards');
    }
    
    return recommendations;
  };

  const recommendations = generateRecommendations();

  // Get risk level
  const getRiskLevel = () => {
    const lowRiskCount = [
      contractor.completionRate >= 80,
      contractor.qualityScore >= 75,
      contractor.compliance >= 70,
      contractor.onTimeDelivery >= 75,
    ].filter(Boolean).length;

    if (lowRiskCount >= 3) return { level: 'low', color: 'bg-green-100 text-green-700' };
    if (lowRiskCount >= 2) return { level: 'medium', color: 'bg-amber-100 text-amber-700' };
    return { level: 'high', color: 'bg-red-100 text-red-700' };
  };

  const riskLevel = getRiskLevel();

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onContractorClick?.(contractor.id)}
    >
      {/* Header - Compact */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{contractor.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Performance Scorecard</p>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ml-2 ${getScoreColor(overallScore)}`}>
          {overallScore}%
        </div>
      </div>

      {/* Overall Score - Compact */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-700">Overall Score</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${riskLevel.color}`}>
            {riskLevel.level.toUpperCase()} RISK
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              overallScore >= 80 ? 'bg-green-500' :
              overallScore >= 60 ? 'bg-amber-500' :
              'bg-red-500'
            }`}
            style={{ width: `${overallScore}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1 text-xs text-gray-600">
          <span>{getScoreStatus(overallScore)}</span>
          {benchmarks && (
            <span className="text-gray-500 text-xs">
              Avg: {Math.round(
                (benchmarks.completion + benchmarks.quality + benchmarks.compliance + benchmarks.timeline) / 4
              )}%
            </span>
          )}
        </div>
      </div>

      {/* Metrics Grid - Compact */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Completion</span>
            <span className="text-xs font-semibold">{contractor.completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-blue-500"
              style={{ width: `${contractor.completionRate}%` }}
            />
          </div>
          {benchmarks && (
            <span className="text-xs text-gray-500">
              {compareWithBenchmark('completion', contractor.completionRate)?.diff}
            </span>
          )}
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Quality</span>
            <span className="text-xs font-semibold">{contractor.qualityScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-green-500"
              style={{ width: `${contractor.qualityScore}%` }}
            />
          </div>
          {benchmarks && (
            <span className="text-xs text-gray-500">
              {compareWithBenchmark('quality', contractor.qualityScore)?.diff}
            </span>
          )}
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Compliance</span>
            <span className="text-xs font-semibold">{contractor.compliance}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-purple-500"
              style={{ width: `${contractor.compliance}%` }}
            />
          </div>
          {benchmarks && (
            <span className="text-xs text-gray-500">
              {compareWithBenchmark('compliance', contractor.compliance)?.diff}
            </span>
          )}
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Timeline</span>
            <span className="text-xs font-semibold">{contractor.onTimeDelivery}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-amber-500"
              style={{ width: `${contractor.onTimeDelivery}%` }}
            />
          </div>
          {benchmarks && (
            <span className="text-xs text-gray-500">
              {compareWithBenchmark('timeline', contractor.onTimeDelivery)?.diff}
            </span>
          )}
        </div>
      </div>

      {/* Recommendations - Collapsible */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-700">💡 Recommendations</h4>
            {recommendations.length > 2 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllRecommendations(!showAllRecommendations);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {showAllRecommendations ? 'Show less' : `Show all (${recommendations.length})`}
              </button>
            )}
          </div>
          <ul className="space-y-1">
            {(showAllRecommendations ? recommendations : recommendations.slice(0, 2)).map((rec, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start gap-1.5">
                <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                <span className="line-clamp-2">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ContractorScorecard;
