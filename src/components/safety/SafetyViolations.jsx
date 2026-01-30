import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Filter,
  X,
  Search,
  Calendar,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { usePermissions } from '../../contexts/PermissionContext';
import SafetyViolationDetail from './SafetyViolationDetail';
import SafetyViolationForm from './SafetyViolationForm';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

/**
 * SafetyViolations - Main safety violations management component
 *
 * Features:
 * - List all violations with filtering
 * - Statistics dashboard
 * - Create/edit/delete violations
 * - Status management
 * - OSHA recordable tracking
 */
const SafetyViolations = ({ projectId, token }) => {
  const { can } = usePermissions();
  const [violations, setViolations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingViolation, setEditingViolation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    violation_type: '',
    search: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    if (projectId) {
      loadViolations();
      loadStats();
    }
  }, [projectId, filters]);

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

  const loadViolations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const data = await apiCall(`/projects/${projectId}/safety-violations?${params}`);
      setViolations(data.violations || []);
    } catch (error) {
      console.error('Failed to load violations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await apiCall(`/projects/${projectId}/safety-violations/stats`);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const data = await apiCall(`/safety-violations/${id}`);
      setSelectedViolation(data.violation);
      setShowDetail(true);
    } catch (error) {
      window.alert(`Failed to load violation: ${error.message}`);
    }
  };

  const handleEdit = (violation) => {
    setEditingViolation(violation);
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingViolation(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingViolation(null);
    loadViolations();
    loadStats();
  };

  const handleDetailClose = () => {
    setShowDetail(false);
    setSelectedViolation(null);
    loadViolations();
    loadStats();
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      minor: 'bg-blue-100 text-blue-700',
      moderate: 'bg-yellow-100 text-yellow-700',
      major: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return badges[severity] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-red-100 text-red-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-orange-600" />
            Safety Violations
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage safety violations, OSHA recordables, and corrective actions
          </p>
        </div>
        {can('field_engineer') && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Plus className="w-5 h-5" />
            Report Violation
          </button>
        )}
      </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Violations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_violations}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.open_count}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 font-bold">!</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">OSHA Recordable</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.osha_recordable_count}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-400" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Fines</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${parseFloat(stats.total_fines || 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search violations..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Severities</option>
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Violations List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading violations...</div>
        </div>
      ) : violations.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No safety violations found</p>
          {can('field_engineer') && (
            <button
              onClick={handleCreateNew}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Report the first violation
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {violations.map(violation => (
            <div
              key={violation.id}
              onClick={() => handleViewDetail(violation.id)}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {violation.violation_number && (
                      <span className="text-xs font-mono text-gray-600">#{violation.violation_number}</span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded capitalize ${getStatusBadge(violation.status)}`}>
                      {violation.status.replace('_', ' ')}
                    </span>
                    {violation.severity && (
                      <span className={`text-xs px-2 py-1 rounded capitalize ${getSeverityBadge(violation.severity)}`}>
                        {violation.severity}
                      </span>
                    )}
                    {violation.osha_recordable && (
                      <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                        OSHA Recordable
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {violation.title || `${violation.violation_type} Violation`}
                  </h3>
                  <p className="text-sm text-gray-700 line-clamp-2">{violation.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  {violation.issued_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(violation.issued_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {violation.violator_company && (
                    <span>{violation.violator_company}</span>
                  )}
                  {violation.location && (
                    <span>{violation.location}</span>
                  )}
                </div>
                {violation.fine_amount && (
                  <span className="font-medium text-red-600">
                    Fine: ${parseFloat(violation.fine_amount).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedViolation && (
        <SafetyViolationDetail
          violation={selectedViolation}
          token={token}
          projectId={projectId}
          onClose={handleDetailClose}
          onEdit={handleEdit}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <SafetyViolationForm
          violation={editingViolation}
          projectId={projectId}
          token={token}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default SafetyViolations;
