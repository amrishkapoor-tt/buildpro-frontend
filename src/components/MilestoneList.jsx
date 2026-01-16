import React, { useState } from 'react';
import { Plus, Target, Calendar, CheckCircle2, Circle, Edit2, Trash2, Flag, X, Save } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const MilestoneList = ({ milestones, projectId, token, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_date: '',
    status: 'pending'
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    setEditingMilestone(null);
    setFormData({
      name: '',
      description: '',
      target_date: '',
      status: 'pending'
    });
    setShowModal(true);
  };

  const handleEdit = (milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      name: milestone.name,
      description: milestone.description || '',
      target_date: milestone.target_date ? milestone.target_date.split('T')[0] : '',
      status: milestone.status
    });
    setShowModal(true);
  };

  const handleDelete = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/schedule/milestones/${milestoneId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete milestone');

      onUpdate();
    } catch (error) {
      console.error('Failed to delete milestone:', error);
      alert('Failed to delete milestone');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingMilestone
        ? `${API_URL}/schedule/milestones/${editingMilestone.id}`
        : `${API_URL}/projects/${projectId}/schedule/milestones`;

      const method = editingMilestone ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save milestone');

      setShowModal(false);
      setEditingMilestone(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to save milestone:', error);
      alert('Failed to save milestone');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (milestoneId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/schedule/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update milestone status');

      onUpdate();
    } catch (error) {
      console.error('Failed to update milestone status:', error);
      alert('Failed to update milestone status');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Circle, label: 'Pending' },
      achieved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2, label: 'Achieved' },
      missed: { bg: 'bg-red-100', text: 'text-red-700', icon: Circle, label: 'Missed' }
    };
    return configs[status] || configs.pending;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Check if milestone is past due
  const isPastDue = (milestone) => {
    if (milestone.status === 'achieved') return false;
    const targetDate = new Date(milestone.target_date);
    const today = new Date();
    return targetDate < today;
  };

  // Sort milestones by date
  const sortedMilestones = [...milestones].sort((a, b) => {
    return new Date(a.target_date) - new Date(b.target_date);
  });

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Project Milestones</h3>
            <p className="text-sm text-gray-600 mt-1">Track key project deliverables and deadlines</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Milestone
          </button>
        </div>
      </div>

      {/* Milestones List */}
      <div className="flex-1 overflow-auto p-6">
        {sortedMilestones.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No milestones yet</p>
              <p className="text-sm text-gray-500 mt-1">Create your first milestone to track project progress</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedMilestones.map((milestone) => {
              const statusConfig = getStatusConfig(milestone.status);
              const StatusIcon = statusConfig.icon;
              const pastDue = isPastDue(milestone);

              return (
                <div
                  key={milestone.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    pastDue ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`mt-1 p-2 rounded-lg ${statusConfig.bg}`}>
                        <Flag className={`w-5 h-5 ${statusConfig.text}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-semibold text-gray-900">{milestone.name}</h4>
                          {pastDue && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                              Past Due
                            </span>
                          )}
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Target: {formatDate(milestone.target_date)}</span>
                          </div>
                          {milestone.actual_date && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Achieved: {formatDate(milestone.actual_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={milestone.status}
                        onChange={(e) => handleUpdateStatus(milestone.id, e.target.value)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${statusConfig.bg} ${statusConfig.text} border border-transparent focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="pending">Pending</option>
                        <option value="achieved">Achieved</option>
                        <option value="missed">Missed</option>
                      </select>
                      <button
                        onClick={() => handleEdit(milestone)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(milestone.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Milestone Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Foundation Complete"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe this milestone..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="achieved">Achieved</option>
                    <option value="missed">Missed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : editingMilestone ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneList;
