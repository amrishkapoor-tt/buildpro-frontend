import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, Send, CheckCircle, Clock, AlertCircle, Activity, Play } from 'lucide-react';
import LinkedDocuments from './LinkedDocuments';
import WorkflowStatusWidget from './workflows/WorkflowStatusWidget';
import { usePermissions } from '../contexts/PermissionContext';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const RFIs = ({ projectId, token }) => {
  const { can } = usePermissions();
  const [rfis, setRfis] = useState([]);
  const [selectedRFI, setSelectedRFI] = useState(null);
  const [showNewRFI, setShowNewRFI] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [rfiForm, setRfiForm] = useState({ title: '', question: '', priority: 'normal', due_date: '' });
  const [responseForm, setResponseForm] = useState({ response_text: '', is_official: false });

  useEffect(() => {
    if (projectId) loadRFIs();
  }, [projectId]);

  const apiCall = async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
        ...options.headers
      }
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  };

  const loadRFIs = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/projects/${projectId}/rfis`);
      setRfis(data.rfis);
    } catch (error) {
      console.error('Failed to load RFIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRFIDetail = async (rfiId) => {
    try {
      const data = await apiCall(`/rfis/${rfiId}`);
      setSelectedRFI(data.rfi);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to load RFI:', error);
    }
  };

  const handleCreateRFI = async (e) => {
    e.preventDefault();
    try {
      await apiCall(`/projects/${projectId}/rfis`, {
        method: 'POST',
        body: JSON.stringify(rfiForm)
      });
      setShowNewRFI(false);
      setRfiForm({ title: '', question: '', priority: 'normal', due_date: '' });
      loadRFIs();
    } catch (error) {
      alert('Failed to create RFI: ' + error.message);
    }
  };

  const handleAddResponse = async (e) => {
    e.preventDefault();
    try {
      await apiCall(`/rfis/${selectedRFI.id}/responses`, {
        method: 'POST',
        body: JSON.stringify(responseForm)
      });
      setResponseForm({ response_text: '', is_official: false });
      loadRFIDetail(selectedRFI.id);
    } catch (error) {
      alert('Failed to add response: ' + error.message);
    }
  };

  const handleStatusChange = async (rfiId, newStatus) => {
    try {
      await apiCall(`/rfis/${rfiId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      loadRFIs();
      if (selectedRFI?.id === rfiId) loadRFIDetail(rfiId);
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">RFIs</h2>
        {can('create_rfi') && (
          <button
            onClick={() => setShowNewRFI(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            New RFI
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          {rfis.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No RFIs yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {rfis.map(rfi => (
                <div key={rfi.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => loadRFIDetail(rfi.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {rfi.status === 'draft' && <Clock className="w-6 h-6 text-gray-400" />}
                      {rfi.status === 'open' && <AlertCircle className="w-6 h-6 text-orange-500" />}
                      {rfi.status === 'answered' && <CheckCircle className="w-6 h-6 text-blue-500" />}
                      {rfi.status === 'closed' && <CheckCircle className="w-6 h-6 text-green-500" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{rfi.rfi_number}</p>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            rfi.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                            rfi.status === 'open' ? 'bg-orange-100 text-orange-700' :
                            rfi.status === 'answered' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {rfi.status}
                          </span>
                          {rfi.workflow_status === 'active' && (
                            <span className="flex items-center gap-1 text-xs text-blue-600">
                              <Activity className="w-3 h-3" />
                              {rfi.workflow_stage_name || 'In Workflow'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{rfi.title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New RFI Modal */}
      {showNewRFI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Create New RFI</h3>
              <button onClick={() => setShowNewRFI(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={rfiForm.title}
                  onChange={(e) => setRfiForm({ ...rfiForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <textarea
                  value={rfiForm.question}
                  onChange={(e) => setRfiForm({ ...rfiForm, question: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={rfiForm.priority}
                    onChange={(e) => setRfiForm({ ...rfiForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={rfiForm.due_date}
                    onChange={(e) => setRfiForm({ ...rfiForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateRFI}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create RFI
                </button>
                <button
                  onClick={() => setShowNewRFI(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RFI Detail Modal */}
      {showDetail && selectedRFI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedRFI.rfi_number}</h3>
                <p className="text-gray-600">{selectedRFI.title}</p>
              </div>
              <button onClick={() => setShowDetail(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Question</h4>
                <p className="text-gray-700">{selectedRFI.question}</p>
              </div>

              {/* Workflow Status */}
              <div className="border-t border-b border-gray-200 py-4">
                <WorkflowStatusWidget
                  entityType="rfi"
                  entityId={selectedRFI.id}
                  projectId={projectId}
                  token={token}
                  onTransition={() => {
                    loadRFIs();
                    loadRFIDetail(selectedRFI.id);
                  }}
                />
              </div>

              <div className="flex gap-2">
                {selectedRFI.status === 'draft' && can('change_rfi_status') && (
                  <button
                    onClick={() => handleStatusChange(selectedRFI.id, 'open')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Open RFI
                  </button>
                )}

                {selectedRFI.status === 'open' && !selectedRFI.workflow_id && can('start_workflow') && (
                  <button
                    onClick={async () => {
                      try {
                        await apiCall('/workflows/start', {
                          method: 'POST',
                          body: JSON.stringify({
                            entity_type: 'rfi',
                            entity_id: selectedRFI.id,
                            project_id: projectId
                          })
                        });
                        alert('Workflow started successfully!');
                        loadRFIs();
                        loadRFIDetail(selectedRFI.id);
                      } catch (error) {
                        alert('Failed to start workflow: ' + error.message);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Approval Workflow
                  </button>
                )}

                {selectedRFI.status === 'answered' && can('change_rfi_status') && (
                  <button
                    onClick={() => handleStatusChange(selectedRFI.id, 'closed')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Close RFI
                  </button>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Responses</h4>
                {selectedRFI.responses && selectedRFI.responses.length > 0 ? (
                  <div className="space-y-3">
                    {selectedRFI.responses.map((response) => (
                      <div key={response.id} className={`p-4 rounded-lg ${response.is_official ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{response.responded_by_name}</span>
                          <span className="text-sm text-gray-500">{new Date(response.responded_at).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-700">{response.response_text}</p>
                        {response.is_official && (
                          <span className="inline-block mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                            Official Response
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No responses yet</p>
                )}

                {selectedRFI.status !== 'closed' && (
                  <div className="mt-4 space-y-3">
                    <textarea
                      value={responseForm.response_text}
                      onChange={(e) => setResponseForm({ ...responseForm, response_text: e.target.value })}
                      placeholder="Add your response..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={responseForm.is_official}
                          onChange={(e) => setResponseForm({ ...responseForm, is_official: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">Mark as official response</span>
                      </label>
                      <button
                        onClick={handleAddResponse}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4" />
                        Send Response
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Linked Documents */}
              <LinkedDocuments
                entityType="rfi"
                entityId={selectedRFI.id}
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

export default RFIs;