import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, X, TrendingUp, TrendingDown, FileText, CheckCircle, ChevronRight } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const Financials = ({ projectId, token }) => {
  const [activeView, setActiveView] = useState('overview');
  const [budgetLines, setBudgetLines] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [changeEvents, setChangeEvents] = useState([]);
  const [changeOrders, setChangeOrders] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({});
  const [loading, setLoading] = useState(false);
  
  const [showNewBudgetLine, setShowNewBudgetLine] = useState(false);
  const [showNewCommitment, setShowNewCommitment] = useState(false);
  const [showNewChangeEvent, setShowNewChangeEvent] = useState(false);
  
  const [budgetForm, setBudgetForm] = useState({ cost_code: '', description: '', category: 'Labor', budgeted_amount: '' });
  const [commitmentForm, setCommitmentForm] = useState({ commitment_number: '', title: '', type: 'subcontract', total_amount: '' });
  const [changeEventForm, setChangeEventForm] = useState({ event_number: '', title: '', description: '', estimated_cost: '', estimated_days: '' });

  useEffect(() => {
    if (projectId) {
      loadFinancials();
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

  const loadFinancials = async () => {
    setLoading(true);
    try {
      const [budgetData, commitmentData, summaryData, changeEventData, changeOrderData] = await Promise.all([
        apiCall(`/projects/${projectId}/budget-lines`).catch(() => ({ budget_lines: [] })),
        apiCall(`/projects/${projectId}/commitments`).catch(() => ({ commitments: [] })),
        apiCall(`/projects/${projectId}/financial-summary`).catch(() => ({ summary: {} })),
        apiCall(`/projects/${projectId}/change-events`).catch(() => ({ change_events: [] })),
        apiCall(`/projects/${projectId}/change-orders`).catch(() => ({ change_orders: [] }))
      ]);

      setBudgetLines(budgetData.budget_lines || []);
      setCommitments(commitmentData.commitments || []);
      setFinancialSummary(summaryData.summary || {});
      setChangeEvents(changeEventData.change_events || []);
      setChangeOrders(changeOrderData.change_orders || []);
    } catch (error) {
      console.error('Failed to load financials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudgetLine = async (e) => {
    e.preventDefault();
    try {
      await apiCall(`/projects/${projectId}/budget-lines`, {
        method: 'POST',
        body: JSON.stringify({
          ...budgetForm,
          budgeted_amount: parseFloat(budgetForm.budgeted_amount)
        })
      });
      setShowNewBudgetLine(false);
      setBudgetForm({ cost_code: '', description: '', category: 'Labor', budgeted_amount: '' });
      loadFinancials();
    } catch (error) {
      alert('Failed to create budget line: ' + error.message);
    }
  };

  const handleCreateCommitment = async (e) => {
    e.preventDefault();
    try {
      await apiCall(`/projects/${projectId}/commitments`, {
        method: 'POST',
        body: JSON.stringify({
          ...commitmentForm,
          total_amount: parseFloat(commitmentForm.total_amount)
        })
      });
      setShowNewCommitment(false);
      setCommitmentForm({ commitment_number: '', title: '', type: 'subcontract', total_amount: '' });
      loadFinancials();
    } catch (error) {
      alert('Failed to create commitment: ' + error.message);
    }
  };

  const handleCreateChangeEvent = async (e) => {
    e.preventDefault();
    try {
      await apiCall(`/projects/${projectId}/change-events`, {
        method: 'POST',
        body: JSON.stringify({
          ...changeEventForm,
          estimated_cost: parseFloat(changeEventForm.estimated_cost),
          estimated_days: parseInt(changeEventForm.estimated_days)
        })
      });
      setShowNewChangeEvent(false);
      setChangeEventForm({ event_number: '', title: '', description: '', estimated_cost: '', estimated_days: '' });
      loadFinancials();
    } catch (error) {
      alert('Failed to create change event: ' + error.message);
    }
  };

  const approveChangeEvent = async (eventId) => {
    try {
      await apiCall(`/change-events/${eventId}/approve`, { method: 'PUT' });
      loadFinancials();
    } catch (error) {
      alert('Failed to approve: ' + error.message);
    }
  };

  const convertToChangeOrder = async (eventId) => {
    try {
      const data = await apiCall(`/change-events/${eventId}/convert-to-order`, { method: 'POST' });
      alert(`Change Order ${data.change_order.change_order_number} created!`);
      loadFinancials();
    } catch (error) {
      alert('Failed to convert: ' + error.message);
    }
  };

  const approveChangeOrder = async (coId) => {
    try {
      await apiCall(`/change-orders/${coId}/approve`, { method: 'PUT' });
      alert('Change Order approved! Budget updated.');
      loadFinancials();
    } catch (error) {
      alert('Failed to approve: ' + error.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Financial Management</h2>
      </div>

      {/* View Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {['overview', 'budget', 'commitments', 'changes'].map(view => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === view ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <>
          {/* Overview */}
          {activeView === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Total Budget</span>
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialSummary.total_budget)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Committed</span>
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialSummary.total_committed)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Invoiced</span>
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialSummary.total_invoiced)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Remaining</span>
                    <TrendingDown className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialSummary.remaining_budget)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Budget View */}
          {activeView === 'budget' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Budget Lines</h3>
                <button
                  onClick={() => setShowNewBudgetLine(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5" />
                  Add Budget Line
                </button>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budgeted</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Committed</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {budgetLines.map(line => {
                      const remaining = parseFloat(line.budgeted_amount || 0) - parseFloat(line.committed_amount || 0);
                      return (
                        <tr key={line.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{line.cost_code}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{line.description}</td>
                          <td className="px-4 py-3 text-sm text-right">{formatCurrency(line.budgeted_amount)}</td>
                          <td className="px-4 py-3 text-sm text-right">{formatCurrency(line.committed_amount)}</td>
                          <td className={`px-4 py-3 text-sm text-right font-medium ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(remaining)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Commitments View */}
          {activeView === 'commitments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Commitments</h3>
                <button
                  onClick={() => setShowNewCommitment(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5" />
                  New Commitment
                </button>
              </div>
              <div className="space-y-4">
                {commitments.map(commitment => (
                  <div key={commitment.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{commitment.commitment_number}</h4>
                        <p className="text-sm text-gray-700">{commitment.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{commitment.vendor_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(commitment.total_amount)}</p>
                        <span className="text-xs text-gray-500 capitalize">{commitment.type?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {commitments.length === 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No commitments yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Change Orders View */}
          {activeView === 'changes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Change Management</h3>
                <button
                  onClick={() => setShowNewChangeEvent(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5" />
                  New Change Event
                </button>
              </div>

              {/* Change Events */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Change Events</h4>
                <div className="space-y-3">
                  {changeEvents.map(event => (
                    <div key={event.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">{event.event_number}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              event.status === 'approved' ? 'bg-green-100 text-green-700' :
                              event.status === 'converted' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {event.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900">{event.title}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>Cost: {formatCurrency(event.estimated_cost)}</span>
                            <span>Schedule: {event.estimated_days} days</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {event.status === 'pending_review' && (
                            <button
                              onClick={() => approveChangeEvent(event.id)}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Approve
                            </button>
                          )}
                          {event.status === 'approved' && (
                            <button
                              onClick={() => convertToChangeOrder(event.id)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Convert to CO
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {changeEvents.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No change events</p>
                  )}
                </div>
              </div>

              {/* Change Orders */}
              {changeOrders.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Change Orders</h4>
                  <div className="space-y-3">
                    {changeOrders.map(co => (
                      <div key={co.id} className="bg-white rounded-lg border-2 border-blue-200 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-blue-600">{co.change_order_number}</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                co.status === 'approved' ? 'bg-green-100 text-green-700' :
                                co.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {co.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 mb-3">{co.title}</p>
                            <div className="flex items-center gap-6">
                              <div>
                                <p className="text-xs text-gray-500">Cost Impact</p>
                                <p className="text-lg font-bold text-gray-900">{formatCurrency(co.cost_impact)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Schedule</p>
                                <p className="text-lg font-bold text-gray-900">{co.schedule_impact} days</p>
                              </div>
                            </div>
                          </div>
                          {co.status === 'pending' && (
                            <button
                              onClick={() => approveChangeOrder(co.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showNewBudgetLine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Add Budget Line</h3>
              <button onClick={() => setShowNewBudgetLine(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Code</label>
                <input
                  value={budgetForm.cost_code}
                  onChange={(e) => setBudgetForm({ ...budgetForm, cost_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="01-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  value={budgetForm.description}
                  onChange={(e) => setBudgetForm({ ...budgetForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Site Preparation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budgeted Amount</label>
                <input
                  type="number"
                  value={budgetForm.budgeted_amount}
                  onChange={(e) => setBudgetForm({ ...budgetForm, budgeted_amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="250000"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateBudgetLine}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowNewBudgetLine(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewChangeEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Create Change Event</h3>
              <button onClick={() => setShowNewChangeEvent(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Number</label>
                <input
                  value={changeEventForm.event_number}
                  onChange={(e) => setChangeEventForm({ ...changeEventForm, event_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="CE-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={changeEventForm.title}
                  onChange={(e) => setChangeEventForm({ ...changeEventForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional waterproofing required"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={changeEventForm.description}
                  onChange={(e) => setChangeEventForm({ ...changeEventForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
                  <input
                    type="number"
                    value={changeEventForm.estimated_cost}
                    onChange={(e) => setChangeEventForm({ ...changeEventForm, estimated_cost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="45000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Days</label>
                  <input
                    type="number"
                    value={changeEventForm.estimated_days}
                    onChange={(e) => setChangeEventForm({ ...changeEventForm, estimated_days: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateChangeEvent}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewChangeEvent(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financials;