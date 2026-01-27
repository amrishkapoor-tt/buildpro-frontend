import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Clock, CheckCircle, XCircle,
  AlertCircle, BarChart3, Calendar, Download
} from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const WorkflowAnalytics = ({ projectId, token }) => {
  const [stats, setStats] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [dateRange, setDateRange] = useState('30'); // days
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadAnalytics();
    }
  }, [projectId, dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsResponse = await fetch(
        `${API_URL}/workflows/stats/project/${projectId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      // Load workflows for detailed analysis
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const workflowsResponse = await fetch(
        `${API_URL}/workflows/project/${projectId}?status=completed&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json();
        setWorkflows(workflowsData.workflows || []);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    if (workflows.length === 0) return null;

    // Calculate completion times by entity type
    const completionTimes = {};
    const slaCompliance = { onTime: 0, late: 0 };
    const stageBottlenecks = {};

    workflows.forEach(workflow => {
      const type = workflow.entity_type;
      if (!completionTimes[type]) {
        completionTimes[type] = [];
      }

      // Calculate total completion time
      if (workflow.started_at && workflow.completed_at) {
        const start = new Date(workflow.started_at);
        const end = new Date(workflow.completed_at);
        const hours = (end - start) / (1000 * 60 * 60);
        const days = hours / 24;
        completionTimes[type].push(days);

        // SLA compliance (simplified - would need more detailed data)
        if (workflow.completed_within_sla) {
          slaCompliance.onTime++;
        } else {
          slaCompliance.late++;
        }
      }

      // Stage bottleneck analysis (would need stage-level timing data)
      // This is a simplified version
      if (workflow.stages) {
        workflow.stages.forEach(stage => {
          if (!stageBottlenecks[stage.stage_name]) {
            stageBottlenecks[stage.stage_name] = [];
          }
          if (stage.duration_hours) {
            stageBottlenecks[stage.stage_name].push(stage.duration_hours);
          }
        });
      }
    });

    // Calculate averages
    const avgCompletionTimes = {};
    Object.entries(completionTimes).forEach(([type, times]) => {
      const sum = times.reduce((a, b) => a + b, 0);
      avgCompletionTimes[type] = (sum / times.length).toFixed(1);
    });

    const avgStageTime = {};
    Object.entries(stageBottlenecks).forEach(([stage, times]) => {
      const sum = times.reduce((a, b) => a + b, 0);
      avgStageTime[stage] = (sum / times.length).toFixed(1);
    });

    const slaComplianceRate = slaCompliance.onTime + slaCompliance.late > 0
      ? ((slaCompliance.onTime / (slaCompliance.onTime + slaCompliance.late)) * 100).toFixed(1)
      : 0;

    return {
      avgCompletionTimes,
      slaCompliance,
      slaComplianceRate,
      avgStageTime,
      totalCompleted: workflows.length
    };
  };

  const metrics = calculateMetrics();

  const entityTypeLabels = {
    'submittal': 'Submittals',
    'rfi': 'RFIs',
    'change_order': 'Change Orders'
  };

  if (loading && !stats) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Analytics</h1>
          <p className="text-gray-600 mt-1">Performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
          <button
            onClick={() => alert('Export functionality coming soon')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Active Workflows</span>
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.active || 0}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Completed</span>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.completed || 0}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Overdue</span>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.overdue || 0}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Rejected</span>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <XCircle className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.rejected || 0}</div>
          </div>
        </div>
      )}

      {/* SLA Compliance */}
      {metrics && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SLA Compliance Rate</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">On-time completion</span>
                <span className="text-2xl font-bold text-green-600">
                  {metrics.slaComplianceRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    parseFloat(metrics.slaComplianceRate) >= 80
                      ? 'bg-green-500'
                      : parseFloat(metrics.slaComplianceRate) >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${metrics.slaComplianceRate}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{metrics.slaCompliance.onTime} on-time</span>
                <span>{metrics.slaCompliance.late} late</span>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              {parseFloat(metrics.slaComplianceRate) >= 80 ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Average Completion Time by Type */}
      {metrics && Object.keys(metrics.avgCompletionTimes).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Average Completion Time by Type
          </h2>
          <div className="space-y-4">
            {Object.entries(metrics.avgCompletionTimes).map(([type, days]) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {entityTypeLabels[type] || type}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {days} days
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full"
                    style={{ width: `${Math.min((parseFloat(days) / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottleneck Analysis */}
      {metrics && Object.keys(metrics.avgStageTime).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Bottleneck Analysis
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Average time spent in each stage
          </p>
          <div className="space-y-4">
            {Object.entries(metrics.avgStageTime)
              .sort(([, a], [, b]) => parseFloat(b) - parseFloat(a))
              .map(([stage, hours]) => (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{stage}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {hours} hours
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        parseFloat(hours) > 48
                          ? 'bg-red-500'
                          : parseFloat(hours) > 24
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min((parseFloat(hours) / 72) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Completed Workflows */}
      {workflows.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recently Completed Workflows
          </h2>
          <div className="space-y-3">
            {workflows.slice(0, 10).map(workflow => (
              <div
                key={workflow.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {workflow.entity_identifier}
                  </div>
                  <div className="text-sm text-gray-600">
                    {entityTypeLabels[workflow.entity_type] || workflow.entity_type}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {workflow.completed_at &&
                      new Date(workflow.completed_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {workflow.completed_within_sla ? (
                      <span className="text-green-600">On time</span>
                    ) : (
                      <span className="text-red-600">Late</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No data message */}
      {!loading && workflows.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No data available</h3>
          <p className="text-gray-600">
            Complete some workflows to see analytics and insights
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkflowAnalytics;
