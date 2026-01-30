import React, { useState, useEffect } from 'react';
import { X, Plus, Users, Trash2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

/**
 * WorkForm - Work activities tracking for daily logs
 *
 * Features:
 * - Activity name and description
 * - Location and crew tracking
 * - Hours worked and equipment used
 * - Contractor/subcontractor assignment
 * - Cost code linkage
 */
const WorkForm = ({ dailyLogId, token, readOnly = false, onUpdate }) => {
  const [work, setWork] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    activity_name: '',
    description: '',
    location: '',
    crew_size: '',
    hours_worked: '',
    contractor_name: '',
    equipment_used: '',
    cost_code: '',
    notes: ''
  });

  useEffect(() => {
    loadWork();
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

  const loadWork = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/daily-logs/${dailyLogId}/work`);
      setWork(data.work || []);
    } catch (error) {
      console.error('Failed to load work:', error);
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
        ? `/daily-logs/${dailyLogId}/work/${editingId}`
        : `/daily-logs/${dailyLogId}/work`;

      await apiCall(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(formData)
      });

      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadWork();
      if (onUpdate) onUpdate();
    } catch (error) {
      window.alert(`Failed to save work: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this work activity?')) return;

    try {
      await apiCall(`/daily-logs/${dailyLogId}/work/${id}`, {
        method: 'DELETE'
      });
      loadWork();
      if (onUpdate) onUpdate();
    } catch (error) {
      window.alert(`Failed to delete work: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      activity_name: '',
      description: '',
      location: '',
      crew_size: '',
      hours_worked: '',
      contractor_name: '',
      equipment_used: '',
      cost_code: '',
      notes: ''
    });
  };

  const handleEdit = (w) => {
    setFormData({
      activity_name: w.activity_name || '',
      description: w.description || '',
      location: w.location || '',
      crew_size: w.crew_size || '',
      hours_worked: w.hours_worked || '',
      contractor_name: w.contractor_name || '',
      equipment_used: w.equipment_used || '',
      cost_code: w.cost_code || '',
      notes: w.notes || ''
    });
    setEditingId(w.id);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading work activities...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Work Activities
        </h4>
        {!readOnly && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Work
          </button>
        )}
      </div>

      {/* Work List */}
      {work.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          No work activities recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {work.map(w => (
            <div key={w.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-semibold text-gray-900">{w.activity_name}</h5>
                {w.cost_code && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono">
                    {w.cost_code}
                  </span>
                )}
              </div>

              {w.description && (
                <p className="text-sm text-gray-700 mb-3">{w.description}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {w.location && (
                  <div>
                    <span className="text-gray-600 block mb-1">Location:</span>
                    <p className="font-medium text-gray-900">{w.location}</p>
                  </div>
                )}
                {w.crew_size && (
                  <div>
                    <span className="text-gray-600 block mb-1">Crew:</span>
                    <p className="font-medium text-gray-900">{w.crew_size} workers</p>
                  </div>
                )}
                {w.hours_worked && (
                  <div>
                    <span className="text-gray-600 block mb-1">Hours:</span>
                    <p className="font-medium text-gray-900">{w.hours_worked} hrs</p>
                  </div>
                )}
                {w.contractor_name && (
                  <div>
                    <span className="text-gray-600 block mb-1">Contractor:</span>
                    <p className="font-medium text-gray-900">{w.contractor_name}</p>
                  </div>
                )}
                {w.equipment_used && (
                  <div>
                    <span className="text-gray-600 block mb-1">Equipment:</span>
                    <p className="font-medium text-gray-900">{w.equipment_used}</p>
                  </div>
                )}
              </div>

              {w.notes && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                  <span className="font-medium">Notes: </span>
                  {w.notes}
                </div>
              )}

              {!readOnly && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(w)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(w.id)}
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
                {editingId ? 'Edit Work Activity' : 'Add Work Activity'}
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
                  placeholder="e.g., Concrete Pour - Foundation"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed description of work performed..."
                />
              </div>

              {/* Location and Cost Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Building A, Level 2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Code
                  </label>
                  <input
                    type="text"
                    value={formData.cost_code}
                    onChange={(e) => setFormData({ ...formData, cost_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="03-100"
                  />
                </div>
              </div>

              {/* Crew and Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Crew Size
                  </label>
                  <input
                    type="number"
                    value={formData.crew_size}
                    onChange={(e) => setFormData({ ...formData, crew_size: e.target.value })}
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

              {/* Contractor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contractor/Subcontractor
                </label>
                <input
                  type="text"
                  value={formData.contractor_name}
                  onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ABC Concrete Co."
                />
              </div>

              {/* Equipment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipment Used
                </label>
                <input
                  type="text"
                  value={formData.equipment_used}
                  onChange={(e) => setFormData({ ...formData, equipment_used: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Concrete pump, mixer truck"
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
                  placeholder="Additional notes or observations..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingId ? 'Update' : 'Save'} Work
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

export default WorkForm;
