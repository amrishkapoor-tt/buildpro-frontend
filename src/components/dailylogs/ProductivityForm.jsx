import React, { useState, useEffect } from 'react';
import { X, Plus, TrendingUp, Trash2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

/**
 * ProductivityForm - Productivity metrics tracking for daily logs
 *
 * Features:
 * - Activity tracking with planned vs actual
 * - Productivity rate calculation
 * - Schedule variance tracking
 * - Worker count and hours
 * - Cost code linkage
 */
const ProductivityForm = ({ dailyLogId, token, readOnly = false, onUpdate }) => {
  const [productivity, setProductivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    activity_name: '',
    activity_code: '',
    location: '',
    quantity_planned: '',
    quantity_actual: '',
    unit: '',
    productivity_rate: '',
    hours_worked: '',
    worker_count: '',
    percent_complete: '',
    on_schedule: null,
    variance_days: '',
    cost_code: '',
    notes: '',
    issues: ''
  });

  useEffect(() => {
    loadProductivity();
  }, [dailyLogId]);

  const apiCall = async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || 'Request failed');
    }
    return response.json();
  };

  const loadProductivity = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/daily-logs/${dailyLogId}/productivity`);
      setProductivity(data.productivity || []);
    } catch (error) {
      console.error('Failed to load productivity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.activity_name) {
      window.alert('Activity name is required');
      return;
    }

    try {
      const endpoint = editingId
        ? `/daily-logs/${dailyLogId}/productivity/${editingId}`
        : `/daily-logs/${dailyLogId}/productivity`;

      await apiCall(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(formData)
      });

      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadProductivity();
      if (onUpdate) onUpdate();
    } catch (error) {
      window.alert(`Failed to save productivity: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this productivity record?')) return;

    try {
      await apiCall(`/daily-logs/${dailyLogId}/productivity/${id}`, {
        method: 'DELETE'
      });
      loadProductivity();
      if (onUpdate) onUpdate();
    } catch (error) {
      window.alert(`Failed to delete productivity: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      activity_name: '',
      activity_code: '',
      location: '',
      quantity_planned: '',
      quantity_actual: '',
      unit: '',
      productivity_rate: '',
      hours_worked: '',
      worker_count: '',
      percent_complete: '',
      on_schedule: null,
      variance_days: '',
      cost_code: '',
      notes: '',
      issues: ''
    });
  };

  const handleEdit = (p) => {
    setFormData({
      activity_name: p.activity_name || '',
      activity_code: p.activity_code || '',
      location: p.location || '',
      quantity_planned: p.quantity_planned || '',
      quantity_actual: p.quantity_actual || '',
      unit: p.unit || '',
      productivity_rate: p.productivity_rate || '',
      hours_worked: p.hours_worked || '',
      worker_count: p.worker_count || '',
      percent_complete: p.percent_complete || '',
      on_schedule: p.on_schedule,
      variance_days: p.variance_days || '',
      cost_code: p.cost_code || '',
      notes: p.notes || '',
      issues: p.issues || ''
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading productivity data...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Productivity Metrics
        </h4>
        {!readOnly && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Productivity
          </button>
        )}
      </div>

      {/* Productivity List */}
      {productivity.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          No productivity data recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {productivity.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900">{p.activity_name}</h5>
                  {p.activity_code && (
                    <p className="text-xs text-gray-600 font-mono mt-1">{p.activity_code}</p>
                  )}
                </div>
                {p.on_schedule !== null && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    p.on_schedule
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {p.on_schedule ? 'On Schedule' : 'Behind Schedule'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {p.quantity_planned && (
                  <div>
                    <span className="text-gray-600 block mb-1">Planned:</span>
                    <p className="font-medium text-gray-900">{p.quantity_planned} {p.unit}</p>
                  </div>
                )}
                {p.quantity_actual && (
                  <div>
                    <span className="text-gray-600 block mb-1">Actual:</span>
                    <p className="font-medium text-gray-900">{p.quantity_actual} {p.unit}</p>
                  </div>
                )}
                {p.productivity_rate && (
                  <div>
                    <span className="text-gray-600 block mb-1">Rate:</span>
                    <p className="font-medium text-gray-900">{p.productivity_rate} {p.unit}/hr</p>
                  </div>
                )}
                {p.percent_complete && (
                  <div>
                    <span className="text-gray-600 block mb-1">Complete:</span>
                    <p className="font-medium text-gray-900">{p.percent_complete}%</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                {p.worker_count && (
                  <div>
                    <span className="text-gray-600">Workers:</span>
                    <span className="font-medium text-gray-900 ml-2">{p.worker_count}</span>
                  </div>
                )}
                {p.hours_worked && (
                  <div>
                    <span className="text-gray-600">Hours:</span>
                    <span className="font-medium text-gray-900 ml-2">{p.hours_worked}</span>
                  </div>
                )}
                {p.variance_days && (
                  <div>
                    <span className="text-gray-600">Variance:</span>
                    <span className="font-medium text-gray-900 ml-2">{p.variance_days} days</span>
                  </div>
                )}
              </div>

              {(p.notes || p.issues) && (
                <div className="mt-3 space-y-2">
                  {p.notes && (
                    <div className="p-2 bg-gray-50 rounded text-sm text-gray-700">
                      <span className="font-medium">Notes: </span>
                      {p.notes}
                    </div>
                  )}
                  {p.issues && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-900">
                      <span className="font-medium">Issues: </span>
                      {p.issues}
                    </div>
                  )}
                </div>
              )}

              {!readOnly && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Productivity' : 'Add Productivity'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Activity Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.activity_name}
                  onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Steel erection - Level 3"
                />
              </div>

              {/* Activity Code and Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Code
                  </label>
                  <input
                    type="text"
                    value={formData.activity_code}
                    onChange={(e) => setFormData({ ...formData, activity_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="WBS code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Building/area"
                  />
                </div>
              </div>

              {/* Planned vs Actual */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planned Quantity
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity_planned}
                    onChange={(e) => setFormData({ ...formData, quantity_planned: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Quantity
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity_actual}
                    onChange={(e) => setFormData({ ...formData, quantity_actual: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="95"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SF, LF, EA"
                  />
                </div>
              </div>

              {/* Productivity Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate (units/hr)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.productivity_rate}
                    onChange={(e) => setFormData({ ...formData, productivity_rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="12.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workers
                  </label>
                  <input
                    type="number"
                    value={formData.worker_count}
                    onChange={(e) => setFormData({ ...formData, worker_count: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="8"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours Worked
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.hours_worked}
                    onChange={(e) => setFormData({ ...formData, hours_worked: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="8"
                  />
                </div>
              </div>

              {/* Schedule Status */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    % Complete
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.percent_complete}
                    onChange={(e) => setFormData({ ...formData, percent_complete: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="75"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    On Schedule
                  </label>
                  <select
                    value={formData.on_schedule === null ? '' : formData.on_schedule.toString()}
                    onChange={(e) => setFormData({ ...formData, on_schedule: e.target.value === '' ? null : e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variance (days)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.variance_days}
                    onChange={(e) => setFormData({ ...formData, variance_days: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="-2.5"
                  />
                </div>
              </div>

              {/* Cost Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Code
                </label>
                <input
                  type="text"
                  value={formData.cost_code}
                  onChange={(e) => setFormData({ ...formData, cost_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="05-120"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional observations..."
                />
              </div>

              {/* Issues */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issues / Concerns
                </label>
                <textarea
                  value={formData.issues}
                  onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Problems affecting productivity..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingId ? 'Update' : 'Save'} Productivity
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductivityForm;
