import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface ContractorComparison {
  id: string;
  name: string;
  completion: number;
}

export interface BarChartComparisonProps {
  contractors?: ContractorComparison[];
  data?: ContractorComparison[];
  onBarClick?: (contractorId: string) => void;
  onItemClick?: (contractor: ContractorComparison) => void;
}

/**
 * BarChartComparison v2.0
 * Horizontal bar chart for contractor completion comparison
 * 
 * Colors:
 * - ≥80%: Green (#10b981)
 * - 60-80%: Orange (#f59e0b)
 * - <60%: Red (#ef4444)
 */
export const BarChartComparison: React.FC<BarChartComparisonProps> = ({
  contractors,
  data,
  onBarClick,
  onItemClick,
}) => {
  // Accept either 'contractors' or 'data' prop
  const contractorData = contractors || data;

  const getBarColor = (completion: number) => {
    if (completion >= 80) return '#10b981';
    if (completion >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const chartData = (contractorData || []).map((c) => ({
    name: c.name,
    id: c.id,
    completion: c.completion,
    color: getBarColor(c.completion),
  }));

  // Don't render chart if no data
  if (!chartData || chartData.length === 0) {
    return (
      <div
        className="lg:col-span-4 col-span-1 bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-400 hover:shadow-md cursor-pointer transition-all"
        onClick={() => onBarClick?.(contractors?.[0]?.id)}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onBarClick?.(contractors?.[0]?.id);
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">📊 Contractor Comparison</h3>
          <span className="text-xl">📈</span>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="text-center">
            <p className="text-sm">No contractor data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="lg:col-span-4 col-span-1 bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-400 hover:shadow-md cursor-pointer transition-all flex flex-col h-full min-h-[350px]"
      onClick={() => onBarClick?.(contractors?.[0]?.id)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onBarClick?.(contractors?.[0]?.id);
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-700">📊 Contractor Comparison</h3>
        <span className="text-xl">📈</span>
      </div>

      {/* Bar Chart */}
      <div className="flex-1 min-h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 100, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 12 }}
              width={95}
            />
            <Tooltip
              formatter={(value) => `${value}%`}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
            />
            <Bar
              dataKey="completion"
              fill="#3b82f6"
              radius={[0, 6, 6, 0]}
              onClick={(data) => {
                const contractor = contractors?.find((c) => c.name === data.name);
                contractor && onBarClick?.(contractor.id);
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-gray-600">≥80%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-500 rounded" />
          <span className="text-gray-600">60-80%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span className="text-gray-600">&lt;60%</span>
        </div>
      </div>
    </div>
  );
};

export default BarChartComparison;
