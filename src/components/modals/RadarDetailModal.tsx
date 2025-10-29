import React, { useState, useMemo } from 'react';
import { ModalContainer } from './ModalContainer';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface Metric {
  name: string;
  contractorA: number;
  contractorB: number;
  contractorC: number;
}

export interface RadarDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: Metric[];
  onExport?: () => void;
}

/**
 * RadarDetailModal v2.0
 * Deep dive contractor performance analysis
 * 
 * Layout:
 * - Left: Simple chart
 * - Right: Metrics table + insights
 * - Contractor selector buttons
 */
export const RadarDetailModal: React.FC<RadarDetailModalProps> = ({
  isOpen,
  onClose,
  metrics,
  onExport,
}) => {
  const [selectedContractors, setSelectedContractors] = useState<Set<string>>(
    new Set(['contractorA', 'contractorB', 'contractorC'])
  );

  // Transform data for chart
  const chartData = useMemo(() => {
    return metrics.map((m) => ({
      metric: m.name.slice(0, 8),
      ...(selectedContractors.has('contractorA') && { A: m.contractorA }),
      ...(selectedContractors.has('contractorB') && { B: m.contractorB }),
      ...(selectedContractors.has('contractorC') && { C: m.contractorC }),
    }));
  }, [metrics, selectedContractors]);

  // Calculate insights
  const insights = useMemo(() => {
    const avgA = metrics.reduce((sum, m) => sum + m.contractorA, 0) / metrics.length;
    const avgB = metrics.reduce((sum, m) => sum + m.contractorB, 0) / metrics.length;
    const avgC = metrics.reduce((sum, m) => sum + m.contractorC, 0) / metrics.length;

    return {
      top: avgA > avgB && avgA > avgC ? 'A' : avgB > avgC ? 'B' : 'C',
      needsAttention: avgA < avgB && avgA < avgC ? 'A' : avgB < avgC ? 'B' : 'C',
      avgA: Math.round(avgA),
      avgB: Math.round(avgB),
      avgC: Math.round(avgC),
    };
  }, [metrics]);

  const toggleContractor = (contractor: string) => {
    const newSet = new Set(selectedContractors);
    if (newSet.has(contractor)) {
      newSet.delete(contractor);
    } else {
      newSet.add(contractor);
    }
    setSelectedContractors(newSet);
  };

  const footer = (
    <div className="flex gap-2">
      <button
        onClick={onExport}
        className="flex-1 px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition-colors"
      >
        📊 Export Report
      </button>
    </div>
  );

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title="🎯 Contractor Performance Details"
      size="xl"
      footer={footer}
    >
      {/* Contractor Selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedContractors(new Set(['contractorA', 'contractorB', 'contractorC']))}
          className={`px-3 py-2 rounded font-semibold text-sm transition-colors ${
            selectedContractors.size === 3
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          View All 3
        </button>
        {['contractorA', 'contractorB', 'contractorC'].map((contractor) => (
          <button
            key={contractor}
            onClick={() => toggleContractor(contractor)}
            className={`px-3 py-2 rounded font-semibold text-sm transition-colors ${
              selectedContractors.has(contractor)
                ? contractor === 'contractorA'
                  ? 'bg-blue-500 text-white'
                  : contractor === 'contractorB'
                    ? 'bg-green-500 text-white'
                    : 'bg-amber-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {contractor.replace('contractor', 'Contractor ')}
          </button>
        ))}
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Left: Chart */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => `${value}%`} />
              {selectedContractors.has('contractorA') && (
                <Line
                  type="monotone"
                  dataKey="A"
                  name="Contractor A"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {selectedContractors.has('contractorB') && (
                <Line
                  type="monotone"
                  dataKey="B"
                  name="Contractor B"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {selectedContractors.has('contractorC') && (
                <Line
                  type="monotone"
                  dataKey="C"
                  name="Contractor C"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Insights */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">🎯 Key Insights</h3>

          {/* Top Performer */}
          <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="text-xs font-semibold text-green-700">✓ Top Performer</p>
            <p className="text-xs text-green-600 mt-1">
              Contractor {insights.top} leads with {insights[`avg${insights.top}` as keyof typeof insights]}% average
            </p>
          </div>

          {/* Needs Attention */}
          <div className="p-3 bg-red-50 border-l-4 border-red-600 rounded">
            <p className="text-xs font-semibold text-red-700">⚠️ Needs Attention</p>
            <p className="text-xs text-red-600 mt-1">
              Contractor {insights.needsAttention} at {insights[`avg${insights.needsAttention}` as keyof typeof insights]}% - review needed
            </p>
          </div>

          {/* Averages */}
          <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-xs font-semibold text-blue-700 mb-2">📊 Averages</p>
            <div className="text-xs text-blue-600 space-y-1">
              <p>A: <strong>{insights.avgA}%</strong></p>
              <p>B: <strong>{insights.avgB}%</strong></p>
              <p>C: <strong>{insights.avgC}%</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">📊 Performance Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Metric</th>
                {selectedContractors.has('contractorA') && (
                  <th className="text-center px-3 py-2 font-semibold text-blue-600">A</th>
                )}
                {selectedContractors.has('contractorB') && (
                  <th className="text-center px-3 py-2 font-semibold text-green-600">B</th>
                )}
                {selectedContractors.has('contractorC') && (
                  <th className="text-center px-3 py-2 font-semibold text-amber-600">C</th>
                )}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-2 font-semibold text-gray-900">{metric.name}</td>
                  {selectedContractors.has('contractorA') && (
                    <td className="text-center px-3 py-2 font-semibold text-blue-600">
                      {metric.contractorA}%
                    </td>
                  )}
                  {selectedContractors.has('contractorB') && (
                    <td className="text-center px-3 py-2 font-semibold text-green-600">
                      {metric.contractorB}%
                    </td>
                  )}
                  {selectedContractors.has('contractorC') && (
                    <td className="text-center px-3 py-2 font-semibold text-amber-600">
                      {metric.contractorC}%
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModalContainer>
  );
};

export default RadarDetailModal;
