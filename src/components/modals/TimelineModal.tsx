import React, { useState } from 'react';
import { ModalContainer } from './ModalContainer';

export interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractors?: Array<{
    name: string;
    submission: number;
    review: number;
    approval: number;
  }>;
  onExport?: () => void;
}

/**
 * TimelineModal v2.0
 * Full project timeline with Gantt-style visualization
 * 
 * Features:
 * - Gantt-style bars for 3 phases
 * - View modes (Day/Week/Month)
 * - Contractor/Status/Category filters
 * - Timeline insights
 */
export const TimelineModal: React.FC<TimelineModalProps> = ({
  isOpen,
  onClose,
  contractors = [
    { name: 'Contractor A', submission: 100, review: 75, approval: 85 },
    { name: 'Contractor B', submission: 60, review: 50, approval: 45 },
    { name: 'Contractor C', submission: 85, review: 70, approval: 75 },
  ],
  onExport,
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

  const getPhaseColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const footer = (
    <div className="flex gap-2">
      <button
        onClick={onExport}
        className="flex-1 px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition-colors"
      >
        📥 Export Timeline (PDF)
      </button>
      <button
        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-50 transition-colors"
      >
        🖨️ Print View
      </button>
    </div>
  );

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title="📅 Full Project Timeline"
      size="xl"
      footer={footer}
    >
      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded">
        {/* View Mode */}
        <div className="flex gap-2">
          {['day', 'week', 'month'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as 'day' | 'week' | 'month')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                viewMode === mode
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              {mode === 'day' ? '📅 Day' : mode === 'week' ? '📅 Week' : '📅 Month'} View
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 ml-auto">
          <select className="px-2 py-1 border border-gray-300 rounded text-xs font-semibold bg-white">
            <option>All Contractors</option>
            <option>Contractor A</option>
            <option>Contractor B</option>
            <option>Contractor C</option>
          </select>
          <select className="px-2 py-1 border border-gray-300 rounded text-xs font-semibold bg-white">
            <option>All Categories</option>
            <option>Safety</option>
            <option>Quality</option>
            <option>Environmental</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-gray-50 rounded p-4 overflow-x-auto">
        <div className="min-w-full">
          {/* Header */}
          <div className="grid gap-1 mb-3" style={{ gridTemplateColumns: '150px 1fr 1fr 1fr' }}>
            <div className="font-semibold text-xs text-gray-700">Contractor</div>
            <div className="text-center font-semibold text-xs text-gray-700">Submission</div>
            <div className="text-center font-semibold text-xs text-gray-700">Review</div>
            <div className="text-center font-semibold text-xs text-gray-700">Approval</div>
          </div>

          {/* Gantt Rows */}
          <div className="space-y-2">
            {contractors.map((contractor) => (
              <div
                key={contractor.name}
                className="grid gap-1"
                style={{ gridTemplateColumns: '150px 1fr 1fr 1fr' }}
              >
                {/* Contractor Name */}
                <div className="font-semibold text-xs text-gray-900 py-2 pr-2">
                  {contractor.name}
                </div>

                {/* Submission Bar */}
                <div className="flex items-center">
                  <div
                    className={`h-10 rounded flex items-center justify-center text-white text-xs font-bold ${getPhaseColor(
                      contractor.submission
                    )}`}
                    style={{ width: `${contractor.submission}%` }}
                  >
                    {contractor.submission}%
                  </div>
                </div>

                {/* Review Bar */}
                <div className="flex items-center">
                  <div
                    className={`h-10 rounded flex items-center justify-center text-white text-xs font-bold ${getPhaseColor(
                      contractor.review
                    )}`}
                    style={{ width: `${contractor.review}%` }}
                  >
                    {contractor.review}%
                  </div>
                </div>

                {/* Approval Bar */}
                <div className="flex items-center">
                  <div
                    className={`h-10 rounded flex items-center justify-center text-white text-xs font-bold ${getPhaseColor(
                      contractor.approval
                    )}`}
                    style={{ width: `${contractor.approval}%` }}
                  >
                    {contractor.approval}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 p-3 bg-gray-50 rounded text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span>≥80% (On Track)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500 rounded" />
          <span>60-80% (Needs Attention)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span>&lt;60% (Critical)</span>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
        <h4 className="text-sm font-semibold text-amber-900 mb-2">📊 Timeline Insights</h4>
        <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
          <li>Contractor A is ahead of schedule in most phases</li>
          <li>Contractor B is significantly behind in all phases - needs immediate attention</li>
          <li>Contractor C is on track but slightly behind in review phase</li>
          <li>Average processing time: 8.5 days (Target: 7 days)</li>
        </ul>
      </div>
    </ModalContainer>
  );
};

export default TimelineModal;
