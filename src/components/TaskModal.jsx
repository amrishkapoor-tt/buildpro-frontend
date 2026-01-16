import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, AlertCircle } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const TaskModal = ({ task, projectId, token, tasks, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    wbs_code: '',
    planned_start_date: '',
    planned_end_date: '',
    duration_days: 1,
    status: 'not_started',
    priority: 'medium',
    parent_task_id: null,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name || '',
        description: task.description || '',
        wbs_code: task.wbs_code || '',
        planned_start_date: task.planned_start_date ? task.planned_start_date.split('T')[0] : '',
        planned_end_date: task.planned_end_date ? task.planned_end_date.split('T')[0] : '',
        duration_days: task.duration_days || 1,
        status: task.status || 'not_started',
        priority: task.priority || 'medium',
        parent_task_id: task.parent_task_id || null,
        notes: task.notes || ''
      });
    }
  }, [task]);

  // Calculate duration when dates change
  useEffect(() => {
    if (formData.planned_start_date && formData.planned_end_date) {
      const start = new Date(formData.planned_start_date);
      const end = new Date(formData.planned_end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setFormData(prev => ({ ...prev, duration_days: diffDays || 1 }));
    }
  }, [formData.planned_start_date, formData.planned_end_date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = task
        ? `${API_URL}/schedule/tasks/${task.id}`
        : `${API_URL}/projects/${projectId}/schedule/tasks`;

      const method = task ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save task');
      }

      onSave();
    } catch (err) {
      console.error('Failed to save task:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filter out current task and its descendants from parent options
  const getParentTaskOptions = () => {
    if (!task) return tasks;

    const getDescendants = (taskId) => {
      const descendants = new Set([taskId]);
      const addChildren = (id) => {
        tasks.filter(t => t.parent_task_id === id).forEach(child => {
          descendants.add(child.id);
          addChildren(child.id);
        });
      };
      addChildren(taskId);
      return descendants;
    };

    const descendants = getDescendants(task.id);
    return tasks.filter(t => !descendants.has(t.id));
  };

  const parentTaskOptions = getParentTaskOptions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {task ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Task Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter task name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter task description"
            />
          </div>

          {/* WBS Code and Parent Task */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WBS Code
              </label>
              <input
                type="text"
                name="wbs_code"
                value={formData.wbs_code}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 1.2.3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Task
              </label>
              <select
                name="parent_task_id"
                value={formData.parent_task_id || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">None (Root Task)</option>
                {parentTaskOptions.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.wbs_code ? `${t.wbs_code} - ${t.name}` : t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates and Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="planned_start_date"
                value={formData.planned_start_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="planned_end_date"
                value={formData.planned_end_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (days)
              </label>
              <input
                type="number"
                name="duration_days"
                value={formData.duration_days}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                readOnly
              />
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes or comments"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
