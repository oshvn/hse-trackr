import React, { useState, useMemo } from 'react';
import { ModalContainer } from './ModalContainer';
import { ChevronDown } from 'lucide-react';

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName?: string;
  completion?: number;
  approved?: number;
  pending?: number;
  missing?: number;
  overdue?: number;
  contractors?: Array<{ name: string; completion: number; docs: string[] }>;
  onSendReminders?: () => void;
  onExport?: () => void;
}

/**
 * CategoryModal v2.0
 * Category deep dive with 3 tabs
 * 
 * Tabs:
 * - Overview: Circular progress + stats grid
 * - By Contractor: Contractor breakdown with expandable sections
 * - Timeline: Simple timeline view
 */
export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categoryName = 'Safety Plans',
  completion = 75,
  approved = 12,
  pending = 3,
  missing = 1,
  overdue = 2,
  contractors = [
    { name: 'Contractor A', completion: 100, docs: ['Doc 1', 'Doc 2', 'Doc 3'] },
    { name: 'Contractor B', completion: 50, docs: ['Doc 1', 'Doc 2'] },
    { name: 'Contractor C', completion: 80, docs: ['Doc 1', 'Doc 2', 'Doc 3', 'Doc 4'] },
  ],
  onSendReminders,
  onExport,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'contractor' | 'timeline'>('overview');
  const [expandedContractor, setExpandedContractor] = useState<string | null>(null);

  const footer = (
    <div className="flex gap-2">
      <button
        onClick={onSendReminders}
        className="flex-1 px-4 py-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition-colors"
      >
        📧 Send Reminders for Missing Docs
      </button>
      <button
        onClick={onExport}
        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-50 transition-colors"
      >
        📥 Export Report
      </button>
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Progress Ring */}
      <div className="text-center">
        <div className="w-32 h-32 mx-auto relative mb-4">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeDasharray={`${completion * 1.0044} 100.5`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-gray-900">{completion}%</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-green-50 rounded text-center">
          <div className="text-2xl font-bold text-green-600">{approved}</div>
          <div className="text-xs text-green-700 font-semibold">Approved ✓</div>
        </div>
        <div className="p-3 bg-amber-50 rounded text-center">
          <div className="text-2xl font-bold text-amber-600">{pending}</div>
          <div className="text-xs text-amber-700 font-semibold">Pending ⏳</div>
        </div>
        <div className="p-3 bg-red-50 rounded text-center">
          <div className="text-2xl font-bold text-red-600">{missing}</div>
          <div className="text-xs text-red-700 font-semibold">Missing ❌</div>
        </div>
        <div className="p-3 bg-red-100 rounded text-center">
          <div className="text-2xl font-bold text-red-700">{overdue}</div>
          <div className="text-xs text-red-800 font-semibold">Overdue 🔴</div>
        </div>
      </div>
    </div>
  );

  const ContractorTab = () => (
    <div className="space-y-3">
      {contractors.map((contractor) => {
        const isExpanded = expandedContractor === contractor.name;
        return (
          <div key={contractor.name} className="border border-gray-200 rounded">
            {/* Header */}
            <button
              onClick={() =>
                setExpandedContractor(isExpanded ? null : contractor.name)
              }
              className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="text-left flex-1">
                <h4 className="text-sm font-semibold text-gray-900">{contractor.name}</h4>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      contractor.completion >= 80
                        ? 'bg-green-500'
                        : contractor.completion >= 60
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${contractor.completion}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-900 w-8 text-right">
                  {contractor.completion}%
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {/* Documents */}
            {isExpanded && (
              <div className="border-t border-gray-200 bg-gray-50 p-3 space-y-2">
                {contractor.docs.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-900">{doc}</span>
                    <span className="ml-auto text-gray-500">✓ Approved</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const TimelineTab = () => (
    <div className="space-y-4">
      {contractors.map((contractor) => (
        <div key={contractor.name}>
          <h4 className="text-xs font-semibold text-gray-900 mb-2">{contractor.name}</h4>
          <div className="grid grid-cols-3 gap-2">
            {/* Submission Phase */}
            <div
              className="h-10 bg-blue-400 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ width: '100%' }}
            >
              {contractor.completion}%
            </div>
            {/* Review Phase */}
            <div
              className="h-10 bg-amber-400 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ width: `${contractor.completion * 0.8}%` }}
            >
              {Math.round(contractor.completion * 0.8)}%
            </div>
            {/* Approval Phase */}
            <div
              className="h-10 bg-green-400 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ width: `${contractor.completion * 0.7}%` }}
            >
              {Math.round(contractor.completion * 0.7)}%
            </div>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-400 rounded" />
          <span>Submission</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-400 rounded" />
          <span>Review</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-400 rounded" />
          <span>Approval</span>
        </div>
      </div>
    </div>
  );

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title={`📂 Category Details: ${categoryName}`}
      size="lg"
      footer={footer}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(['overview', 'contractor', 'timeline'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'contractor' && 'By Contractor'}
            {tab === 'timeline' && 'Timeline'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'contractor' && <ContractorTab />}
        {activeTab === 'timeline' && <TimelineTab />}
      </div>
    </ModalContainer>
  );
};

export default CategoryModal;
