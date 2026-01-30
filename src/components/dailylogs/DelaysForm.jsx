import React, { useState, useEffect } from 'react';
import { X, Plus, Clock, Trash2, AlertTriangle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

/**
 * DelaysForm - Structured delay tracking for daily logs
 *
 * Features:
 * - Delay type categorization
 * - Hours lost tracking
 * - Responsible party identification
 * - Cost impact estimation
 * - Resolution tracking
 */
const DelaysForm = ({ dailyLogId, token, readOnly = false, onUpdate }) => {
  const [delays, setDelays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    delay_type: 'weather',
    description: '',
    hours_lost: '',
    start_time: '',
    end_time: '',
    responsible_party: '',
    cost_impact: '',
    affects_critical_path: false,
    resolution: '',
    resolved: false
  });

  useEffect(() => {
    loadDelays();
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

  const loadDelays = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/daily-logs/${dailyLogId}/delays`);
      setDelays(data.delays || []);
    } catch (error) {
      console.error('Failed to load delays:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description || !formData.hours_lost) {
      window.alert('Description and hours lost are required');
      return;
    }

    try {
      const endpoint = editingId
        ? `/daily-logs/${dailyLogId}/delays/${editingId}`
        : `/daily-logs/${dailyLogId}/delays`;

      await apiCall(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(formData)
      });

      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadDelays();
      if (onUpdate) onUpdate();
    } catch (error) {
      window.alert(`Failed to save delay: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this delay?')) return;

    try {
      await apiCall(`/daily-logs/${dailyLogId}/delays/${id}`, {
        method: 'DELETE'
      });
      loadDelays();
      if (onUpdate) onUpdate();
    } catch (error) {
      window.alert(`Failed to delete delay: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      delay_type: 'weather',
      description: '',
      hours_lost: '',
      start_time: '',
      end_time: '',
      responsible_party: '',
      cost_impact: '',
      affects_critical_path: false,
      resolution: '',
      resolved: false
    });
  };

  const handleEdit = (delay) => {
    setFormData({
      delay_type: delay.delay_type || 'weather',
      description: delay.description || '',
      hours_lost: delay.hours_lost || '',
      start_time: delay.start_time ? new Date(delay.start_time).toISOString().slice(0, 16) : '',
      end_time: delay.end_time ? new Date(delay.end_time).toISOString().slice(0, 16) : '',
      responsible_party: delay.responsible_party || '',
      cost_impact: delay.cost_impact || '',
      affects_critical_path: delay.affects_critical_path || false,
      resolution: delay.resolution || '',
      resolved: delay.resolved || false
    });
    setEditingId(delay.id);
    setShowForm(true);
  };

  const getTotalHours = () => {
    return delays.reduce((sum, delay) => sum + parseFloat(delay.hours_lost || 0), 0).toFixed(1);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading delays...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Delays
          </h4>
          {delays.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Total: {getTotalHours()} hours lost
            </p>
          )}
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Delay
          </button>
        )}
      </div>

      {/* Delays List */}
      {delays.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          No delays recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {delays.map(delay => (
            <div key={delay.id} className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
              delay.affects_critical_path ? 'border-red-300' : 'border-gray-200'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 font-medium uppercase">
                      {delay.delay_type.replace(/_/g, ' ')}
                    </span>
                    <span className="font-semibold text-gray-900">{delay.hours_lost} hours</span>
                    {delay.affects_critical_path && (
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                        <AlertTriangle className="w-3 h-3" />
                        Critical Path
                      </span>
                    )}
                  </div>
                </div>
                {delay.resolved && (
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
                    Resolved
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-700 mb-2">{delay.description}</p>

              {(delay.start_time || delay.end_time) && (
                <div className="text-xs text-gray-600 mb-2">
                  {delay.start_time && (
                    <span>Started: {new Date(delay.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                  {delay.start_time && delay.end_time && <span className="mx-2">•</span>}
                  {delay.end_time && (
                    <span>Ended: {new Date(delay.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {delay.responsible_party && (
                  <div>
                    <span className="text-gray-600">Responsible:</span>
                    <p className="font-medium text-gray-900">{delay.responsible_party}</p>
                  </div>
                )}
                {delay.cost_impact && (
                  <div>
                    <span className="text-gray-600">Cost Impact:</span>
                    <p className="font-medium text-gray-900">${parseFloat(delay.cost_impact).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {delay.resolution && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <span className="font-medium text-green-900">Resolution: </span>
                  <span className="text-green-800">{delay.resolution}</span>
                </div>
              )}

              {!readOnly && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(delay)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(delay.id)}
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
                {editingId ? 'Edit Delay' : 'Add Delay'}
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
              {/* Delay Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delay Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.delay_type}
                  onChange={(e) => setFormData({ ...formData, delay_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weather">Weather</option>
                  <option value="material">Material Shortage</option>
                  <option value="equipment">Equipment Breakdown</option>
                  <option value="labor">Labor Shortage</option>
                  <option value="inspection">Inspection/Approval</option>
                  <option value="design">Design Change</option>
                  <option value="permitting">Permitting</option>
                  <option value="utilities">Utilities</option>
                  <option value="coordination">Coordination</option>
                  <option value="safety">Safety Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the delay and its cause..."
                />
              </div>

              {/* Hours Lost and Times */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours Lost <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.hours_lost}
                    onChange={(e) => setFormData({ ...formData, hours_lost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Responsible Party and Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Responsible Party
                  </label>
                  <input
                    type="text"
                    value={formData.responsible_party}
                    onChange={(e) => setFormData({ ...formData, responsible_party: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Company/person responsible"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Impact ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_impact}
                    onChange={(e) => setFormData({ ...formData, cost_impact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5000"
                  />
                </div>
              </div>

              {/* Critical Path */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="affects_critical_path"
                  checked={formData.affects_critical_path}
                  onChange={(e) => setFormData({ ...formData, affects_critical_path: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="affects_critical_path" className="ml-2 text-sm font-medium text-gray-700">
                  Affects critical path
                </label>
              </div>

              {/* Resolution */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="resolved"
                    checked={formData.resolved}
                    onChange={(e) => setFormData({ ...formData, resolved: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="resolved" className="ml-2 text-sm font-medium text-gray-700">
                    Delay resolved
                  </label>
                </div>

                {formData.resolved && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resolution Details
                    </label>
                    <textarea
                      value={formData.resolution}
                      onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="How was the delay resolved..."
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingId ? 'Update' : 'Save'} Delay
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

export default DelaysForm;
