import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Users,
  Calendar
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

/**
 * SafetyDashboard - Analytics and trends for safety violations
 *
 * Features:
 * - Key metrics overview
 * - Violation trends over time
 * - Distribution by type and severity
 * - Overdue corrective actions
 * - OSHA compliance metrics
 */
const SafetyDashboard = ({ projectId, token }) => {
  const [stats, setStats] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadDashboardData();
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
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || 'Request failed');
    }
    return response.json();
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, overdueData] = await Promise.all([
        apiCall(`/projects/${projectId}/safety-violations/stats`),
        apiCall(`/projects/${projectId}/safety-violations/overdue`)
      ]);

      setStats(statsData.stats);
      setOverdue(overdueData.violations || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        No data available
      </div>
    );
  }

  const resolutionRate = stats.total_violations > 0
    ? ((stats.resolved_count + stats.closed_count) / stats.total_violations * 100).toFixed(1)
    : 0;

  const activeViolations = stats.open_count + stats.in_progress_count;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-blue-600" />
          Safety Dashboard
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Overview of safety performance and compliance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Violations */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-600">Total</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total_violations}</p>
          <p className="text-sm text-gray-600 mt-1">Violations</p>
        </div>

        {/* Active Violations */}
        <div className="bg-white border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
            <span className="text-sm text-red-600">Active</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{activeViolations}</p>
          <p className="text-sm text-gray-600 mt-1">Open/In Progress</p>
        </div>

        {/* Resolution Rate */}
        <div className="bg-white border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <span className="text-sm text-green-600">Resolved</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{resolutionRate}%</p>
          <p className="text-sm text-gray-600 mt-1">Resolution Rate</p>
        </div>

        {/* Total Fines */}
        <div className="bg-white border border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-orange-500" />
            <span className="text-sm text-orange-600">Fines</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">
            ${parseFloat(stats.total_fines || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">Total Penalties</p>
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Violations by Severity</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{stats.minor_count}</p>
            <p className="text-sm text-blue-700 mt-1">Minor</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">{stats.moderate_count}</p>
            <p className="text-sm text-yellow-700 mt-1">Moderate</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-3xl font-bold text-orange-600">{stats.major_count}</p>
            <p className="text-sm text-orange-700 mt-1">Major</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">{stats.critical_count}</p>
            <p className="text-sm text-red-700 mt-1">Critical</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violations by Type */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Violation Types</h3>
          {stats.by_type && stats.by_type.length > 0 ? (
            <div className="space-y-3">
              {stats.by_type.slice(0, 5).map((type, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {type.violation_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="mt-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(type.count / stats.total_violations) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <span className="ml-4 text-sm font-semibold text-gray-700">{type.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No data available</p>
          )}
        </div>

        {/* OSHA Compliance */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">OSHA Compliance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-700">OSHA Recordable</p>
                  <p className="text-xs text-purple-600 mt-0.5">Serious violations</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.osha_recordable_count}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="text-sm text-red-700">Citations Issued</p>
                  <p className="text-xs text-red-600 mt-0.5">Formal penalties</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.citation_count}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-700">Average Fine</p>
                  <p className="text-xs text-orange-600 mt-0.5">Per citation</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                ${stats.citation_count > 0
                  ? Math.round(stats.total_fines / stats.citation_count).toLocaleString()
                  : '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      {stats.trend && stats.trend.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">6-Month Trend</h3>
          <div className="space-y-3">
            {stats.trend.map((month, index) => {
              const monthDate = new Date(month.month);
              const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              const maxCount = Math.max(...stats.trend.map(m => parseInt(m.count)));

              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-600">{monthName}</div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-8 relative">
                      <div
                        className="bg-blue-600 h-8 rounded-full flex items-center justify-end pr-3"
                        style={{
                          width: `${(parseInt(month.count) / maxCount) * 100}%`,
                          minWidth: parseInt(month.count) > 0 ? '40px' : '0'
                        }}
                      >
                        <span className="text-sm font-semibold text-white">{month.count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overdue Corrective Actions */}
      {overdue.length > 0 && (
        <div className="bg-white border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-600" />
              Overdue Corrective Actions
            </h3>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
              {overdue.length} Overdue
            </span>
          </div>
          <div className="space-y-3">
            {overdue.slice(0, 5).map(violation => (
              <div key={violation.id} className="flex items-start justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {violation.title || `${violation.violation_type} Violation`}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{violation.location}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-medium text-red-600">
                    Due: {new Date(violation.corrective_action_required_by).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-red-500 mt-1">
                    {Math.floor((Date.now() - new Date(violation.corrective_action_required_by)) / (1000 * 60 * 60 * 24))} days overdue
                  </p>
                </div>
              </div>
            ))}
            {overdue.length > 5 && (
              <p className="text-sm text-gray-500 text-center pt-2">
                And {overdue.length - 5} more overdue actions...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetyDashboard;
