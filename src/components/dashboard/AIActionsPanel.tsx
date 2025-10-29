import React, { useMemo } from 'react';
import { AlertCircle, Clock, CheckCircle, ChevronRight } from 'lucide-react';

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
export const AIActionsPanel: React.FC<AIActionsPanelProps> = ({ actions, onActionClick }) => {
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
    <div className="lg:col-span-6 lg:row-span-2 col-span-1 bg-white rounded-lg border-2 border-green-500 p-5 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">🤖 AI Actions for Bottlenecks</h3>
        <span className="text-xl">⚡</span>
      </div>

      {/* Tag */}
      <div className="mb-4 inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
        AI Recommendations
      </div>

      {/* Urgent Group */}
      <div className="mb-4">
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
        <div className="mb-4">
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
        <div className="mb-2">
          <details className="group">
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

      {/* Empty State */}
      {actions.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">No AI actions at this time</p>
        </div>
      )}
    </div>
  );
};

export default AIActionsPanel;
