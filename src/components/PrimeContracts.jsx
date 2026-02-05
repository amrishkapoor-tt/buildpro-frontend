import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, DollarSign, Calendar, TrendingUp, Edit2, Trash2 } from 'lucide-react';
import { usePermissions } from '../contexts/PermissionContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

const PrimeContracts = ({ projectId, token }) => {
  const { can } = usePermissions();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showAddContract, setShowAddContract] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  const [contractForm, setContractForm] = useState({
    contract_number: '',
    title: '',
    description: '',
    contract_type: '',
    vendor_contractor: '',
    original_amount_cents: 0,
    start_date: '',
    completion_date: '',
    status: 'active'
  });

  useEffect(() => {
    if (projectId) loadContracts();
  }, [projectId]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/projects/${projectId}/prime-contracts`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      setContracts(data.prime_contracts || []);
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContract = async () => {
    try {
      const url = editingContract
        ? `${API_URL}/prime-contracts/${editingContract.id}`
        : `${API_URL}/projects/${projectId}/prime-contracts`;

      const response = await fetch(url, {
        method: editingContract ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contractForm)
      });

      if (!response.ok) throw new Error('Failed to save contract');

      setShowAddContract(false);
      setEditingContract(null);
      resetForm();
      loadContracts();
    } catch (error) {
      alert(error.message);
    }
  };

  const formatCurrency = (cents) => {
    if (!cents) return '$0.00';
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const resetForm = () => {
    setContractForm({
      contract_number: '',
      title: '',
      description: '',
      contract_type: '',
      vendor_contractor: '',
      original_amount_cents: 0,
      start_date: '',
      completion_date: '',
      status: 'active'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      terminated: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Prime Contracts</h2>
          <p className="text-sm text-gray-600 mt-1">Main project contracts and agreements</p>
        </div>
        {can('project_manager') && (
          <button
            onClick={() => { resetForm(); setShowAddContract(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Contract
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No prime contracts found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map(contract => (
            <div
              key={contract.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{contract.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(contract.status)}`}>
                      {contract.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Contract #{contract.contract_number} • {contract.vendor_contractor}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-600 mb-1">Original Amount</div>
                  <div className="text-lg font-semibold text-blue-900">
                    {formatCurrency(contract.original_amount_cents)}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-green-600 mb-1">Revised Amount</div>
                  <div className="text-lg font-semibold text-green-900">
                    {formatCurrency(contract.revised_amount_cents || contract.original_amount_cents)}
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-xs text-orange-600 mb-1">Change Orders</div>
                  <div className="text-lg font-semibold text-orange-900">
                    {contract.approved_co_count || 0} approved
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-purple-600 mb-1">Completion</div>
                  <div className="text-lg font-semibold text-purple-900">
                    {contract.percent_complete || 0}%
                  </div>
                </div>
              </div>

              {(contract.start_date || contract.completion_date) && (
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <Calendar className="w-4 h-4" />
                  {contract.start_date && (
                    <span>Start: {new Date(contract.start_date).toLocaleDateString()}</span>
                  )}
                  {contract.completion_date && (
                    <span>End: {new Date(contract.completion_date).toLocaleDateString()}</span>
                  )}
                </div>
              )}

              {contract.description && (
                <p className="text-sm text-gray-600 mb-4">{contract.description}</p>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedContract(contract)}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Contract Modal */}
      {showAddContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingContract ? 'Edit Contract' : 'Add New Contract'}
                </h3>
                <button
                  onClick={() => { setShowAddContract(false); setEditingContract(null); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contract Number *
                    </label>
                    <input
                      type="text"
                      value={contractForm.contract_number}
                      onChange={(e) => setContractForm({ ...contractForm, contract_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={contractForm.status}
                      onChange={(e) => setContractForm({ ...contractForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Title *
                  </label>
                  <input
                    type="text"
                    value={contractForm.title}
                    onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor/Contractor
                  </label>
                  <input
                    type="text"
                    value={contractForm.vendor_contractor}
                    onChange={(e) => setContractForm({ ...contractForm, vendor_contractor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Amount ($)
                  </label>
                  <input
                    type="number"
                    value={contractForm.original_amount_cents / 100}
                    onChange={(e) => setContractForm({ ...contractForm, original_amount_cents: parseFloat(e.target.value) * 100 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={contractForm.start_date}
                      onChange={(e) => setContractForm({ ...contractForm, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Completion Date
                    </label>
                    <input
                      type="date"
                      value={contractForm.completion_date}
                      onChange={(e) => setContractForm({ ...contractForm, completion_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={contractForm.description}
                    onChange={(e) => setContractForm({ ...contractForm, description: e.target.value })}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowAddContract(false); setEditingContract(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveContract}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingContract ? 'Update Contract' : 'Add Contract'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrimeContracts;
