import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface ContractorTimelineData {
  id: string;
  name: string;
  color: string;
  expectedProgress: number[];
  actualProgress: number[];
}

export interface TimelineProps {
  days?: number;
  expectedProgress?: number[];
  actualProgress?: number[];
  contractors?: ContractorTimelineData[];
  showContractorBreakdown?: boolean;
  selectedContractors?: string[];
  onContractorToggle?: (contractorId: string) => void;
  onCardClick?: () => void;
}

/**
 * MiniTimeline v2.0
 * 30-day progress overview with contractor breakdown
 * 
 * Shows:
 * - Expected vs Actual progress (if no contractors)
 * - Contractor-specific progress lines (if contractors provided)
 */
export const MiniTimeline: React.FC<TimelineProps> = ({
  days = 30,
  expectedProgress,
  actualProgress,
  contractors,
  showContractorBreakdown = false,
  selectedContractors,
  onContractorToggle,
  onCardClick,
}) => {
  // Use contractor data if available, otherwise use global timeline
  const useContractorMode = showContractorBreakdown && contractors && contractors.length > 0;
  const displayContractors = useContractorMode 
    ? contractors.filter(c => !selectedContractors || selectedContractors.includes(c.id))
    : [];

  // Generate timeline data
  const timelineData = useMemo(() => {
    const data = [];
    
    for (let i = 0; i <= days; i++) {
      const dayLabel = i === 0 ? '0d ago' : i === days ? 'Today' : `${i}d`;
      const dataPoint: any = { day: dayLabel };

      if (useContractorMode && displayContractors.length > 0) {
        // Contractor-specific mode
        displayContractors.forEach((contractor, index) => {
          const expected = contractor.expectedProgress[i] ?? (i / days) * 100;
          const actual = contractor.actualProgress[i] ?? expected * 0.9;
          
          dataPoint[`${contractor.name} Expected`] = Math.round(expected);
          dataPoint[`${contractor.name} Actual`] = Math.round(actual);
        });
      } else {
        // Global mode
        const expected = expectedProgress?.[i] ?? (i / days) * 100;
        let actual = actualProgress?.[i] ?? (i / days) * 90;
        if (i > days * 0.7) {
          actual = Math.min(100, (i / days) * 100 - 5);
        }
        
        dataPoint.expected = Math.round(expected);
        dataPoint.actual = Math.round(actual);
      }

      data.push(dataPoint);
    }
    return data;
  }, [days, expectedProgress, actualProgress, useContractorMode, displayContractors]);

  return (
    <div
        className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-400 hover:shadow-md cursor-pointer transition-all flex flex-col h-full min-h-[350px]"
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onCardClick?.();
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-700">📅 30-Day Progress</h3>
        <span className="text-xl">📈</span>
      </div>

      {/* Contractor Toggle (if contractor mode) */}
      {useContractorMode && contractors && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {contractors.map((contractor) => {
              const isSelected = !selectedContractors || selectedContractors.includes(contractor.id);
              return (
                <button
                  key={contractor.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onContractorToggle?.(contractor.id);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: contractor.color }}
                    />
                    {contractor.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline Chart */}
      <div className="flex-1 min-h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timelineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
            />
            <Tooltip
              formatter={(value) => `${value}%`}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            
            {useContractorMode && displayContractors.length > 0 ? (
              // Contractor-specific lines
              <>
                {displayContractors.map((contractor) => (
                  <React.Fragment key={contractor.id}>
                    <Line
                      type="monotone"
                      dataKey={`${contractor.name} Expected`}
                      name={`${contractor.name} Expected`}
                      stroke={contractor.color}
                      strokeDasharray="5 5"
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey={`${contractor.name} Actual`}
                      name={`${contractor.name} Actual`}
                      stroke={contractor.color}
                      dot={false}
                      strokeWidth={2}
                    />
                  </React.Fragment>
                ))}
              </>
            ) : (
              // Global lines
              <>
                <Line
                  type="monotone"
                  dataKey="expected"
                  name="Expected"
                  stroke="#3b82f6"
                  strokeDasharray="5 5"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="#10b981"
                  dot={false}
                  strokeWidth={2}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Info */}
      <div className="mt-4 flex justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" style={{ borderStyle: 'dashed' }} />
          <span>Expected (30d)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Actual Progress</span>
        </div>
      </div>
    </div>
  );
};

export default MiniTimeline;
