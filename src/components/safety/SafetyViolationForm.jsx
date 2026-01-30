import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

/**
 * SafetyViolationForm - Create/edit safety violations
 *
 * Features:
 * - Violation details entry
 * - Severity and type selection
 * - OSHA recordable tracking
 * - Corrective action planning
 * - Photo upload support
 */
const SafetyViolationForm = ({ violation, projectId, token, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    violation_number: violation?.violation_number || '',
    violation_type: violation?.violation_type || 'ppe',
    severity: violation?.severity || 'moderate',
    title: violation?.title || '',
    description: violation?.description || '',
    location: violation?.location || '',
    violator_name: violation?.violator_name || '',
    violator_company: violation?.violator_company || '',
    issued_by: violation?.issued_by || '',
    issued_at: violation?.issued_at ? new Date(violation.issued_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    corrective_action: violation?.corrective_action || '',
    corrective_action_required_by: violation?.corrective_action_required_by ? new Date(violation.corrective_action_required_by).toISOString().split('T')[0] : '',
    osha_recordable: violation?.osha_recordable || false,
    citation_issued: violation?.citation_issued || false,
    citation_number: violation?.citation_number || '',
    fine_amount: violation?.fine_amount || ''
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description) {
      window.alert('Description is required');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = violation
        ? `/safety-violations/${violation.id}`
        : `/projects/${projectId}/safety-violations`;

      await apiCall(endpoint, {
        method: violation ? 'PUT' : 'POST',
        body: JSON.stringify(formData)
      });

      window.alert(`Violation ${violation ? 'updated' : 'created'} successfully`);
      onClose();
    } catch (error) {
      window.alert(`Failed to save violation: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {violation ? 'Edit Safety Violation' : 'Report Safety Violation'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Violation Number
              </label>
              <input
                type="text"
                value={formData.violation_number}
                onChange={(e) => setFormData({ ...formData, violation_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional reference number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issued Date/Time
              </label>
              <input
                type="datetime-local"
                value={formData.issued_at}
                onChange={(e) => setFormData({ ...formData, issued_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Type and Severity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Violation Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.violation_type}
                onChange={(e) => setFormData({ ...formData, violation_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ppe">PPE (Personal Protective Equipment)</option>
                <option value="housekeeping">Housekeeping</option>
                <option value="fall_protection">Fall Protection</option>
                <option value="confined_space">Confined Space</option>
                <option value="electrical">Electrical</option>
                <option value="excavation">Excavation</option>
                <option value="scaffolding">Scaffolding</option>
                <option value="machinery">Machinery/Equipment</option>
                <option value="hazmat">Hazardous Materials</option>
                <option value="fire_safety">Fire Safety</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief summary of violation"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detailed description of the safety violation..."
            />
          </div>

          {/* Location and Parties */}
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
                placeholder="Building, floor, area"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issued By
              </label>
              <input
                type="text"
                value={formData.issued_by}
                onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Safety officer name"
              />
            </div>
          </div>

          {/* Violator Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Violator Name
              </label>
              <input
                type="text"
                value={formData.violator_name}
                onChange={(e) => setFormData({ ...formData, violator_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Person responsible"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Violator Company
              </label>
              <input
                type="text"
                value={formData.violator_company}
                onChange={(e) => setFormData({ ...formData, violator_company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Company or subcontractor"
              />
            </div>
          </div>

          {/* Corrective Action */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Corrective Action</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Action
                </label>
                <textarea
                  value={formData.corrective_action}
                  onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What needs to be done to resolve this violation..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required By Date
                </label>
                <input
                  type="date"
                  value={formData.corrective_action_required_by}
                  onChange={(e) => setFormData({ ...formData, corrective_action_required_by: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Compliance */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance & Citations</h3>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="osha_recordable"
                  checked={formData.osha_recordable}
                  onChange={(e) => setFormData({ ...formData, osha_recordable: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="osha_recordable" className="ml-2 text-sm font-medium text-gray-700">
                  OSHA Recordable
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="citation_issued"
                  checked={formData.citation_issued}
                  onChange={(e) => setFormData({ ...formData, citation_issued: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="citation_issued" className="ml-2 text-sm font-medium text-gray-700">
                  Citation Issued
                </label>
              </div>

              {formData.citation_issued && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Citation Number
                    </label>
                    <input
                      type="text"
                      value={formData.citation_number}
                      onChange={(e) => setFormData({ ...formData, citation_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Citation #"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fine Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.fine_amount}
                      onChange={(e) => setFormData({ ...formData, fine_amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50"
            >
              {submitting ? 'Saving...' : (violation ? 'Update Violation' : 'Report Violation')}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SafetyViolationForm;
