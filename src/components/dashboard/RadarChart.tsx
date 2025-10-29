import React, { useMemo } from 'react';
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface ContractorMetrics {
  id: string;
  name: string;
  color: string;
  completionRate: number;
  onTimeDelivery: number;
  qualityScore: number;
  compliance: number;
  responseTime: number;
}

export interface RadarChartProps {
  contractors?: ContractorMetrics[];
  data?: ContractorMetrics[];
  onCardClick?: () => void;
  onItemClick?: (contractor: ContractorMetrics) => void;
}

/**
 * RadarChart v2.0
 * Display 5D contractor comparison
 * 
 * Dimensions:
 * - Completion Rate
 * - On-Time Delivery
 * - Quality Score
 * - Compliance
 * - Response Time
 */
export const RadarChart: React.FC<RadarChartProps> = ({ contractors, data, onCardClick, onItemClick }) => {
  // Accept either 'contractors' or 'data' prop
  const contractorData = contractors || data;

  // Transform data for Recharts
  const radarData = useMemo(() => {
    if (!contractorData || contractorData.length === 0) {
      return [];
    }
    return [
      {
        dimension: 'Completion',
        'Contractor A': contractorData[0]?.completionRate || 0,
        'Contractor B': contractorData[1]?.completionRate || 0,
        'Contractor C': contractorData[2]?.completionRate || 0,
        fullMark: 100,
      },
      {
        dimension: 'On-Time',
        'Contractor A': contractorData[0]?.onTimeDelivery || 0,
        'Contractor B': contractorData[1]?.onTimeDelivery || 0,
        'Contractor C': contractorData[2]?.onTimeDelivery || 0,
        fullMark: 100,
      },
      {
        dimension: 'Quality',
        'Contractor A': contractorData[0]?.qualityScore || 0,
        'Contractor B': contractorData[1]?.qualityScore || 0,
        'Contractor C': contractorData[2]?.qualityScore || 0,
        fullMark: 100,
      },
      {
        dimension: 'Compliance',
        'Contractor A': contractorData[0]?.compliance || 0,
        'Contractor B': contractorData[1]?.compliance || 0,
        'Contractor C': contractorData[2]?.compliance || 0,
        fullMark: 100,
      },
      {
        dimension: 'Response',
        'Contractor A': contractorData[0]?.responseTime || 0,
        'Contractor B': contractorData[1]?.responseTime || 0,
        'Contractor C': contractorData[2]?.responseTime || 0,
        fullMark: 100,
      },
    ];
  }, [contractorData]);

  // Don't render chart if no data
  if (!radarData || radarData.length === 0) {
    return (
      <div
        className="lg:col-span-6 lg:row-span-2 col-span-1 bg-white rounded-lg border-2 border-blue-500 p-5 hover:shadow-lg cursor-pointer transition-all"
        onClick={onCardClick}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onCardClick?.();
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">🎯 Contractor Performance Radar</h3>
          <span className="text-xl">🔍</span>
        </div>
        <div className="flex items-center justify-center h-80 text-gray-500">
          <div className="text-center">
            <p className="text-sm">No contractor data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="lg:col-span-6 lg:row-span-2 col-span-1 bg-white rounded-lg border-2 border-blue-500 p-5 hover:shadow-lg cursor-pointer transition-all relative"
      onClick={() => onItemClick?.(contractorData[0])}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onItemClick?.(contractorData[0]);
      }}
    >
      {/* Tag */}
      <div className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">
        Compare 3 Contractors
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">🎯 Contractor Performance Radar</h3>
        <span className="text-xl">🔍</span>
      </div>

      {/* Radar Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <RechartsRadarChart data={radarData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
          />
          <Radar
            name="Contractor A"
            dataKey="Contractor A"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.25}
          />
          <Radar
            name="Contractor B"
            dataKey="Contractor B"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.25}
          />
          <Radar
            name="Contractor C"
            dataKey="Contractor C"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.25}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value) => `${value}%`}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;
