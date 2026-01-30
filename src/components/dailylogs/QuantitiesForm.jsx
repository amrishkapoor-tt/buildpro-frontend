import React, { useState, useEffect } from 'react';
import { X, Plus, Package, Trash2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

/**
 * QuantitiesForm - Material quantity tracking for daily logs
 *
 * Features:
 * - Material type and description
 * - Quantity and unit tracking
 * - Transaction type (received, installed, returned)
 * - Supplier and cost code linkage
 * - Location tracking
 */
const QuantitiesForm = ({ dailyLogId, token, readOnly = false, onUpdate }) => {
  const [quantities, setQuantities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    material_type: '',
    description: '',
    quantity: '',
    unit: '',
    transaction_type: 'installed',
    supplier_name: '',
    location: '',
    cost_code: '',
    notes: ''
  });

  useEffect(() => {
    loadQuantities();
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

  const loadQuantities = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/daily-logs/${dailyLogId}/quantities`);
      setQuantities(data.quantities || []);
    } catch (error) {
      console.error('Failed to load quantities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.material_type || !formData.quantity || !formData.unit) {
      window.alert('Material type, quantity, and unit are required');
      return;
    }

    try {
      const endpoint = editingId
        ? `/daily-logs/${dailyLogId}/quantities/${editingId}`
        : `/daily-logs/${dailyLogId}/quantities`;

      await apiCall(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(formData)
      });

      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadQuantities();
      if (onUpdate) onUpdate();
    } catch (error) {
      window.alert(`Failed to save quantity: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this quantity record?')) return;

    try {
      await apiCall(`/daily-logs/${dailyLogId}/quantities/${id}`, {
        method: 'DELETE'
      });
      loadQuantities();
      if (onUpdate) onUpdate();
    } catch (error) {
      window.alert(`Failed to delete quantity: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      material_type: '',
      description: '',
      quantity: '',
      unit: '',
      transaction_type: 'installed',
      supplier_name: '',
      location: '',
      cost_code: '',
      notes: ''
    });
  };

  const handleEdit = (q) => {
    setFormData({
      material_type: q.material_type || '',
      description: q.description || '',
      quantity: q.quantity || '',
      unit: q.unit || '',
      transaction_type: q.transaction_type || 'installed',
      supplier_name: q.supplier_name || '',
      location: q.location || '',
      cost_code: q.cost_code || '',
      notes: q.notes || ''
    });
    setEditingId(q.id);
    setShowForm(true);
  };

  const getTransactionBadge = (type) => {
    const badges = {
      received: 'bg-green-100 text-green-700',
      installed: 'bg-blue-100 text-blue-700',
      returned: 'bg-yellow-100 text-yellow-700',
      wasted: 'bg-red-100 text-red-700'
    };
    return badges[type] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading quantities...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Material Quantities
        </h4>
        {!readOnly && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Quantity
          </button>
        )}
      </div>

      {/* Quantities List */}
      {quantities.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          No quantities recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {quantities.map(q => (
            <div key={q.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-semibold text-gray-900">{q.material_type}</h5>
                    <span className={`text-xs px-2 py-1 rounded ${getTransactionBadge(q.transaction_type)}`}>
                      {q.transaction_type}
                    </span>
                  </div>
                  {q.description && (
                    <p className="text-sm text-gray-600">{q.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">{q.quantity}</p>
                  <p className="text-xs text-gray-600">{q.unit}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-3">
                {q.supplier_name && (
                  <div>
                    <span className="text-gray-600 block mb-1">Supplier:</span>
                    <p className="font-medium text-gray-900">{q.supplier_name}</p>
                  </div>
                )}
                {q.location && (
                  <div>
                    <span className="text-gray-600 block mb-1">Location:</span>
                    <p className="font-medium text-gray-900">{q.location}</p>
                  </div>
                )}
                {q.cost_code && (
                  <div>
                    <span className="text-gray-600 block mb-1">Cost Code:</span>
                    <p className="font-medium text-gray-900 font-mono">{q.cost_code}</p>
                  </div>
                )}
              </div>

              {q.notes && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                  {q.notes}
                </div>
              )}

              {!readOnly && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(q)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
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
                {editingId ? 'Edit Quantity' : 'Add Quantity'}
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
              {/* Material Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.material_type}
                  onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Concrete, Rebar, Lumber"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 4000 PSI concrete mix"
                />
              </div>

              {/* Quantity and Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="CY, LF, SF, EA"
                  />
                </div>
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type
                </label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="received">Received</option>
                  <option value="installed">Installed</option>
                  <option value="returned">Returned</option>
                  <option value="wasted">Wasted</option>
                </select>
              </div>

              {/* Supplier and Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ABC Supply Co."
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
                    placeholder="Building A, Grid B-5"
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
                  placeholder="03-310"
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
                  placeholder="Additional notes..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingId ? 'Update' : 'Save'} Quantity
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

export default QuantitiesForm;
