import React from 'react';
import { X } from 'lucide-react';

const StageProperties = ({ stage, onUpdate, onClose }) => {
  if (!stage) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Stage Properties</h3>
        <p className="text-sm text-gray-500">Select a stage to edit its properties</p>
      </div>
    );
  }

  if (stage.type === 'start' || stage.type === 'end') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {stage.type === 'start' ? 'Start Node' : 'End Node'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-500">
          {stage.type === 'start'
            ? 'This is the starting point of the workflow'
            : 'This is the ending point of the workflow'
          }
        </p>
      </div>
    );
  }

  const handleChange = (field, value) => {
    onUpdate(stage.id, { ...stage, [field]: value });
  };

  const handleAssignmentChange = (field, value) => {
    onUpdate(stage.id, {
      ...stage,
      assignment_rules: {
        ...stage.assignment_rules,
        [field]: value
      }
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 max-h-[600px] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Stage Properties</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Stage Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Stage Name *
          </label>
          <input
            type="text"
            value={stage.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., GC Review"
          />
        </div>

        {/* Stage Type */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Stage Type
          </label>
          <select
            value={stage.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="approval">Approval</option>
            <option value="review">Review</option>
            <option value="notify">Notify</option>
            <option value="decision">Decision</option>
          </select>
        </div>

        {/* SLA Hours */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            SLA (hours)
          </label>
          <input
            type="number"
            value={stage.sla_hours || ''}
            onChange={(e) => handleChange('sla_hours', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="48"
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Time allowed for this stage (in hours)
          </p>
        </div>

        {/* Assignment Rules */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Assignment Rules</h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Assignment Type
              </label>
              <select
                value={stage.assignment_rules?.type || 'role'}
                onChange={(e) => handleAssignmentChange('type', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="role">By Role</option>
                <option value="user">Specific User</option>
                <option value="previous">Previous Stage User</option>
              </select>
            </div>

            {stage.assignment_rules?.type === 'role' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={stage.assignment_rules?.role || ''}
                  onChange={(e) => handleAssignmentChange('role', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select role...</option>
                  <option value="superintendent">Superintendent</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="engineer">Engineer</option>
                  <option value="subcontractor">Subcontractor</option>
                  <option value="architect">Architect</option>
                </select>
              </div>
            )}

            {stage.assignment_rules?.type === 'user' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  value={stage.assignment_rules?.user_id || ''}
                  onChange={(e) => handleAssignmentChange('user_id', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="User UUID"
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Available Actions</h4>
          <p className="text-xs text-gray-500 mb-2">
            Define what actions can be taken at this stage
          </p>

          <div className="space-y-2">
            {['approve', 'reject', 'revise', 'request_changes'].map(action => (
              <label key={action} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={stage.actions?.includes(action)}
                  onChange={(e) => {
                    const currentActions = stage.actions || [];
                    const newActions = e.target.checked
                      ? [...currentActions, action]
                      : currentActions.filter(a => a !== action);
                    handleChange('actions', newActions);
                  }}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 capitalize">
                  {action.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={stage.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add notes about this stage..."
          />
        </div>
      </div>
    </div>
  );
};

export default StageProperties;
