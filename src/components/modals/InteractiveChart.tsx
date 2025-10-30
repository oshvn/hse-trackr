/**
 * Interactive Chart Component
 * - Zoom and pan functionality
 * - Brush selection
 * - Keyboard navigation
 * - Enhanced accessibility
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
  ReferenceLine
} from 'recharts';

interface InteractiveChartProps {
  data: any[];
  contractors: Array<{ id: string; name: string; color: string }>;
  height?: number;
  onSelectionChange?: (range: [number, number] | null) => void;
  selectedRange?: [number, number] | null;
  zoomRange?: { start: number; end: number } | null;
  onZoomChange?: (range: { start: number; end: number }) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  contractors,
  height = 400,
  onSelectionChange,
  selectedRange,
  zoomRange = { start: 0, end: 100 },
  onZoomChange,
  isLoading = false,
  error = null
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [brushRange, setBrushRange] = useState<[number, number] | null>(null);
  const chartRef = useRef<any>(null);

  // Handle brush change for zoom
  const handleBrushChange = useCallback((range: [number, number] | null) => {
    if (range && onZoomChange) {
      const dataLength = data.length;
      const startPercent = (range[0] / dataLength) * 100;
      const endPercent = (range[1] / dataLength) * 100;
      
      onZoomChange({ start: startPercent, end: endPercent });
    }
  }, [data.length, onZoomChange]);

  // Handle selection change
  const handleSelectionChange = useCallback((range: [number, number] | null) => {
    setBrushRange(range);
    onSelectionChange?.(range);
  }, [onSelectionChange]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isLoading || error || !zoomRange) return;

    const step = 5; // 5% step
    let newStart = zoomRange.start;
    let newEnd = zoomRange.end;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newStart = Math.max(0, zoomRange.start - step);
        newEnd = Math.max(newStart + 10, zoomRange.end - step);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newStart = Math.min(zoomRange.end - 10, zoomRange.start + step);
        newEnd = Math.min(100, zoomRange.end + step);
        break;
      case 'Home':
        e.preventDefault();
        newStart = 0;
        newEnd = 20; // Show first 20%
        break;
      case 'End':
        e.preventDefault();
        newStart = 80; // Show last 20%
        newEnd = 100;
        break;
      case 'Escape':
        e.preventDefault();
        newStart = 0;
        newEnd = 100;
        break;
      default:
        return;
    }

    onZoomChange?.({ start: newStart, end: newEnd });
  }, [zoomRange, onZoomChange, isLoading, error]);

  // Reset brush when zoom changes
  useEffect(() => {
    if (zoomRange && zoomRange.start === 0 && zoomRange.end === 100) {
      setBrushRange(null);
    }
  }, [zoomRange]);

  if (isLoading) {
    return (
      <div className="w-full bg-gray-100 rounded animate-pulse flex items-center justify-center" style={{ height }}>
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-50 rounded flex items-center justify-center" style={{ height }}>
        <div className="text-red-600 text-center">
          <div className="text-lg font-semibold mb-2">Chart Error</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-gray-50 rounded flex items-center justify-center" style={{ height }}>
        <div className="text-gray-500 text-center">
          <div className="text-lg font-semibold mb-2">No Data</div>
          <div className="text-sm">No chart data available</div>
        </div>
      </div>
    );
  }

  // Test fallback chart
  const TestChart = () => (
    <div className="w-full h-full bg-blue-50 rounded flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-2">📊</div>
        <div className="text-lg font-semibold text-blue-600">Test Chart</div>
        <div className="text-sm text-blue-500">Data: {data.length} points</div>
        <div className="text-sm text-blue-500">Contractors: {contractors.length}</div>
      </div>
    </div>
  );

  return (
    <div
      className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="img"
      aria-label="Interactive timeline chart. Use arrow keys to navigate, Home/End for extremes, Escape to reset zoom."
    >
      {/* Test fallback - comment out when Recharts works */}
      {/* <TestChart /> */}
      
      {/* Original Recharts - uncomment when working */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={{ value: 'Progress (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value, name) => [`${value}%`, name]}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            accessibility={{
              enabled: true,
              description: 'Timeline chart data point'
            }}
          />
          <Legend />
          
          <ReferenceLine y={80} stroke="#10b981" strokeDasharray="2 2" strokeOpacity={0.5} />
          <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="2 2" strokeOpacity={0.5} />
          
          {contractors.map((contractor) => (
            <Line
              key={contractor.id}
              type="monotone"
              dataKey={`${contractor.name} Progress`}
              name={`${contractor.name} Progress`}
              stroke={contractor.color}
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
            />
          ))}
          
          <Brush
            dataKey="day"
            height={30}
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.3}
            onChange={handleBrushChange}
            startIndex={brushRange?.[0]}
            endIndex={brushRange?.[1]}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Chart instructions */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        💡 Use arrow keys to navigate, Home/End for extremes, Escape to reset
      </div>
    </div>
  );
};
