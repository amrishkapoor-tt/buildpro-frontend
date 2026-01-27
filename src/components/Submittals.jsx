import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, Send, CheckCircle, XCircle, AlertTriangle, Clock, Search, Activity, Play } from 'lucide-react';
import LinkedDocuments from './LinkedDocuments';
import WorkflowStatusWidget from './workflows/WorkflowStatusWidget';
import WorkflowActionModal from './workflows/WorkflowActionModal';
import WorkflowHistoryModal from './workflows/WorkflowHistoryModal';
import { usePermissions } from '../contexts/PermissionContext';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const Submittals = ({ projectId, token }) => {
  const { can } = usePermissions();
  const [packages, setPackages] = useState([]);
  const [submittals, setSubmittals] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedSubmittal, setSelectedSubmittal] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showNewPackage, setShowNewPackage] = useState(false);
  const [showNewSubmittal, setShowNewSubmittal] = useState(false);
  const [showSubmittalDetail, setShowSubmittalDetail] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentReviewStep, setCurrentReviewStep] = useState(null);
  
  const [packageForm, setPackageForm] = useState({ package_number: '', title: '', spec_section: '' });
  const [submittalForm, setSubmittalForm] = useState({ submittal_number: '', title: '', type: 'product_data', due_date: '' });
  const [submitForm, setSubmitForm] = useState({ reviewers: [{ reviewer_id: '', role: 'contractor' }] });
  const [reviewForm, setReviewForm] = useState({ status: 'approved', review_comments: '' });

  useEffect(() => {
    if (projectId) {
      loadPackages();
      loadSubmittals();
    }
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
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  };

  const loadPackages = async () => {
    try {
      const data = await apiCall(`/projects/${projectId}/submittal-packages`);
      setPackages(data.packages || []);
    } catch (error) {
      console.error('Failed to load packages:', error);
    }
  };

  const loadSubmittals = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/projects/${projectId}/submittals`);
      setSubmittals(data.submittals || []);
    } catch (error) {
      console.error('Failed to load submittals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      const data = await apiCall(`/projects/${projectId}/submittal-packages`, {
        method: 'POST',
        body: JSON.stringify(packageForm)
      });
      setPackages([data.package, ...packages]);
      setShowNewPackage(false);
      setPackageForm({ package_number: '', title: '', spec_section: '' });
    } catch (error) {
      alert('Failed to create package: ' + error.message);
    }
  };

  const handleCreateSubmittal = async (e) => {
    e.preventDefault();
    if (!selectedPackage) return;

    try {
      const data = await apiCall(`/submittal-packages/${selectedPackage.id}/submittals`, {
        method: 'POST',
        body: JSON.stringify(submittalForm)
      });
      setShowNewSubmittal(false);
      setSubmittalForm({ submittal_number: '', title: '', type: 'product_data', due_date: '' });
      loadSubmittals();
    } catch (error) {
      alert('Failed to create submittal: ' + error.message);
    }
  };

  const loadSubmittalDetail = async (submittalId) => {
    try {
      const data = await apiCall(`/submittals/${submittalId}`);
      setSelectedSubmittal(data.submittal);
      setShowSubmittalDetail(true);
    } catch (error) {
      console.error('Failed to load submittal:', error);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      await apiCall(`/submittals/${selectedSubmittal.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ review_steps: submitForm.reviewers })
      });
      setShowSubmitModal(false);
      setShowSubmittalDetail(false);
      setSubmitForm({ reviewers: [{ reviewer_id: '', role: 'contractor' }] });
      loadSubmittals();
    } catch (error) {
      alert('Failed to submit: ' + error.message);
    }
  };

  const handleReview = async () => {
    try {
      await apiCall(`/review-steps/${currentReviewStep.id}/review`, {
        method: 'PUT',
        body: JSON.stringify(reviewForm)
      });
      setShowReviewModal(false);
      setShowSubmittalDetail(false);
      setReviewForm({ status: 'approved', review_comments: '' });
      loadSubmittals();
    } catch (error) {
      alert('Failed to submit review: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-700',
      'submitted': 'bg-blue-100 text-blue-700',
      'in_review': 'bg-yellow-100 text-yellow-700',
      'approved': 'bg-green-100 text-green-700',
      'approved_as_noted': 'bg-teal-100 text-teal-700',
      'revise_resubmit': 'bg-orange-100 text-orange-700',
      'rejected': 'bg-red-100 text-red-700'
    };
    return colors[status] || colors['draft'];
  };

  const filteredSubmittals = submittals.filter(s => {
    const matchesPackage = !selectedPackage || s.package_id === selectedPackage.id;
    const matchesStatus = !filterStatus || s.status === filterStatus;
    const matchesSearch = !searchTerm || 
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.submittal_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPackage && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Submittals</h2>
        <div className="flex items-center gap-2">
          {can('create_submittal') && (
            <>
              <button
                onClick={() => setShowNewPackage(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Plus className="w-5 h-5" />
                New Package
              </button>
              <button
                onClick={() => setShowNewSubmittal(true)}
                disabled={packages.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                <Plus className="w-5 h-5" />
                New Submittal
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search submittals..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus || ''}
          onChange={(e) => setFilterStatus(e.target.value || null)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="approved_as_noted">Approved as Noted</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Packages Sidebar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Packages</h3>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedPackage(null)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                !selectedPackage ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              All Submittals
            </button>
            {packages.map(pkg => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedPackage?.id === pkg.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <p className="font-medium text-sm truncate">{pkg.package_number}</p>
                <p className="text-xs text-gray-500 truncate">{pkg.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Submittals List */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : filteredSubmittals.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No submittals found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmittals.map(submittal => (
                <div
                  key={submittal.id}
                  onClick={() => loadSubmittalDetail(submittal.id)}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{submittal.submittal_number}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(submittal.status)}`}>
                          {submittal.status.replace('_', ' ')}
                        </span>
                        {submittal.workflow_status === 'active' && (
                          <span className="flex items-center gap-1 text-xs text-blue-600">
                            <Activity className="w-3 h-3" />
                            {submittal.workflow_stage_name || 'In Workflow'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 mb-1">{submittal.title}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Package: {submittal.package_title}</span>
                        <span className="capitalize">{submittal.type?.replace('_', ' ')}</span>
                        {submittal.due_date && (
                          <span>Due: {new Date(submittal.due_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Package Modal */}
      {showNewPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Create Package</h3>
              <button onClick={() => setShowNewPackage(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Number</label>
                <input
                  value={packageForm.package_number}
                  onChange={(e) => setPackageForm({ ...packageForm, package_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SUB-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={packageForm.title}
                  onChange={(e) => setPackageForm({ ...packageForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="HVAC Equipment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spec Section</label>
                <input
                  value={packageForm.spec_section}
                  onChange={(e) => setPackageForm({ ...packageForm, spec_section: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="23 00 00"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreatePackage}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewPackage(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Submittal Modal */}
      {showNewSubmittal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Create Submittal</h3>
              <button onClick={() => setShowNewSubmittal(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package</label>
                <select
                  value={selectedPackage?.id || ''}
                  onChange={(e) => setSelectedPackage(packages.find(p => p.id === e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.package_number} - {pkg.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Submittal Number</label>
                <input
                  value={submittalForm.submittal_number}
                  onChange={(e) => setSubmittalForm({ ...submittalForm, submittal_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SUB-001-01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={submittalForm.title}
                  onChange={(e) => setSubmittalForm({ ...submittalForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rooftop HVAC Unit - 15 Ton"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={submittalForm.type}
                    onChange={(e) => setSubmittalForm({ ...submittalForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="product_data">Product Data</option>
                    <option value="shop_drawings">Shop Drawings</option>
                    <option value="samples">Samples</option>
                    <option value="test_reports">Test Reports</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={submittalForm.due_date}
                    onChange={(e) => setSubmittalForm({ ...submittalForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateSubmittal}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Submittal
                </button>
                <button
                  onClick={() => setShowNewSubmittal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submittal Detail Modal */}
      {showSubmittalDetail && selectedSubmittal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">{selectedSubmittal.submittal_number}</h3>
                <p className="text-gray-600 mt-1">{selectedSubmittal.title}</p>
              </div>
              <button onClick={() => setShowSubmittalDetail(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-lg font-medium ${getStatusColor(selectedSubmittal.status)}`}>
                  {selectedSubmittal.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Type: {selectedSubmittal.type?.replace('_', ' ')}</p>
                <p>Package: {selectedSubmittal.package_title}</p>
              </div>

              {/* Workflow Status */}
              <div className="border-t border-b border-gray-200 py-4">
                <WorkflowStatusWidget
                  entityType="submittal"
                  entityId={selectedSubmittal.id}
                  projectId={projectId}
                  token={token}
                  onTransition={(workflowId, transition) => {
                    // Handle workflow transition - refresh data
                    loadSubmittals();
                  }}
                />
              </div>

              {selectedSubmittal.status === 'draft' && (
                <button
                  onClick={() => {
                    setShowSubmittalDetail(false);
                    setShowSubmitModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit for Review
                </button>
              )}

              {selectedSubmittal.status === 'submitted' && !selectedSubmittal.workflow_id && can('start_workflow') && (
                <button
                  onClick={async () => {
                    try {
                      const response = await apiCall('/workflows/start', {
                        method: 'POST',
                        body: JSON.stringify({
                          entity_type: 'submittal',
                          entity_id: selectedSubmittal.id,
                          project_id: projectId
                        })
                      });
                      alert('Workflow started successfully!');
                      loadSubmittals();
                      loadSubmittalDetail(selectedSubmittal.id);
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

              {/* Linked Documents */}
              <LinkedDocuments
                entityType="submittal"
                entityId={selectedSubmittal.id}
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

export default Submittals;