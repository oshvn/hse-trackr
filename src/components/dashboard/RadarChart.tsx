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
  // Trend data
  previousCompletionRate?: number;
  previousOnTimeDelivery?: number;
  previousQualityScore?: number;
  previousCompliance?: number;
  previousResponseTime?: number;
}

export interface RadarChartProps {
  contractors?: ContractorMetrics[];
  data?: ContractorMetrics[];
  onCardClick?: () => void;
  onItemClick?: (contractor: ContractorMetrics) => void;
  onContractorClick?: (contractor: ContractorMetrics) => void;
  selectedMetrics?: string[];
  onMetricsChange?: (metrics: string[]) => void;
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
// Available metrics configuration
const AVAILABLE_METRICS = [
  { key: 'completionRate', label: 'Completion Rate', icon: '📊' },
  { key: 'onTimeDelivery', label: 'On-Time Delivery', icon: '⏰' },
  { key: 'qualityScore', label: 'Quality Score', icon: '⭐' },
  { key: 'compliance', label: 'Compliance', icon: '✅' },
  { key: 'responseTime', label: 'Response Time', icon: '⚡' },
];

// Helper function to get trend direction
const getTrendDirection = (current: number, previous?: number): 'up' | 'down' | 'same' => {
  if (!previous) return 'same';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'same';
};

// Helper function to get trend icon
const getTrendIcon = (direction: 'up' | 'down' | 'same'): string => {
  switch (direction) {
    case 'up': return '↗️';
    case 'down': return '↘️';
    case 'same': return '→';
    default: return '→';
  }
};

// Helper function to get trend color
const getTrendColor = (direction: 'up' | 'down' | 'same'): string => {
  switch (direction) {
    case 'up': return 'text-green-600';
    case 'down': return 'text-red-600';
    case 'same': return 'text-gray-500';
    default: return 'text-gray-500';
  }
};

export const RadarChart: React.FC<RadarChartProps> = ({ 
  contractors, 
  data, 
  onCardClick, 
  onItemClick, 
  onContractorClick,
  selectedMetrics = ['completionRate', 'onTimeDelivery', 'qualityScore', 'compliance', 'responseTime'],
  onMetricsChange
}) => {
  // Accept either 'contractors' or 'data' prop
  const contractorData = contractors || data;

  // Transform data for Recharts with dynamic contractor names
  const radarData = useMemo(() => {
    if (!contractorData || contractorData.length === 0) {
      return [];
    }

    // Get dynamic contractor names
    const contractorNames = contractorData.map(c => c.name);
    
    // Create data structure with selected metrics
    const dimensions = AVAILABLE_METRICS.filter(metric => 
      selectedMetrics.includes(metric.key)
    );

    return dimensions.map(dim => {
      const dataPoint: any = {
        dimension: dim.label,
        fullMark: 100,
      };

      // Add each contractor's value for this dimension
      contractorNames.forEach((name, index) => {
        const contractor = contractorData[index];
        if (contractor) {
          dataPoint[name] = contractor[dim.key as keyof ContractorMetrics] || 0;
        }
      });

      return dataPoint;
    });
  }, [contractorData, selectedMetrics]);

  // Don't render chart if no data
  if (!radarData || radarData.length === 0) {
    return (
      <div
        className="xl:col-span-6 2xl:col-span-6 lg:col-span-6 lg:row-span-2 col-span-1 bg-white rounded-lg border-2 border-blue-500 p-5 hover:shadow-lg cursor-pointer transition-all"
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
      className="bg-white rounded-lg border-2 border-blue-500 p-5 hover:shadow-lg transition-all relative h-full flex flex-col"
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

      {/* Metric Selector */}
      <div className="mb-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_METRICS.map(metric => (
            <button
              key={metric.key}
              onClick={(e) => {
                e.stopPropagation();
                const newMetrics = selectedMetrics.includes(metric.key)
                  ? selectedMetrics.filter(m => m !== metric.key)
                  : [...selectedMetrics, metric.key];
                onMetricsChange?.(newMetrics);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedMetrics.includes(metric.key)
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{metric.icon}</span>
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Radar Chart */}
      <div 
        className="flex-1 min-h-[280px]"
        onClick={() => {
          // Open modal with all contractors when clicking on chart area
          onItemClick?.(contractorData[0]);
        }}
        style={{ cursor: 'pointer' }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart 
            data={radarData} 
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
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
          {/* Dynamic Radar components for each contractor */}
          {contractorData.map((contractor, index) => {
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
            const color = colors[index % colors.length];
            
            return (
              <Radar
                key={contractor.id}
                name={contractor.name}
                dataKey={contractor.name}
                stroke={color}
                fill={color}
                fillOpacity={0.25}
                onClick={(e) => {
                  e.stopPropagation();
                  // Don't open modal on radar line click, only on chart area
                }}
              />
            );
          })}
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !label) return null;
              
              return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                  <p className="font-semibold text-gray-900 mb-2">{label}</p>
                  {payload.map((entry, index) => {
                    const contractor = contractorData.find(c => c.name === entry.name);
                    if (!contractor) return null;
                    
                    const metricKey = AVAILABLE_METRICS.find(m => m.label === label)?.key;
                    if (!metricKey) return null;
                    
                    const currentValue = contractor[metricKey as keyof ContractorMetrics] as number;
                    const previousValue = contractor[`previous${metricKey.charAt(0).toUpperCase() + metricKey.slice(1)}` as keyof ContractorMetrics] as number;
                    const trend = getTrendDirection(currentValue, previousValue);
                    const change = previousValue ? currentValue - previousValue : 0;
                    
                    return (
                      <div key={index} className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm font-medium">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold">{currentValue}%</span>
                          {previousValue && (
                            <span className={`text-xs ${getTrendColor(trend)}`}>
                              {getTrendIcon(trend)} {change > 0 ? '+' : ''}{change}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RadarChart;
