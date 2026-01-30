import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

/**
 * WasteForm - Waste disposal tracking for daily logs
 *
 * Features:
 * - Waste type categorization
 * - Material and quantity tracking
 * - Disposal method and location
 * - Cost tracking
 * - Compliance documentation
 */
const WasteForm = ({ dailyLogId, token, readOnly = false, onUpdate }) => {
  const [waste, setWaste] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    waste_type: 'construction',
    material: '',
    description: '',
    quantity: '',
    unit: '',
    disposal_method: 'landfill',
    disposal_location: '',
    disposal_company: '',
    disposal_cost: '',
    requires_documentation: false,
    manifest_number: '',
    source_location: ''
  });

  useEffect(() => {
    loadWaste();
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

  const loadWaste = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/daily-logs/${dailyLogId}/waste`);
      setWaste(data.waste || []);
    } catch (error) {
      console.error('Failed to load waste:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.material || !formData.quantity || !formData.unit) {
      window.alert('Material, quantity, and unit are required');
      return;
    }

    try {
      const endpoint = editingId
        ? `/daily-logs/${dailyLogId}/waste/${editingId}`
        : `/daily-logs/${dailyLogId}/waste`;

      await apiCall(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(formData)
      });

      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadWaste();
      if (onUpdate) onUpdate();
    } catch (error) {
      window.alert(`Failed to save waste: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this waste record?')) return;

    try {
      await apiCall(`/daily-logs/${dailyLogId}/waste/${id}`, {
        method: 'DELETE'
      });
      loadWaste();
      if (onUpdate) onUpdate();
    } catch (error) {
      window.alert(`Failed to delete waste: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      waste_type: 'construction',
      material: '',
      description: '',
      quantity: '',
      unit: '',
      disposal_method: 'landfill',
      disposal_location: '',
      disposal_company: '',
      disposal_cost: '',
      requires_documentation: false,
      manifest_number: '',
      source_location: ''
    });
  };

  const handleEdit = (w) => {
    setFormData({
      waste_type: w.waste_type || 'construction',
      material: w.material || '',
      description: w.description || '',
      quantity: w.quantity || '',
      unit: w.unit || '',
      disposal_method: w.disposal_method || 'landfill',
      disposal_location: w.disposal_location || '',
      disposal_company: w.disposal_company || '',
      disposal_cost: w.disposal_cost || '',
      requires_documentation: w.requires_documentation || false,
      manifest_number: w.manifest_number || '',
      source_location: w.source_location || ''
    });
    setEditingId(w.id);
    setShowForm(true);
  };

  const getWasteTypeBadge = (type) => {
    const badges = {
      construction: 'bg-gray-100 text-gray-700',
      hazardous: 'bg-red-100 text-red-700',
      recyclable: 'bg-green-100 text-green-700',
      organic: 'bg-yellow-100 text-yellow-700',
      other: 'bg-blue-100 text-blue-700'
    };
    return badges[type] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading waste records...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Waste Disposal
        </h4>
        {!readOnly && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Waste
          </button>
        )}
      </div>

      {/* Waste List */}
      {waste.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          No waste records yet
        </div>
      ) : (
        <div className="space-y-3">
          {waste.map(w => (
            <div key={w.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-semibold text-gray-900">{w.material}</h5>
                    <span className={`text-xs px-2 py-1 rounded uppercase ${getWasteTypeBadge(w.waste_type)}`}>
                      {w.waste_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {w.description && (
                    <p className="text-sm text-gray-600">{w.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">{w.quantity}</p>
                  <p className="text-xs text-gray-600">{w.unit}</p>
                </div>
              </div>

              <div className="mt-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Disposal:</span>
                    <p className="font-medium text-gray-900 capitalize">{w.disposal_method}</p>
                    {w.disposal_location && (
                      <p className="text-xs text-gray-600">{w.disposal_location}</p>
                    )}
                  </div>
                  {w.disposal_company && (
                    <div>
                      <span className="text-gray-600">Company:</span>
                      <p className="font-medium text-gray-900">{w.disposal_company}</p>
                    </div>
                  )}
                </div>

                {w.disposal_cost && (
                  <div className="mt-2">
                    <span className="text-gray-600">Cost:</span>
                    <span className="font-medium text-gray-900 ml-2">
                      ${parseFloat(w.disposal_cost).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {w.requires_documentation && (
                <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                  <span className="font-medium text-orange-900">Requires Documentation</span>
                  {w.manifest_number && (
                    <p className="text-orange-800 text-xs mt-1">
                      Manifest #: {w.manifest_number}
                    </p>
                  )}
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
                {editingId ? 'Edit Waste' : 'Add Waste'}
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
              {/* Waste Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Waste Type
                </label>
                <select
                  value={formData.waste_type}
                  onChange={(e) => setFormData({ ...formData, waste_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="construction">Construction</option>
                  <option value="hazardous">Hazardous</option>
                  <option value="recyclable">Recyclable</option>
                  <option value="organic">Organic</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Material */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Scrap lumber, concrete rubble"
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
                  placeholder="Additional details"
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
                    placeholder="10"
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
                    placeholder="CY, TON, LF"
                  />
                </div>
              </div>

              {/* Disposal Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disposal Method
                </label>
                <select
                  value={formData.disposal_method}
                  onChange={(e) => setFormData({ ...formData, disposal_method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="landfill">Landfill</option>
                  <option value="recycle">Recycle</option>
                  <option value="reuse">Reuse</option>
                  <option value="incinerate">Incinerate</option>
                  <option value="special">Special Disposal</option>
                </select>
              </div>

              {/* Disposal Location and Company */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disposal Location
                  </label>
                  <input
                    type="text"
                    value={formData.disposal_location}
                    onChange={(e) => setFormData({ ...formData, disposal_location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Facility name or address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disposal Company
                  </label>
                  <input
                    type="text"
                    value={formData.disposal_company}
                    onChange={(e) => setFormData({ ...formData, disposal_company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Waste management company"
                  />
                </div>
              </div>

              {/* Cost and Source Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disposal Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.disposal_cost}
                    onChange={(e) => setFormData({ ...formData, disposal_cost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Location
                  </label>
                  <input
                    type="text"
                    value={formData.source_location}
                    onChange={(e) => setFormData({ ...formData, source_location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Where waste originated"
                  />
                </div>
              </div>

              {/* Documentation */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="requires_documentation"
                    checked={formData.requires_documentation}
                    onChange={(e) => setFormData({ ...formData, requires_documentation: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="requires_documentation" className="ml-2 text-sm font-medium text-gray-700">
                    Requires documentation / manifest
                  </label>
                </div>

                {formData.requires_documentation && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manifest Number
                    </label>
                    <input
                      type="text"
                      value={formData.manifest_number}
                      onChange={(e) => setFormData({ ...formData, manifest_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tracking or manifest number"
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
                  {editingId ? 'Update' : 'Save'} Waste
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

export default WasteForm;
