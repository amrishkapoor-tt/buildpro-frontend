import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, RotateCcw, User, Clock, MessageSquare, ArrowRight } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const WorkflowHistoryModal = ({ workflowId, entityName, token, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workflowId) {
      loadHistory();
    }
  }, [workflowId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/workflows/${workflowId}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load workflow history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'approve':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'reject':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'revise':
      case 'request_changes':
        return <RotateCcw className="w-5 h-5 text-yellow-600" />;
      case 'start':
        return <ArrowRight className="w-5 h-5 text-blue-600" />;
      default:
        return <ArrowRight className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'approve':
        return 'bg-green-50 border-green-200';
      case 'reject':
        return 'bg-red-50 border-red-200';
      case 'revise':
      case 'request_changes':
        return 'bg-yellow-50 border-yellow-200';
      case 'start':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatActionName = (action) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Workflow History</h2>
            {entityName && (
              <p className="text-sm text-gray-600 mt-1">{entityName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Loading history...</div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">No workflow history available</div>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={entry.id || index} className="relative">
                  {/* Timeline line */}
                  {index < history.length - 1 && (
                    <div className="absolute left-[22px] top-12 bottom-0 w-0.5 bg-gray-200" />
                  )}

                  {/* History entry */}
                  <div className={`border rounded-lg p-4 ${getActionColor(entry.transition_action)}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getActionIcon(entry.transition_action)}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Action header */}
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {formatActionName(entry.transition_action)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {entry.from_stage_name} → {entry.to_stage_name}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(entry.transitioned_at)}
                          </div>
                        </div>

                        {/* User info */}
                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                          <User className="w-4 h-4" />
                          <span>{entry.transitioned_by_name || 'Unknown User'}</span>
                        </div>

                        {/* Comments */}
                        {entry.comments && (
                          <div className="mt-3 bg-white bg-opacity-70 rounded p-3">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                {entry.comments}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {Object.entries(entry.metadata).map(([key, value]) => (
                              <div key={key}>
                                {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Workflow start indicator */}
              <div className="relative">
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Workflow Started</div>
                      {history[history.length - 1] && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(history[history.length - 1].transitioned_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowHistoryModal;
