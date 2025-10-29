import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Clock, Trophy } from 'lucide-react';

export interface Contractor {
  id: string;
  name: string;
  score: number;
  rank?: number;
  status?: 'excellent' | 'good' | 'needs-attention';
}

export interface KpiSectionProps {
  overallCompletion: number;
  completionTrend: number;
  trendDirection: 'up' | 'down';
  avgProcessingTime: number;
  prepTime: number;
  approvalTime: number;
  contractors: Contractor[];
  onCardClick?: (cardType: 'overall' | 'processing' | 'ranking') => void;
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
  completionTrend,
  trendDirection,
  avgProcessingTime,
  prepTime,
  approvalTime,
  contractors,
  onCardClick,
}) => {
  // Sort contractors by score and assign ranks
  const rankedContractors = useMemo(() => {
    return contractors
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
  }, [contractors]);

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
    <div className="contents">
      {/* Overall Completion KPI */}
      <div
        className="lg:col-span-3 md:col-span-4 col-span-1 bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
        onClick={() => onCardClick?.('overall')}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onCardClick?.('overall');
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Overall Completion</h3>
          <span className="text-xl">📊</span>
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-bold text-blue-600">{overallCompletion}%</div>
          <div className="flex items-center gap-1 text-sm">
            {trendDirection === 'up' ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-600">↗ +{completionTrend}% vs last week</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-red-600">↘ -{completionTrend}% vs last week</span>
              </>
            )}
          </div>
        </div>
        <div className="border-l-4 border-blue-500 pl-3 mt-3 text-xs text-gray-500">
          Total Progress
        </div>
      </div>

      {/* Processing Time KPI */}
      <div
        className="lg:col-span-3 md:col-span-4 col-span-1 bg-white rounded-lg border border-gray-200 p-5 hover:border-amber-400 hover:shadow-md cursor-pointer transition-all"
        onClick={() => onCardClick?.('processing')}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onCardClick?.('processing');
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Avg Processing Time</h3>
          <span className="text-xl">⏱️</span>
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-bold text-amber-600">{avgProcessingTime}d</div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Prep: {prepTime}d</div>
            <div>Approval: {approvalTime}d</div>
          </div>
        </div>
        <div className="border-l-4 border-amber-500 pl-3 mt-3 text-xs text-gray-500">
          Prep + Approval
        </div>
      </div>

      {/* Contractor Ranking KPI */}
      <div
        className="lg:col-span-3 md:col-span-4 col-span-1 bg-white rounded-lg border-2 border-green-500 p-5 hover:shadow-md cursor-pointer transition-all"
        onClick={() => onCardClick?.('ranking')}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onCardClick?.('ranking');
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">🏆 Contractor Ranking</h3>
          <span className="text-xl">📈</span>
        </div>
        <div className="space-y-2">
          {rankedContractors.map((contractor) => (
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
          ))}
        </div>
      </div>

      {/* Empty space to maintain 12-col grid */}
      <div className="lg:col-span-3 hidden lg:block" />
    </div>
  );
};

export default KpiSection;
