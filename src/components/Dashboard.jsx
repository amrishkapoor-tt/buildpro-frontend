import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, FileText, AlertCircle, CheckCircle2,
  DollarSign, Calendar, Users, Wrench, Send, FolderOpen, Clock,
  Target, ArrowRight, Activity, BarChart3, Layers
} from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const Dashboard = ({ projectId, project, token, onNavigate }) => {
  const [analytics, setAnalytics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [openRFIs, setOpenRFIs] = useState([]);
  const [openPunch, setOpenPunch] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadDashboardData();
    }
  }, [projectId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAnalytics(),
        loadActivity(),
        loadRecentDocuments(),
        loadUpcomingTasks(),
        loadOpenRFIs(),
        loadOpenPunch()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const loadActivity = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/activity?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActivity(data.activity || []);
      }
    } catch (error) {
      console.error('Failed to load activity:', error);
    }
  };

  const loadRecentDocuments = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/recent-documents?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRecentDocs(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load recent documents:', error);
    }
  };

  const loadUpcomingTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/upcoming-tasks?days=7&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUpcomingTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to load upcoming tasks:', error);
    }
  };

  const loadOpenRFIs = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/open-rfis?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOpenRFIs(data.rfis || []);
      }
    } catch (error) {
      console.error('Failed to load open RFIs:', error);
    }
  };

  const loadOpenPunch = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/open-punch?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOpenPunch(data.punchItems || []);
      }
    } catch (error) {
      console.error('Failed to load open punch items:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(dateString);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getActivityIcon = (eventType) => {
    const icons = {
      'document_upload': FolderOpen,
      'rfi_created': FileText,
      'task_completed': CheckCircle2,
      'milestone_achieved': Target,
      'punch_closed': Wrench,
      'submittal_created': Send
    };
    return icons[eventType] || Activity;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'text-red-700 bg-red-100',
      high: 'text-orange-700 bg-orange-100',
      medium: 'text-yellow-700 bg-yellow-100',
      low: 'text-gray-700 bg-gray-100'
    };
    return colors[priority] || colors.medium;
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Clock className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project?.name || 'Project Dashboard'}</h1>
          <p className="text-gray-600 mt-1">{project?.location || 'Overview and key metrics'}</p>
        </div>

        {/* Quick Stats Grid */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Documents */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => onNavigate('documents')}>
              <div className="flex items-center justify-between mb-2">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.documents.total}</div>
              <div className="text-xs text-gray-600">Documents</div>
            </div>

            {/* RFIs */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => onNavigate('rfis')}>
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-medium text-orange-600">{analytics.rfis.open} open</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.rfis.total}</div>
              <div className="text-xs text-gray-600">RFIs</div>
            </div>

            {/* Schedule */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => onNavigate('schedule')}>
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <span className="text-xs font-medium text-green-600">{analytics.schedule.completionPercentage}%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.schedule.totalTasks}</div>
              <div className="text-xs text-gray-600">Tasks</div>
            </div>

            {/* Punch List */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => onNavigate('punch')}>
              <div className="flex items-center justify-between mb-2">
                <Wrench className="w-5 h-5 text-orange-600" />
                <span className="text-xs font-medium text-orange-600">{analytics.punchList.open} open</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.punchList.total}</div>
              <div className="text-xs text-gray-600">Punch Items</div>
            </div>

            {/* Drawings */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => onNavigate('drawings')}>
              <div className="flex items-center justify-between mb-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.drawings.total}</div>
              <div className="text-xs text-gray-600">Drawings</div>
            </div>

            {/* Team */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => onNavigate('team')}>
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-teal-600" />
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{analytics.team.members}</div>
              <div className="text-xs text-gray-600">Team Members</div>
            </div>
          </div>
        )}

        {/* Financial Summary */}
        {analytics && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Budget</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${analytics.financials.totalBudget.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Committed</div>
                <div className="text-2xl font-bold text-blue-600">
                  ${analytics.financials.totalCommitted.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Remaining</div>
                <div className="text-2xl font-bold text-green-600">
                  ${analytics.financials.remainingBudget.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Change Orders</div>
                <div className="text-2xl font-bold text-orange-600">
                  ${analytics.financials.totalChanges.toLocaleString()}
                </div>
              </div>
            </div>
            {analytics.financials.totalBudget > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Budget Utilization</span>
                  <span className="font-medium">
                    {Math.round((analytics.financials.totalCommitted / analytics.financials.totalBudget) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min((analytics.financials.totalCommitted / analytics.financials.totalBudget) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Schedule Overview */}
        {analytics && analytics.schedule.totalTasks > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Schedule Overview</h3>
              </div>
              <button
                onClick={() => onNavigate('schedule')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Full Schedule →
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Tasks</div>
                <div className="text-2xl font-bold text-gray-900">{analytics.schedule.totalTasks}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Completed</div>
                <div className="text-2xl font-bold text-green-600">{analytics.schedule.completedTasks}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">In Progress</div>
                <div className="text-2xl font-bold text-blue-600">{analytics.schedule.inProgressTasks}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Milestones</div>
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.schedule.achievedMilestones}/{analytics.schedule.milestones}
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-medium">{analytics.schedule.completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${analytics.schedule.completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Three Column Layout */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Upcoming Tasks */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Upcoming Tasks</h3>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-gray-500">No tasks starting soon</p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map(task => (
                  <div key={task.id} className="border-l-2 border-blue-500 pl-3 py-1">
                    <div className="text-sm font-medium text-gray-900 truncate">{task.name}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Starts: {formatDate(task.planned_start_date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open RFIs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Open RFIs</h3>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            {openRFIs.length === 0 ? (
              <p className="text-sm text-gray-500">No open RFIs</p>
            ) : (
              <div className="space-y-3">
                {openRFIs.map(rfi => (
                  <div key={rfi.id} className="border-l-2 border-orange-500 pl-3 py-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">{rfi.rfi_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(rfi.priority)}`}>
                        {rfi.priority}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 truncate">{rfi.subject}</div>
                    <div className="text-xs text-gray-600 mt-1">{rfi.response_count} responses</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open Punch Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Open Punch Items</h3>
              <Wrench className="w-5 h-5 text-gray-400" />
            </div>
            {openPunch.length === 0 ? (
              <p className="text-sm text-gray-500">No open punch items</p>
            ) : (
              <div className="space-y-3">
                {openPunch.map(item => (
                  <div key={item.id} className="border-l-2 border-red-500 pl-3 py-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">#{item.item_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 truncate">{item.description}</div>
                    {item.due_date && (
                      <div className="text-xs text-gray-600 mt-1">Due: {formatDate(item.due_date)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Documents */}
        {recentDocs.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recent Documents</h3>
              <button
                onClick={() => onNavigate('documents')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </button>
            </div>
            <div className="space-y-2">
              {recentDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FolderOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{doc.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {doc.category} • {formatFileSize(doc.file_size)} • Uploaded by {doc.uploaded_by_name}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{formatTimeAgo(doc.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {activity.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="space-y-3">
              {activity.map(event => {
                const Icon = getActivityIcon(event.event_type);
                return (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-gray-100 rounded-lg">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{event.event_data?.message || `${event.event_type} on ${event.entity_type}`}</p>
                      <div className="text-xs text-gray-600 mt-1">
                        {event.user_name} • {formatTimeAgo(event.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
