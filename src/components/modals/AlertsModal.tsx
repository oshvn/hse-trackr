import React, { useState, useMemo } from 'react';
import { ModalContainer } from './ModalContainer';
import { Mail, FileText, Calendar } from 'lucide-react';

export interface Alert {
  id: string;
  severity: 'blocking' | 'overdue' | 'missing';
  contractor: string;
  documentName: string;
  category: string;
  impact: string;
  deadline: Date;
  daysOverdue?: number;
}

export interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  onSendReminder?: (alertId: string) => void;
  onViewDetails?: (alertId: string) => void;
  onEmailAll?: () => void;
  onExport?: () => void;
}

/**
 * AlertsModal v2.0
 * Display critical alerts with 3 tabs
 * 
 * Features:
 * - 3 tabs: Blocking, Overdue, Missing
 * - Tab switching
 * - Action buttons per alert
 * - Footer actions (Email All, Export)
 */
export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onSendReminder,
  onViewDetails,
  onEmailAll,
  onExport,
}) => {
  const [activeTab, setActiveTab] = useState<'blocking' | 'overdue' | 'missing'>(
    'blocking'
  );

  // Group alerts by severity
  const groupedAlerts = useMemo(() => {
    return {
      blocking: alerts.filter((a) => a.severity === 'blocking'),
      overdue: alerts.filter((a) => a.severity === 'overdue'),
      missing: alerts.filter((a) => a.severity === 'missing'),
    };
  }, [alerts]);

  const getBadgeClass = (severity: string) => {
    switch (severity) {
      case 'blocking':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'overdue':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'missing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getBadgeIcon = (severity: string) => {
    switch (severity) {
      case 'blocking':
        return '🔴';
      case 'overdue':
        return '⏰';
      case 'missing':
        return '❓';
      default:
        return '📋';
    }
  };

  const currentAlerts = groupedAlerts[activeTab];

  const AlertItem: React.FC<{ alert: Alert }> = ({ alert }) => (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-bold border ${getBadgeClass(alert.severity)}`}>
            {getBadgeIcon(alert.severity)} {alert.severity.toUpperCase()}
          </span>
          <span className="text-sm font-semibold text-gray-900">{alert.contractor}</span>
        </div>
        <span className="text-xs text-gray-500">
          {alert.daysOverdue && alert.daysOverdue > 0 && `${alert.daysOverdue}d overdue`}
        </span>
      </div>

      {/* Document Name */}
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {alert.documentName}
        </h4>
      </div>

      {/* Category */}
      <div className="mb-2">
        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
          {alert.category}
        </span>
      </div>

      {/* Impact */}
      <div className="mb-3 p-2 bg-red-50 border-l-2 border-red-600 rounded">
        <p className="text-xs text-red-700">
          <strong>⚠️ Impact:</strong> {alert.impact}
        </p>
      </div>

      {/* Deadline */}
      <div className="mb-3 flex items-center gap-2 text-xs text-gray-600">
        <Calendar className="w-4 h-4" />
        <span>Required by: {alert.deadline.toLocaleDateString()}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onSendReminder?.(alert.id)}
          className="flex-1 px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
        >
          <Mail className="w-3 h-3" />
          Send Reminder
        </button>
        <button
          onClick={() => onViewDetails?.(alert.id)}
          className="flex-1 px-3 py-1 border border-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-gray-50 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );

  const footer = (
    <div className="flex gap-2">
      <button
        onClick={onEmailAll}
        className="flex-1 px-4 py-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition-colors"
      >
        📧 Email All Contractors
      </button>
      <button
        onClick={onExport}
        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-50 transition-colors"
      >
        📥 Export List
      </button>
    </div>
  );

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title="🚨 Critical Alerts"
      size="lg"
      footer={footer}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(['blocking', 'overdue', 'missing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'blocking' && `Blocking (${groupedAlerts.blocking.length})`}
            {tab === 'overdue' && `Overdue (${groupedAlerts.overdue.length})`}
            {tab === 'missing' && `Missing (${groupedAlerts.missing.length})`}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {currentAlerts.length > 0 ? (
          currentAlerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No {activeTab} alerts</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-blue-700">
        <p>
          <strong>ℹ️ Total:</strong> {alerts.length} alerts requiring attention
        </p>
      </div>
    </ModalContainer>
  );
};

export default AlertsModal;
