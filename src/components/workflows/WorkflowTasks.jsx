import React, { useState, useEffect } from 'react';
import {
  Activity, AlertCircle, Clock, CheckCircle, Filter, Search,
  FileText, Send, DollarSign, ChevronRight, User
} from 'lucide-react';
import WorkflowActionModal from './WorkflowActionModal';
import WorkflowHistoryModal from './WorkflowHistoryModal';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const WorkflowTasks = ({ projectId, token }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterEntityType, setFilterEntityType] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [stats, setStats] = useState({ overdue: 0, due_soon: 0, on_track: 0 });

  useEffect(() => {
    if (projectId) {
      loadTasks();
    }
  }, [projectId, filterEntityType]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      let endpoint = `/workflows/tasks/my-tasks?project_id=${projectId}`;
      if (filterEntityType !== 'all') {
        endpoint += `&entity_type=${filterEntityType}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
        calculateStats(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (taskList) => {
    const now = new Date();
    let overdue = 0;
    let dueSoon = 0;
    let onTrack = 0;

    taskList.forEach(task => {
      if (!task.current_stage_due_date) {
        onTrack++;
        return;
      }

      const due = new Date(task.current_stage_due_date);
      const hoursUntilDue = (due - now) / (1000 * 60 * 60);

      if (hoursUntilDue < 0) {
        overdue++;
      } else if (hoursUntilDue < 24) {
        dueSoon++;
      } else {
        onTrack++;
      }
    });

    setStats({ overdue, due_soon: dueSoon, on_track: onTrack });
  };

  const getUrgencyLevel = (dueDate) => {
    if (!dueDate) return 'on_track';

    const due = new Date(dueDate);
    const now = new Date();
    const hoursUntilDue = (due - now) / (1000 * 60 * 60);

    if (hoursUntilDue < 0) return 'overdue';
    if (hoursUntilDue < 24) return 'due_soon';
    return 'on_track';
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date';

    const due = new Date(dueDate);
    const now = new Date();
    const hoursUntilDue = (due - now) / (1000 * 60 * 60);
    const daysUntilDue = Math.floor(hoursUntilDue / 24);

    if (hoursUntilDue < 0) {
      const overdueDays = Math.abs(daysUntilDue);
      return `${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue`;
    }

    if (hoursUntilDue < 24) {
      return `Due in ${Math.floor(hoursUntilDue)} hours`;
    }

    return `Due in ${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'}`;
  };

  const getEntityIcon = (entityType) => {
    switch (entityType) {
      case 'submittal':
        return <Send className="w-4 h-4" />;
      case 'rfi':
        return <FileText className="w-4 h-4" />;
      case 'change_order':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getEntityTypeLabel = (entityType) => {
    const labels = {
      'submittal': 'Submittal',
      'rfi': 'RFI',
      'change_order': 'Change Order'
    };
    return labels[entityType] || entityType;
  };

  const handleTaskAction = (task) => {
    setSelectedTask(task);
    setShowActionModal(true);
  };

  const handleViewHistory = (task) => {
    setSelectedTask(task);
    setShowHistoryModal(true);
  };

  const handleActionSubmit = (result) => {
    // Refresh tasks after action
    loadTasks();
    setShowActionModal(false);
    setSelectedTask(null);
  };

  const filteredTasks = tasks.filter(task => {
    // Entity type filter
    if (filterEntityType !== 'all' && task.entity_type !== filterEntityType) {
      return false;
    }

    // Urgency filter
    if (filterUrgency !== 'all') {
      const urgency = getUrgencyLevel(task.current_stage_due_date);
      if (urgency !== filterUrgency) {
        return false;
      }
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        task.entity_identifier?.toLowerCase().includes(search) ||
        task.entity_title?.toLowerCase().includes(search) ||
        task.current_stage_name?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const groupedTasks = {
    overdue: filteredTasks.filter(t => getUrgencyLevel(t.current_stage_due_date) === 'overdue'),
    due_soon: filteredTasks.filter(t => getUrgencyLevel(t.current_stage_due_date) === 'due_soon'),
    on_track: filteredTasks.filter(t => getUrgencyLevel(t.current_stage_due_date) === 'on_track')
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Workflow Tasks</h1>
          <p className="text-gray-600 mt-1">Items awaiting your approval or action</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Overdue</div>
                <div className="text-2xl font-bold text-gray-900">{stats.overdue}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Due Soon</div>
                <div className="text-2xl font-bold text-gray-900">{stats.due_soon}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">On Track</div>
                <div className="text-2xl font-bold text-gray-900">{stats.on_track}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="submittal">Submittals</option>
            <option value="rfi">RFIs</option>
            <option value="change_order">Change Orders</option>
          </select>

          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Urgencies</option>
            <option value="overdue">Overdue</option>
            <option value="due_soon">Due Soon</option>
            <option value="on_track">On Track</option>
          </select>

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading tasks...</div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending tasks</h3>
          <p className="text-gray-600">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue Tasks */}
          {groupedTasks.overdue.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Overdue ({groupedTasks.overdue.length})
                </h2>
              </div>
              <div className="space-y-3">
                {groupedTasks.overdue.map(task => (
                  <TaskCard
                    key={task.workflow_id}
                    task={task}
                    urgency="overdue"
                    onAction={handleTaskAction}
                    onViewHistory={handleViewHistory}
                    getEntityIcon={getEntityIcon}
                    getEntityTypeLabel={getEntityTypeLabel}
                    formatDueDate={formatDueDate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Due Soon Tasks */}
          {groupedTasks.due_soon.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Due Soon ({groupedTasks.due_soon.length})
                </h2>
              </div>
              <div className="space-y-3">
                {groupedTasks.due_soon.map(task => (
                  <TaskCard
                    key={task.workflow_id}
                    task={task}
                    urgency="due_soon"
                    onAction={handleTaskAction}
                    onViewHistory={handleViewHistory}
                    getEntityIcon={getEntityIcon}
                    getEntityTypeLabel={getEntityTypeLabel}
                    formatDueDate={formatDueDate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* On Track Tasks */}
          {groupedTasks.on_track.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  On Track ({groupedTasks.on_track.length})
                </h2>
              </div>
              <div className="space-y-3">
                {groupedTasks.on_track.map(task => (
                  <TaskCard
                    key={task.workflow_id}
                    task={task}
                    urgency="on_track"
                    onAction={handleTaskAction}
                    onViewHistory={handleViewHistory}
                    getEntityIcon={getEntityIcon}
                    getEntityTypeLabel={getEntityTypeLabel}
                    formatDueDate={formatDueDate}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showActionModal && selectedTask && (
        <WorkflowActionModal
          workflowId={selectedTask.workflow_id}
          availableTransitions={selectedTask.available_transitions}
          entityName={`${getEntityTypeLabel(selectedTask.entity_type)}: ${selectedTask.entity_identifier}`}
          token={token}
          onSubmit={handleActionSubmit}
          onClose={() => {
            setShowActionModal(false);
            setSelectedTask(null);
          }}
        />
      )}

      {showHistoryModal && selectedTask && (
        <WorkflowHistoryModal
          workflowId={selectedTask.workflow_id}
          entityName={`${getEntityTypeLabel(selectedTask.entity_type)}: ${selectedTask.entity_identifier}`}
          token={token}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task, urgency, onAction, onViewHistory, getEntityIcon, getEntityTypeLabel, formatDueDate }) => {
  const urgencyColors = {
    overdue: 'border-l-red-500 bg-red-50',
    due_soon: 'border-l-yellow-500 bg-yellow-50',
    on_track: 'border-l-green-500 bg-white'
  };

  const urgencyTextColors = {
    overdue: 'text-red-700',
    due_soon: 'text-yellow-700',
    on_track: 'text-green-700'
  };

  return (
    <div className={`bg-white rounded-lg border-l-4 border border-gray-200 ${urgencyColors[urgency]} p-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="text-gray-600">
              {getEntityIcon(task.entity_type)}
            </div>
            <span className="text-sm font-medium text-gray-600">
              {getEntityTypeLabel(task.entity_type)}
            </span>
            <span className="text-gray-400">•</span>
            <span className="font-semibold text-gray-900">
              {task.entity_identifier}
            </span>
          </div>

          {/* Title */}
          {task.entity_title && (
            <div className="text-sm text-gray-700 mb-2">
              {task.entity_title}
            </div>
          )}

          {/* Current Stage */}
          <div className="flex items-center gap-4 text-sm mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-900">{task.current_stage_name}</span>
            </div>

            {task.assigned_to_name && (
              <>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{task.assigned_to_name}</span>
                </div>
              </>
            )}
          </div>

          {/* Due Date */}
          <div className={`text-sm font-medium ${urgencyTextColors[urgency]}`}>
            {formatDueDate(task.current_stage_due_date)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewHistory(task)}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            History
          </button>
          {task.available_transitions && task.available_transitions.length > 0 && (
            <button
              onClick={() => onAction(task)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
            >
              Take Action
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowTasks;
