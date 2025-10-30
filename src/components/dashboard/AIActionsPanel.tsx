import React, { useMemo, useState } from 'react';
import { AlertCircle, Clock, CheckCircle, ChevronRight, RotateCw } from 'lucide-react';

export interface Action {
  id: string;
  title: string;
  description: string;
  urgency: 'urgent' | 'this-week' | 'planned';
  contractor: string;
  actionType: 'email' | 'meeting' | 'support' | 'escalate';
  docCount?: number;
}

export interface AIActionsPanelProps {
  actions: Action[];
  onActionClick?: (actionId: string) => void;
  onRegenerate?: () => void; // mới
  isLoading?: boolean; // mới
}

/**
 * AIActionsPanel v2.0
 * Display AI-recommended actions grouped by urgency
 * 
 * Features:
 * - 3 urgency groups (Urgent, This Week, Planned)
 * - Color-coded accents (red, orange, blue)
 * - Collapsed/expanded groups
 * - Hover effects
 */
export const AIActionsPanel: React.FC<AIActionsPanelProps> = ({ actions, onActionClick, onRegenerate, isLoading }) => {
  // Group actions by urgency
  const groupedActions = useMemo(() => {
    if (!actions || actions.length === 0) {
      return { urgent: [], thisWeek: [], planned: [] };
    }
    return {
      urgent: actions.filter((a) => a.urgency === 'urgent'),
      thisWeek: actions.filter((a) => a.urgency === 'this-week'),
      planned: actions.filter((a) => a.urgency === 'planned'),
    };
  }, [actions]);

  const [showAll, setShowAll] = useState(false);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'email':
        return '📧';
      case 'meeting':
        return '👥';
      case 'support':
        return '📚';
      case 'escalate':
        return '⚠️';
      default:
        return '📌';
    }
  };

  const ActionCard: React.FC<{ action: Action; accentColor: string }> = ({
    action,
    accentColor,
  }) => (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border-l-3 hover:shadow-md cursor-pointer transition-all ${accentColor}`}
      onClick={() => onActionClick?.(action.id)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onActionClick?.(action.id);
      }}
    >
      <div className="text-2xl">{getActionIcon(action.actionType)}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 truncate">{action.title}</h4>
        <p className="text-xs text-gray-600 line-clamp-2">{action.description}</p>
        {action.docCount && (
          <p className="text-xs text-gray-500 mt-1">📎 {action.docCount} documents</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
    </div>
  );

  return (
    <div className="bg-white rounded-lg border-2 border-green-500 p-5 hover:shadow-lg transition-all h-full flex flex-col">
      {/* Header với nút icon regenerate và Show All khi cần */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">🤖 AI Actions for Bottlenecks
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            title="Regenerate Recommendations"
            className={`ml-2 text-gray-500 hover:text-blue-500 transition-transform ${isLoading ? 'animate-spin' : ''}`}
            style={{ cursor: isLoading ? 'not-allowed' : 'pointer', background:'transparent', outline:'none', border:'none' }}
            tabIndex={0}
            aria-busy={isLoading}
            aria-live="polite"
          >
            <RotateCw size={17} />
          </button>
          {isLoading && (
            <span className="ml-2 text-xs text-blue-600 animate-pulse select-none">Generating...</span>
          )}
        </h3>
        <span className="text-xl flex items-center gap-2">
          {actions.length > 7 && (
            <button
              onClick={() => setShowAll(true)}
              title="Xem tất cả recommendation"
              className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 text-gray-600 border border-gray-300"
            >
              Show All
            </button>
          )}
          ⚡
        </span>
      </div>

      {/* Tag */}
      <div className="mb-4 inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
        AI Recommendations
      </div>

      {actions.length > 0 ? (
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {/* Urgent Group */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold text-gray-700">
                🚨 Urgent ({groupedActions.urgent.length})
              </span>
            </div>
            <div className="space-y-2 ml-6">
              {groupedActions.urgent.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  accentColor="bg-gradient-to-r from-red-50 to-white border-red-500 hover:border-red-600"
                />
              ))}
            </div>
          </div>

          {/* This Week Group */}
          {groupedActions.thisWeek.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-gray-700">
                  ⏰ This Week ({groupedActions.thisWeek.length})
                </span>
              </div>
              <div className="space-y-2 ml-6">
                {groupedActions.thisWeek.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    accentColor="bg-gradient-to-r from-amber-50 to-white border-amber-500 hover:border-amber-600"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Planned Group */}
          {groupedActions.planned.length > 0 && (
            <div>
              <details className="group" open>
                <summary className="flex items-center gap-2 mb-2 cursor-pointer">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-gray-700">
                    📋 Planned ({groupedActions.planned.length})
                  </span>
                </summary>
                <div className="space-y-2 ml-6">
                  {groupedActions.planned.map((action) => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      accentColor="bg-gradient-to-r from-blue-50 to-white border-blue-500 hover:border-blue-600"
                    />
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center text-gray-500">
          <p className="text-sm">No AI actions at this time</p>
        </div>
      )}
      {/* Modal showAll recommendations nếu cần */}
      {showAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded p-6 max-w-lg w-full shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold">Tất cả AI Recommendations</h4>
              <button className="text-gray-500 hover:text-blue-600" onClick={() => setShowAll(false)} aria-label="Đóng"><span aria-hidden>✕</span></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-3">
              {actions.map((action, idx) => (
                <ActionCard key={action.id || idx} action={action} accentColor="bg-gradient-to-r from-blue-50 to-white border-blue-500 hover:border-blue-600" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIActionsPanel;
