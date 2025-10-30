import React, { useMemo } from 'react';

export interface Contractor {
  id: string;
  name: string;
  score: number;
  rank?: number;
  status?: 'excellent' | 'good' | 'needs-attention';
}

export interface KpiSectionProps {
  overallCompletion: number;
  processingTime?: number;
  contractorRanking?: Array<{ id: string; name: string; score: number }>;
  onOverallClick?: () => void;
  onProcessingClick?: () => void;
  onRankingClick?: () => void;
}

/**
 * KpiSection v2.0
 * Display 3 KPI cards + ranking card
 * 
 * Layout:
 * - Desktop: 4 cols each, 12 cols total
 * - Tablet: 4 cols each, 8 cols total  
 * - Mobile: Full width, stacked
 */
export const KpiSection: React.FC<KpiSectionProps> = ({
  overallCompletion,
  processingTime = 0,
  contractorRanking = [],
  onOverallClick,
  onProcessingClick,
  onRankingClick,
}) => {
  // Sort contractors by score and assign ranks
  const rankedContractors = useMemo(() => {
    if (!contractorRanking || contractorRanking.length === 0) {
      return [];
    }
    return contractorRanking
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((contractor, index) => ({
        ...contractor,
        rank: index + 1,
        status:
          contractor.score >= 80
            ? 'excellent'
            : contractor.score >= 60
              ? 'good'
              : 'needs-attention',
      }));
  }, [contractorRanking]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-amber-600';
      case 'needs-attention':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBgColor = (status?: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100';
      case 'good':
        return 'bg-amber-100';
      case 'needs-attention':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Overall Completion KPI */}
      <div
        className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
        onClick={() => onOverallClick?.()}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onOverallClick?.();
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Overall Completion</h3>
          <span className="text-xl">📊</span>
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-bold text-blue-600">{overallCompletion}%</div>
          <div className="text-xs text-gray-500">
            Total document completion rate
          </div>
        </div>
        <div className="border-l-4 border-blue-500 pl-3 mt-3 text-xs text-gray-500">
          Total Progress
        </div>
      </div>

      {/* Processing Time KPI */}
      <div
        className="bg-white rounded-lg border border-gray-200 p-5 hover:border-amber-400 hover:shadow-md cursor-pointer transition-all"
        onClick={() => onProcessingClick?.()}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onProcessingClick?.();
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Avg Processing Time</h3>
          <span className="text-xl">⏱️</span>
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-bold text-amber-600">{processingTime}d</div>
          <div className="text-xs text-gray-500">
            Average document processing days
          </div>
        </div>
        <div className="border-l-4 border-amber-500 pl-3 mt-3 text-xs text-gray-500">
          Prep + Approval
        </div>
      </div>

      {/* Contractor Ranking KPI */}
      <div
        className="bg-white rounded-lg border-2 border-green-500 p-5 hover:shadow-md cursor-pointer transition-all"
        onClick={() => onRankingClick?.()}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onRankingClick?.();
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">🏆 Contractor Ranking</h3>
          <span className="text-xl">📈</span>
        </div>
        <div className="space-y-2">
          {rankedContractors.length > 0 ? (
            rankedContractors.map((contractor) => (
              <div key={contractor.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-700">{contractor.rank}.</span>
                  <div
                    className={`w-2 h-2 rounded-full ${getStatusBgColor(contractor.status)}`}
                  />
                  <span className="text-gray-600">{contractor.name}</span>
                </div>
                <span className={`font-semibold ${getStatusColor(contractor.status)}`}>
                  {contractor.score}%
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500 py-2">No contractor data</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KpiSection;
