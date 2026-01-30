import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Calendar,
  MapPin,
  User,
  DollarSign,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

/**
 * SafetyViolationDetail - Detailed view of a safety violation
 *
 * Features:
 * - Full violation details
 * - Status management
 * - Photo gallery
 * - Corrective action tracking
 * - OSHA compliance info
 */
const SafetyViolationDetail = ({ violation, token, projectId, onClose, onEdit }) => {
  const [currentViolation, setCurrentViolation] = useState(violation);
  const [updating, setUpdating] = useState(false);

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

  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Change status to ${newStatus}?`)) return;

    setUpdating(true);
    try {
      const data = await apiCall(`/safety-violations/${currentViolation.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setCurrentViolation(data.violation);
      window.alert('Status updated successfully');
    } catch (error) {
      window.alert(`Failed to update status: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this violation? This action cannot be undone.')) return;

    try {
      await apiCall(`/safety-violations/${currentViolation.id}`, {
        method: 'DELETE'
      });
      window.alert('Violation deleted successfully');
      onClose();
    } catch (error) {
      window.alert(`Failed to delete violation: ${error.message}`);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      minor: 'text-blue-700 bg-blue-100',
      moderate: 'text-yellow-700 bg-yellow-100',
      major: 'text-orange-700 bg-orange-100',
      critical: 'text-red-700 bg-red-100'
    };
    return colors[severity] || 'text-gray-700 bg-gray-100';
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'text-red-700 bg-red-100',
      in_progress: 'text-yellow-700 bg-yellow-100',
      resolved: 'text-green-700 bg-green-100',
      closed: 'text-gray-700 bg-gray-100'
    };
    return colors[status] || 'text-gray-700 bg-gray-100';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              {currentViolation.violation_number && (
                <span className="text-sm font-mono text-gray-600">#{currentViolation.violation_number}</span>
              )}
              <span className={`text-xs px-2 py-1 rounded capitalize ${getStatusColor(currentViolation.status)}`}>
                {currentViolation.status.replace('_', ' ')}
              </span>
              {currentViolation.severity && (
                <span className={`text-xs px-2 py-1 rounded capitalize ${getSeverityColor(currentViolation.severity)}`}>
                  {currentViolation.severity}
                </span>
              )}
              {currentViolation.osha_recordable && (
                <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                  OSHA Recordable
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentViolation.title || `${currentViolation.violation_type} Violation`}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{currentViolation.description}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {currentViolation.issued_at && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Issued Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(currentViolation.issued_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {currentViolation.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium text-gray-900">{currentViolation.location}</p>
                  </div>
                </div>
              )}

              {currentViolation.violator_name && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Violator</p>
                    <p className="font-medium text-gray-900">{currentViolation.violator_name}</p>
                    {currentViolation.violator_company && (
                      <p className="text-sm text-gray-600">{currentViolation.violator_company}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {currentViolation.issued_by && (
                <div>
                  <p className="text-sm text-gray-600">Issued By</p>
                  <p className="font-medium text-gray-900">{currentViolation.issued_by}</p>
                </div>
              )}

              {currentViolation.fine_amount && (
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Fine Amount</p>
                    <p className="font-medium text-red-600 text-lg">
                      ${parseFloat(currentViolation.fine_amount).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {currentViolation.citation_issued && (
                <div>
                  <p className="text-sm text-gray-600">Citation Number</p>
                  <p className="font-medium text-gray-900">
                    {currentViolation.citation_number || 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Corrective Action */}
          {currentViolation.corrective_action && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <h3 className="text-lg font-semibold text-green-900">Corrective Action</h3>
              </div>
              <p className="text-green-800 ml-8">{currentViolation.corrective_action}</p>

              <div className="grid grid-cols-2 gap-4 mt-4 ml-8">
                {currentViolation.corrective_action_required_by && (
                  <div>
                    <p className="text-sm text-green-700">Required By</p>
                    <p className="font-medium text-green-900">
                      {new Date(currentViolation.corrective_action_required_by).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {currentViolation.corrective_action_completed_at && (
                  <div>
                    <p className="text-sm text-green-700">Completed</p>
                    <p className="font-medium text-green-900">
                      {new Date(currentViolation.corrective_action_completed_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photos */}
          {currentViolation.photo_urls && currentViolation.photo_urls.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Photos ({currentViolation.photo_urls.length})
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {currentViolation.photo_urls.map((url, index) => (
                  <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={url}
                      alt={`Violation photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
            <p>Created by {currentViolation.creator_name || 'Unknown'} on {new Date(currentViolation.created_at).toLocaleString()}</p>
            {currentViolation.updated_at && (
              <p>Last updated: {new Date(currentViolation.updated_at).toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(currentViolation)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 inline mr-2" />
                Delete
              </button>
            </div>

            <div className="flex items-center gap-2">
              {currentViolation.status === 'open' && (
                <button
                  onClick={() => handleStatusUpdate('in_progress')}
                  disabled={updating}
                  className="px-4 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 disabled:opacity-50"
                >
                  <Clock className="w-4 h-4 inline mr-2" />
                  Start Progress
                </button>
              )}
              {(currentViolation.status === 'open' || currentViolation.status === 'in_progress') && (
                <button
                  onClick={() => handleStatusUpdate('resolved')}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Mark Resolved
                </button>
              )}
              {currentViolation.status === 'resolved' && (
                <button
                  onClick={() => handleStatusUpdate('closed')}
                  disabled={updating}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyViolationDetail;
