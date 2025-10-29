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

export interface TimelineProps {
  days?: number;
  expectedProgress?: number[];
  actualProgress?: number[];
  onCardClick?: () => void;
}

/**
 * MiniTimeline v2.0
 * 30-day progress overview
 * 
 * Shows 2 lines:
 * - Expected progress (dashed blue)
 * - Actual progress (solid green)
 */
export const MiniTimeline: React.FC<TimelineProps> = ({
  days = 30,
  expectedProgress,
  actualProgress,
  onCardClick,
}) => {
  // Generate sample data if not provided
  const timelineData = useMemo(() => {
    const data = [];
    for (let i = 0; i <= days; i++) {
      const dayLabel = i === 0 ? '0d ago' : i === days ? 'Today' : `${i}d`;
      
      // Expected: linear progress (0% to 100%)
      const expected = (i / days) * 100;
      
      // Actual: slightly behind, then catching up
      let actual = (i / days) * 90;
      if (i > days * 0.7) {
        actual = Math.min(100, (i / days) * 100 - 5);
      }

      data.push({
        day: dayLabel,
        expected: Math.round(expected),
        actual: Math.round(actual),
      });
    }
    return data;
  }, [days]);

  return (
    <div
      className="lg:col-span-4 col-span-1 bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-400 hover:shadow-md cursor-pointer transition-all"
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onCardClick?.();
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">📅 30-Day Progress</h3>
        <span className="text-xl">📈</span>
      </div>

      {/* Timeline Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={timelineData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10 }}
            stroke="#9ca3af"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
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
          
          {/* Expected Progress Line (dashed) */}
          <Line
            type="monotone"
            dataKey="expected"
            name="Expected"
            stroke="#3b82f6"
            strokeDasharray="5 5"
            dot={false}
            strokeWidth={2}
          />
          
          {/* Actual Progress Line (solid) */}
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="#10b981"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Info */}
      <div className="mt-3 flex justify-between text-xs text-gray-600">
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
