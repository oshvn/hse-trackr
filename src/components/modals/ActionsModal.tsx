import React, { useState } from 'react';
import { ModalContainer } from './ModalContainer';
import { AlertCircle, Clock, Mail, ChevronDown } from 'lucide-react';

export interface EmailAction {
  id: string;
  title: string;
  description: string;
  urgency: 'urgent' | 'this-week';
  contractor: string;
  email: {
    to: string;
    subject: string;
    body: string;
  };
  relatedDocs: string[];
}

export interface ActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  actions: EmailAction[];
  onSendNow?: (actionId: string, email: { to: string; subject: string; body: string }) => void;
  onSchedule?: (actionId: string) => void;
  onDismiss?: (actionId: string) => void;
}

/**
 * ActionsModal v2.0
 * Execute AI-recommended actions
 * 
 * Features:
 * - Email preview with editable body
 * - Related documents list
 * - Action buttons (Send Now, Schedule, Dismiss)
 * - Urgency indicators
 */
export const ActionsModal: React.FC<ActionsModalProps> = ({
  isOpen,
  onClose,
  actions,
  onSendNow,
  onSchedule,
  onDismiss,
}) => {
  const [expandedActionId, setExpandedActionId] = useState<string | null>(
    actions[0]?.id || null
  );
  const [emailBodies, setEmailBodies] = useState<Record<string, string>>(
    actions.reduce((acc, action) => {
      acc[action.id] = action.email.body;
      return acc;
    }, {} as Record<string, string>)
  );

  const ActionCard: React.FC<{ action: EmailAction }> = ({ action }) => {
    const isExpanded = expandedActionId === action.id;
    const isUrgent = action.urgency === 'urgent';

    return (
      <div
        className={`border-2 rounded-lg overflow-hidden transition-all ${
          isUrgent
            ? 'border-red-300 bg-gradient-to-r from-red-50 to-white'
            : 'border-amber-300 bg-gradient-to-r from-amber-50 to-white'
        }`}
      >
        {/* Header */}
        <button
          onClick={() =>
            setExpandedActionId(isExpanded ? null : action.id)
          }
          className="w-full px-4 py-3 flex items-start justify-between hover:bg-white transition-colors"
        >
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-8 h-8 rounded flex items-center justify-center text-white font-bold ${
                  isUrgent ? 'bg-red-500' : 'bg-amber-500'
                }`}
              >
                {isUrgent ? '📧' : '📧'}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{action.title}</h3>
                <p className="text-xs text-gray-600">{action.contractor}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 line-clamp-1">{action.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded text-xs font-bold ${
                isUrgent
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isUrgent ? '🚨 URGENT' : '⏰ THIS WEEK'}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-gray-200 px-4 py-4 space-y-4">
            {/* Email Preview */}
            <div className="bg-white border border-gray-200 rounded p-3 space-y-2">
              <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                📧 Email Preview
              </h4>

              {/* To */}
              <div>
                <label className="text-xs font-semibold text-gray-600">To:</label>
                <div className="text-xs text-gray-900">{action.email.to}</div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-semibold text-gray-600">Subject:</label>
                <input
                  type="text"
                  defaultValue={action.email.subject}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-xs font-semibold text-gray-600">Message:</label>
                <textarea
                  value={emailBodies[action.id]}
                  onChange={(e) =>
                    setEmailBodies({
                      ...emailBodies,
                      [action.id]: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono h-24"
                />
              </div>
            </div>

            {/* Related Documents */}
            {action.relatedDocs.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2">📎 Related Documents</h4>
                <ul className="space-y-1">
                  {action.relatedDocs.map((doc, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  onSendNow?.(action.id, {
                    ...action.email,
                    body: emailBodies[action.id],
                  });
                }}
                className="flex-1 px-3 py-2 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600 transition-colors"
              >
                ✉️ Send Now
              </button>
              <button
                onClick={() => onSchedule?.(action.id)}
                className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
              >
                <Clock className="w-3 h-3" />
                Schedule
              </button>
              <button
                onClick={() => onDismiss?.(action.id)}
                className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded hover:bg-gray-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title="🤖 AI Recommended Actions"
      size="lg"
    >
      {/* Header Info */}
      <div className="mb-4 p-3 bg-blue-50 rounded text-xs text-blue-700">
        <p>
          AI-generated recommendations based on current bottlenecks and delays. Edit email
          content before sending.
        </p>
      </div>

      {/* Action Cards */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {actions.length > 0 ? (
          actions.map((action) => <ActionCard key={action.id} action={action} />)
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No recommended actions at this time</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
        <p>
          ℹ️ <strong>Tip:</strong> Review and edit the email content before sending to ensure
          it matches your tone and requirements.
        </p>
      </div>
    </ModalContainer>
  );
};

export default ActionsModal;
