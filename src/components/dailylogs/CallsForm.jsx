import React, { useState, useEffect } from 'react';
import { X, Plus, Phone, Trash2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

/**
 * CallsForm - Phone call log management for daily logs
 *
 * Features:
 * - Contact and company tracking
 * - Call time and duration
 * - Call type (incoming/outgoing)
 * - Notes and action items
 * - Follow-up tracking
 */
const CallsForm = ({ dailyLogId, token, readOnly = false, onUpdate }) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    contact_name: '',
    company_name: '',
    phone_number: '',
    call_type: 'outgoing',
    call_time: new Date().toISOString().slice(0, 16),
    duration_minutes: '',
    subject: '',
    notes: '',
    action_required: false,
    action_details: '',
    follow_up_by: ''
  });

  useEffect(() => {
    loadCalls();
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

  const loadCalls = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/daily-logs/${dailyLogId}/calls`);
      setCalls(data.calls || []);
    } catch (error) {
      console.error('Failed to load calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.contact_name) {
      window.alert('Contact name is required');
      return;
    }

    try {
      const endpoint = editingId
        ? `/daily-logs/${dailyLogId}/calls/${editingId}`
        : `/daily-logs/${dailyLogId}/calls`;

      await apiCall(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(formData)
      });

      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadCalls();
      if (onUpdate) onUpdate();
    } catch (error) {
      window.alert(`Failed to save call: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this call log?')) return;

    try {
      await apiCall(`/daily-logs/${dailyLogId}/calls/${id}`, {
        method: 'DELETE'
      });
      loadCalls();
      if (onUpdate) onUpdate();
    } catch (error) {
      window.alert(`Failed to delete call: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      contact_name: '',
      company_name: '',
      phone_number: '',
      call_type: 'outgoing',
      call_time: new Date().toISOString().slice(0, 16),
      duration_minutes: '',
      subject: '',
      notes: '',
      action_required: false,
      action_details: '',
      follow_up_by: ''
    });
  };

  const handleEdit = (call) => {
    setFormData({
      contact_name: call.contact_name || '',
      company_name: call.company_name || '',
      phone_number: call.phone_number || '',
      call_type: call.call_type || 'outgoing',
      call_time: call.call_time ? new Date(call.call_time).toISOString().slice(0, 16) : '',
      duration_minutes: call.duration_minutes || '',
      subject: call.subject || '',
      notes: call.notes || '',
      action_required: call.action_required || false,
      action_details: call.action_details || '',
      follow_up_by: call.follow_up_by ? new Date(call.follow_up_by).toISOString().split('T')[0] : ''
    });
    setEditingId(call.id);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading calls...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Phone Calls
        </h4>
        {!readOnly && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Call
          </button>
        )}
      </div>

      {/* Calls List */}
      {calls.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          No calls recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {calls.map(call => (
            <div key={call.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-semibold text-gray-900">{call.contact_name}</h5>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      call.call_type === 'incoming'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {call.call_type}
                    </span>
                  </div>
                  {call.company_name && (
                    <p className="text-sm text-gray-600">{call.company_name}</p>
                  )}
                  {call.phone_number && (
                    <p className="text-sm text-gray-500">{call.phone_number}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">
                    {new Date(call.call_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {call.duration_minutes && (
                    <span className="text-xs text-gray-500 block">{call.duration_minutes} min</span>
                  )}
                </div>
              </div>

              {call.subject && (
                <p className="text-sm font-medium text-gray-800 mb-1">{call.subject}</p>
              )}

              {call.notes && (
                <p className="text-sm text-gray-700 mb-2">{call.notes}</p>
              )}

              {call.action_required && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium text-orange-900 block">Action Required</span>
                      {call.action_details && (
                        <span className="text-orange-800">{call.action_details}</span>
                      )}
                      {call.follow_up_by && (
                        <span className="text-xs text-orange-700 block mt-1">
                          Follow up by: {new Date(call.follow_up_by).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!readOnly && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(call)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(call.id)}
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
                {editingId ? 'Edit Call' : 'Add Call'}
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
              {/* Contact Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Smith"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ABC Construction"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Call Details */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Call Type
                  </label>
                  <select
                    value={formData.call_type}
                    onChange={(e) => setFormData({ ...formData, call_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="incoming">Incoming</option>
                    <option value="outgoing">Outgoing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Call Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.call_time}
                    onChange={(e) => setFormData({ ...formData, call_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="15"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Discussed delivery schedule"
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
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Call notes and discussion points..."
                />
              </div>

              {/* Action Required */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="action_required"
                    checked={formData.action_required}
                    onChange={(e) => setFormData({ ...formData, action_required: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="action_required" className="ml-2 text-sm font-medium text-gray-700">
                    Action required
                  </label>
                </div>

                {formData.action_required && (
                  <div className="space-y-3 ml-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Action Details
                      </label>
                      <textarea
                        value={formData.action_details}
                        onChange={(e) => setFormData({ ...formData, action_details: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="What needs to be done..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Follow Up By
                      </label>
                      <input
                        type="date"
                        value={formData.follow_up_by}
                        onChange={(e) => setFormData({ ...formData, follow_up_by: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingId ? 'Update' : 'Save'} Call
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

export default CallsForm;
