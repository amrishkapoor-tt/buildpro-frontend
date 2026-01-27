import React, { useState, useEffect } from 'react';
import { Activity, Clock, User, AlertCircle, CheckCircle, History } from 'lucide-react';
import WorkflowHistoryModal from './WorkflowHistoryModal';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const WorkflowStatusWidget = ({ entityType, entityId, projectId, token, onTransition }) => {
  const [workflow, setWorkflow] = useState(null);
  const [transitions, setTransitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (entityType && entityId) {
      loadWorkflow();
    }
  }, [entityType, entityId]);

  const loadWorkflow = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/workflows/entity/${entityType}/${entityId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setWorkflow(data.workflow);
        if (data.workflow) {
          loadAvailableTransitions(data.workflow.id);
        }
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTransitions = async (workflowId) => {
    try {
      const response = await fetch(`${API_URL}/workflows/${workflowId}/transitions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTransitions(data.transitions || []);
      }
    } catch (error) {
      console.error('Failed to load transitions:', error);
    }
  };

  const getUrgencyColor = (dueDate) => {
    if (!dueDate) return 'text-gray-500';

    const due = new Date(dueDate);
    const now = new Date();
    const hoursUntilDue = (due - now) / (1000 * 60 * 60);

    if (hoursUntilDue < 0) return 'text-red-600'; // Overdue
    if (hoursUntilDue < 24) return 'text-orange-500'; // Due soon
    if (hoursUntilDue < 72) return 'text-yellow-600'; // Due in a few days
    return 'text-green-600'; // On track
  };

  const getUrgencyIcon = (dueDate) => {
    if (!dueDate) return <Clock className="w-4 h-4" />;

    const due = new Date(dueDate);
    const now = new Date();
    const hoursUntilDue = (due - now) / (1000 * 60 * 60);

    if (hoursUntilDue < 0) return <AlertCircle className="w-4 h-4" />;
    if (hoursUntilDue < 24) return <AlertCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date';

    const due = new Date(dueDate);
    const now = new Date();
    const hoursUntilDue = (due - now) / (1000 * 60 * 60);
    const daysUntilDue = Math.floor(hoursUntilDue / 24);

    if (hoursUntilDue < 0) {
      const overdueDays = Math.abs(daysUntilDue);
      return `Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`;
    }

    if (hoursUntilDue < 24) {
      return `Due in ${Math.floor(hoursUntilDue)} hours`;
    }

    return `Due in ${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700',
      'rejected': 'bg-red-100 text-red-700',
      'cancelled': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="text-center text-gray-500">Loading workflow...</div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="text-center text-gray-500">No active workflow</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Workflow Status
        </h3>
        <button
          onClick={() => setShowHistory(true)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <History className="w-4 h-4" />
          View History
        </button>
      </div>

      <div className="space-y-3">
        {/* Template name */}
        <div>
          <span className="text-xs text-gray-500">Template:</span>
          <div className="text-sm font-medium text-gray-900">
            {workflow.template_name || 'Custom Workflow'}
          </div>
        </div>

        {/* Progress indicator */}
        <div>
          <span className="text-xs text-gray-500">Progress:</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="text-sm font-medium text-gray-900">
              Stage {workflow.current_stage_number} of {workflow.total_stages}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(workflow.current_stage_number / workflow.total_stages) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current stage */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-900">
              {workflow.current_stage_name}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(workflow.status)}`}>
              {workflow.status}
            </span>
          </div>

          {workflow.assigned_to_name && (
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <User className="w-4 h-4" />
              <span>Assigned to: {workflow.assigned_to_name}</span>
            </div>
          )}

          {workflow.current_stage_due_date && (
            <div className={`flex items-center gap-2 text-sm ${getUrgencyColor(workflow.current_stage_due_date)}`}>
              {getUrgencyIcon(workflow.current_stage_due_date)}
              <span>{formatDueDate(workflow.current_stage_due_date)}</span>
            </div>
          )}
        </div>

        {/* Available actions */}
        {transitions.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500 mb-2 block">Available Actions:</span>
            <div className="flex flex-wrap gap-2">
              {transitions.map(transition => (
                <button
                  key={transition.id}
                  onClick={() => onTransition && onTransition(workflow.id, transition)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    transition.transition_action === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : transition.transition_action === 'reject'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {transition.transition_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Last activity */}
        {workflow.last_transition_date && (
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
            Last activity: {new Date(workflow.last_transition_date).toLocaleString()}
            {workflow.last_transition_by && ` by ${workflow.last_transition_by}`}
          </div>
        )}
      </div>

      {/* History Modal */}
      {showHistory && workflow && (
        <WorkflowHistoryModal
          workflowId={workflow.id}
          entityName={`${entityType}: ${entityId}`}
          token={token}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};

export default WorkflowStatusWidget;
