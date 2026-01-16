import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock,
  Calendar, Target, BarChart3, Activity, ArrowRight
} from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const ScheduleAnalytics = ({ summary, criticalPath, tasks, projectId, token }) => {
  const [variance, setVariance] = useState(null);
  const [lookAhead, setLookAhead] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadAnalytics();
    }
  }, [projectId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadVariance(),
        loadLookAhead()
      ]);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVariance = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/schedule/variance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVariance(data.variance);
      }
    } catch (error) {
      console.error('Failed to load variance:', error);
    }
  };

  const loadLookAhead = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/schedule/look-ahead?days=14`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLookAhead(data);
      }
    } catch (error) {
      console.error('Failed to load look-ahead:', error);
    }
  };

  // Calculate schedule health
  const getScheduleHealth = () => {
    if (!summary) return { status: 'unknown', color: 'gray' };

    const completion = summary.completion_percentage || 0;
    const criticalCount = summary.critical_path_tasks || 0;
    const totalTasks = summary.total_tasks || 1;
    const criticalPercentage = (criticalCount / totalTasks) * 100;

    if (completion >= 90) return { status: 'excellent', color: 'green', label: 'On Track' };
    if (completion >= 70) return { status: 'good', color: 'blue', label: 'Good Progress' };
    if (criticalPercentage > 30) return { status: 'warning', color: 'orange', label: 'Needs Attention' };
    return { status: 'caution', color: 'yellow', label: 'Monitor Closely' };
  };

  const health = getScheduleHealth();

  // Get upcoming tasks
  const getUpcomingTasks = () => {
    if (!tasks) return [];
    const today = new Date();
    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);

    return tasks
      .filter(t => {
        const startDate = new Date(t.planned_start_date);
        return t.status === 'not_started' && startDate >= today && startDate <= twoWeeks;
      })
      .sort((a, b) => new Date(a.planned_start_date) - new Date(b.planned_start_date))
      .slice(0, 5);
  };

  const upcomingTasks = getUpcomingTasks();

  // Get at-risk tasks
  const getAtRiskTasks = () => {
    if (!tasks || !criticalPath) return [];

    const today = new Date();
    return tasks
      .filter(t => {
        const isCritical = criticalPath.some(cp => cp.task_id === t.id);
        const endDate = new Date(t.planned_end_date);
        const daysToEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        return isCritical && t.status !== 'completed' && daysToEnd < 7;
      })
      .slice(0, 5);
  };

  const atRiskTasks = getAtRiskTasks();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-full">
        <Clock className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Schedule Health Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Schedule Health</h3>
            <span className={`px-3 py-1 bg-${health.color}-100 text-${health.color}-700 rounded-full text-sm font-medium`}>
              {health.label}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Overall Progress</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-gray-900">
                  {summary?.completion_percentage || 0}%
                </div>
                {summary && summary.completion_percentage > 0 && (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                )}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Tasks Completed</div>
              <div className="text-3xl font-bold text-gray-900">
                {summary?.completed_tasks || 0}/{summary?.total_tasks || 0}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Critical Path Items</div>
              <div className="text-3xl font-bold text-orange-600">
                {summary?.critical_path_tasks || 0}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">In Progress</div>
              <div className="text-3xl font-bold text-blue-600">
                {summary?.in_progress_tasks || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Variance Analysis */}
        {variance && variance.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">Schedule Variance</h3>
            </div>

            <div className="space-y-3">
              {variance.slice(0, 5).map((item) => (
                <div key={item.task_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.task_name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Planned: {formatDate(item.baseline_start)} - {formatDate(item.baseline_end)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${item.schedule_variance_days < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {item.schedule_variance_days > 0 ? '+' : ''}{item.schedule_variance_days}d
                    </div>
                    <div className="text-xs text-gray-500">variance</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two-Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Tasks */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">Starting Soon</h3>
              <span className="text-sm text-gray-500">(Next 2 weeks)</span>
            </div>

            {upcomingTasks.length === 0 ? (
              <p className="text-gray-500 text-sm">No tasks starting in the next 2 weeks</p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="mt-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{task.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Starts: {formatDate(task.planned_start_date)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Duration: {task.duration_days} days
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* At-Risk Tasks */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">At Risk</h3>
              <span className="text-sm text-gray-500">(Critical path)</span>
            </div>

            {atRiskTasks.length === 0 ? (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-green-900">All Clear</div>
                  <div className="text-sm text-green-700 mt-1">
                    No critical tasks are at risk
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {atRiskTasks.map((task) => {
                  const endDate = new Date(task.planned_end_date);
                  const today = new Date();
                  const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={task.id} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                      <div className="mt-1">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{task.name}</div>
                        <div className="text-sm text-orange-700 mt-1 font-medium">
                          Due in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          End: {formatDate(task.planned_end_date)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Critical Path Summary */}
        {criticalPath && criticalPath.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowRight className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Critical Path</h3>
              <span className="text-sm text-gray-500">({criticalPath.length} tasks)</span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {criticalPath.slice(0, 6).map((cp) => (
                <div key={cp.task_id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="font-medium text-gray-900 text-sm truncate">{cp.task_name}</div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-600">Float: {cp.total_float || 0}d</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                      Critical
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {criticalPath.length > 6 && (
              <div className="mt-3 text-sm text-gray-600 text-center">
                + {criticalPath.length - 6} more critical tasks
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Metrics</h3>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Duration</span>
                  <span className="font-semibold text-gray-900">{summary.total_duration_days || 0} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Elapsed</span>
                  <span className="font-semibold text-gray-900">{summary.elapsed_days || 0} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Remaining</span>
                  <span className="font-semibold text-gray-900">{summary.remaining_days || 0} days</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Not Started</span>
                  <span className="font-semibold text-gray-600">{summary.not_started_tasks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="font-semibold text-blue-600">{summary.in_progress_tasks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-semibold text-green-600">{summary.completed_tasks || 0}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Critical Tasks</span>
                  <span className="font-semibold text-red-600">{summary.critical_path_tasks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">With Dependencies</span>
                  <span className="font-semibold text-gray-900">{summary.tasks_with_dependencies || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Milestones</span>
                  <span className="font-semibold text-purple-600">{summary.milestones_count || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleAnalytics;
