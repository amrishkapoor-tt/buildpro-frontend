import React, { useState, useEffect } from 'react';
import { Wrench, Plus, X, CheckCircle, Clock, AlertCircle, Search } from 'lucide-react';
import LinkedDocuments from './LinkedDocuments';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const PunchList = ({ projectId, token }) => {
  const [punchItems, setPunchItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPunch, setShowNewPunch] = useState(false);
  const [showItemDetail, setShowItemDetail] = useState(false);
  
  const [punchForm, setPunchForm] = useState({
    description: '',
    location: '',
    trade: '',
    priority: 'normal',
    due_date: ''
  });

  useEffect(() => {
    if (projectId) loadPunchItems();
  }, [projectId]);

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

  const loadPunchItems = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/projects/${projectId}/punch-items`);
      setPunchItems(data.punch_items || []);
    } catch (error) {
      console.error('Failed to load punch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePunch = async (e) => {
    e.preventDefault();
    try {
      await apiCall(`/projects/${projectId}/punch-items`, {
        method: 'POST',
        body: JSON.stringify(punchForm)
      });
      setShowNewPunch(false);
      setPunchForm({ description: '', location: '', trade: '', priority: 'normal', due_date: '' });
      loadPunchItems();
    } catch (error) {
      alert('Failed to create punch item: ' + error.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      if (newStatus === 'verified') {
        await apiCall(`/punch-items/${id}/verify`, { method: 'PUT' });
      } else if (newStatus === 'closed') {
        await apiCall(`/punch-items/${id}/close`, { method: 'PUT' });
      } else {
        await apiCall(`/punch-items/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus })
        });
      }
      loadPunchItems();
      if (selectedItem?.id === id) {
        setShowItemDetail(false);
      }
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'open': 'bg-red-100 text-red-700',
      'in_progress': 'bg-yellow-100 text-yellow-700',
      'completed': 'bg-blue-100 text-blue-700',
      'verified': 'bg-green-100 text-green-700',
      'closed': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors['open'];
  };

  const filteredItems = punchItems.filter(item => {
    const matchesStatus = !filterStatus || item.status === filterStatus;
    const matchesSearch = !searchTerm || 
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Punch List</h2>
        <button
          onClick={() => setShowNewPunch(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Punch Item
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search punch items..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus || ''}
          onChange={(e) => setFilterStatus(e.target.value || null)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="verified">Verified</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No punch items found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setShowItemDetail(true);
                  }}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{item.item_number}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mb-1">{item.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Location: {item.location}</span>
                        <span>Trade: {item.trade}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {item.status === 'open' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(item.id, 'in_progress');
                          }}
                          className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                        >
                          Start
                        </button>
                      )}
                      {item.status === 'in_progress' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(item.id, 'completed');
                          }}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Complete
                        </button>
                      )}
                      {item.status === 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(item.id, 'verified');
                          }}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Punch Modal */}
      {showNewPunch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Create Punch Item</h3>
              <button onClick={() => setShowNewPunch(false)} type="button">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreatePunch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={punchForm.description}
                  onChange={(e) => setPunchForm({ ...punchForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Touch up paint on west wall"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    value={punchForm.location}
                    onChange={(e) => setPunchForm({ ...punchForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Floor 3, Room 301"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trade</label>
                  <input
                    value={punchForm.trade}
                    onChange={(e) => setPunchForm({ ...punchForm, trade: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Painting"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={punchForm.priority}
                    onChange={(e) => setPunchForm({ ...punchForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
                  <input
                    type="date"
                    value={punchForm.due_date}
                    onChange={(e) => setPunchForm({ ...punchForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Punch Item
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewPunch(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Punch Item Detail Modal */}
      {showItemDetail && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">{selectedItem.item_number}</h3>
                <p className="text-gray-600 mt-1">{selectedItem.description}</p>
              </div>
              <button onClick={() => setShowItemDetail(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-lg font-medium ${getStatusColor(selectedItem.status)}`}>
                  {selectedItem.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p className="font-medium text-gray-900">Location</p>
                  <p>{selectedItem.location}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Trade</p>
                  <p>{selectedItem.trade}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Priority</p>
                  <p className="capitalize">{selectedItem.priority}</p>
                </div>
                {selectedItem.due_date && (
                  <div>
                    <p className="font-medium text-gray-900">Due Date</p>
                    <p>{new Date(selectedItem.due_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {selectedItem.status === 'open' && (
                  <button
                    onClick={() => handleStatusChange(selectedItem.id, 'in_progress')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Start Work
                  </button>
                )}
                {selectedItem.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatusChange(selectedItem.id, 'completed')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Mark Complete
                  </button>
                )}
                {selectedItem.status === 'completed' && (
                  <button
                    onClick={() => handleStatusChange(selectedItem.id, 'verified')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Verify
                  </button>
                )}
                {selectedItem.status === 'verified' && (
                  <button
                    onClick={() => handleStatusChange(selectedItem.id, 'closed')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                )}
              </div>

              {/* Linked Documents */}
              <LinkedDocuments
                entityType="punch_item"
                entityId={selectedItem.id}
                token={token}
                projectId={projectId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PunchList;