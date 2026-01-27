import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, ArrowRight, User } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const WorkflowActionModal = ({ workflowId, availableTransitions, entityName, token, onSubmit, onClose }) => {
  const [selectedTransition, setSelectedTransition] = useState(null);
  const [comments, setComments] = useState('');
  const [nextStageInfo, setNextStageInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (availableTransitions && availableTransitions.length > 0) {
      setSelectedTransition(availableTransitions[0]);
    }
  }, [availableTransitions]);

  useEffect(() => {
    if (selectedTransition) {
      loadNextStageInfo();
    }
  }, [selectedTransition]);

  const loadNextStageInfo = async () => {
    if (!selectedTransition?.to_stage_id) return;

    try {
      const response = await fetch(`${API_URL}/workflows/${workflowId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const workflow = data.workflow;

        // Find the next stage information from the workflow template
        // This is a simplified version - you may need to enhance based on your API structure
        setNextStageInfo({
          stage_name: selectedTransition.to_stage_name,
          assigned_to: selectedTransition.next_assigned_to || 'TBD'
        });
      }
    } catch (error) {
      console.error('Failed to load next stage info:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTransition) {
      setError('Please select an action');
      return;
    }

    // Validate comments for certain actions
    if (['reject', 'revise', 'request_changes'].includes(selectedTransition.transition_action) && !comments.trim()) {
      setError('Comments are required for this action');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/workflows/${workflowId}/transition`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transition_id: selectedTransition.id,
          comments: comments.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process action');
      }

      const data = await response.json();

      if (onSubmit) {
        onSubmit(data);
      }

      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'approve':
        return <CheckCircle className="w-5 h-5" />;
      case 'reject':
        return <XCircle className="w-5 h-5" />;
      case 'revise':
      case 'request_changes':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <ArrowRight className="w-5 h-5" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'approve':
        return 'border-green-500 bg-green-50';
      case 'reject':
        return 'border-red-500 bg-red-50';
      case 'revise':
      case 'request_changes':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  const getActionTextColor = (action) => {
    switch (action) {
      case 'approve':
        return 'text-green-700';
      case 'reject':
        return 'text-red-700';
      case 'revise':
      case 'request_changes':
        return 'text-yellow-700';
      default:
        return 'text-blue-700';
    }
  };

  const requiresComments = (action) => {
    return ['reject', 'revise', 'request_changes'].includes(action);
  };

  if (!availableTransitions || availableTransitions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Actions Available</h3>
            <p className="text-gray-600 mb-4">There are no available actions for this workflow at this time.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Workflow Action</h2>
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
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Action:
            </label>
            <div className="space-y-2">
              {availableTransitions.map(transition => (
                <label
                  key={transition.id}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTransition?.id === transition.id
                      ? `${getActionColor(transition.transition_action)} border-current`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="action"
                    checked={selectedTransition?.id === transition.id}
                    onChange={() => setSelectedTransition(transition)}
                    className="w-4 h-4"
                  />
                  <div className={`flex-shrink-0 ${selectedTransition?.id === transition.id ? getActionTextColor(transition.transition_action) : 'text-gray-500'}`}>
                    {getActionIcon(transition.transition_action)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {transition.transition_name}
                    </div>
                    {transition.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        {transition.description}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments
              {selectedTransition && requiresComments(selectedTransition.transition_action) && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={
                selectedTransition && requiresComments(selectedTransition.transition_action)
                  ? 'Please provide a reason for this action...'
                  : 'Add any additional comments (optional)...'
              }
            />
            {selectedTransition && requiresComments(selectedTransition.transition_action) && !comments.trim() && (
              <p className="text-xs text-red-500 mt-1">Comments are required for this action</p>
            )}
          </div>

          {/* Next Stage Info */}
          {nextStageInfo && selectedTransition?.transition_action === 'approve' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="font-medium text-blue-900 mb-2">Next Stage:</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-blue-800">
                  <ArrowRight className="w-4 h-4" />
                  <span>{nextStageInfo.stage_name}</span>
                </div>
                {nextStageInfo.assigned_to && (
                  <div className="flex items-center gap-2 text-blue-700">
                    <User className="w-4 h-4" />
                    <span>Assigned to: {nextStageInfo.assigned_to}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedTransition}
            className={`flex-1 px-4 py-2 rounded-lg font-medium disabled:opacity-50 ${
              selectedTransition?.transition_action === 'approve'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : selectedTransition?.transition_action === 'reject'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processing...' : 'Submit Decision'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowActionModal;
