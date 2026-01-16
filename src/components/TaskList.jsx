import React, { useState } from 'react';
import {
  Edit2, Trash2, Link as LinkIcon, ChevronRight, ChevronDown,
  Calendar, Clock, AlertCircle, CheckCircle2, Circle, Users
} from 'lucide-react';

const TaskList = ({ tasks, criticalPath, onEditTask, onDeleteTask, onUpdateStatus, onAddDependency }) => {
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  // Toggle task expansion
  const toggleExpand = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // Check if task is on critical path
  const isCritical = (taskId) => {
    return criticalPath.some(cp => cp.task_id === taskId);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const configs = {
      not_started: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Circle, label: 'Not Started' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock, label: 'In Progress' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2, label: 'Completed' },
    };

    const config = configs[status] || configs.not_started;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Calculate completion percentage
  const getCompletionPercentage = (task) => {
    if (task.actual_completion_percentage !== null) {
      return task.actual_completion_percentage;
    }
    if (task.status === 'completed') return 100;
    if (task.status === 'in_progress') return 50;
    return 0;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Organize tasks by hierarchy
  const organizeTasksByHierarchy = () => {
    const taskMap = new Map(tasks.map(t => [t.id, { ...t, children: [] }]));
    const rootTasks = [];

    tasks.forEach(task => {
      if (task.parent_task_id) {
        const parent = taskMap.get(task.parent_task_id);
        if (parent) {
          parent.children.push(taskMap.get(task.id));
        }
      } else {
        rootTasks.push(taskMap.get(task.id));
      }
    });

    return { taskMap, rootTasks };
  };

  const { taskMap, rootTasks } = organizeTasksByHierarchy();

  // Render task row
  const renderTaskRow = (task, level = 0) => {
    const hasChildren = task.children && task.children.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    const critical = isCritical(task.id);
    const completion = getCompletionPercentage(task);

    return (
      <React.Fragment key={task.id}>
        <tr className={`border-b border-gray-200 hover:bg-gray-50 ${critical ? 'bg-red-50' : ''}`}>
          {/* Task Name with Hierarchy */}
          <td className="px-4 py-3" style={{ paddingLeft: `${level * 24 + 16}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(task.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <div className="w-4" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {task.wbs_code && (
                    <span className="text-xs text-gray-500 font-mono">{task.wbs_code}</span>
                  )}
                  <span className={`text-sm ${hasChildren ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                    {task.name}
                  </span>
                  {critical && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                      Critical
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
                )}
              </div>
            </div>
          </td>

          {/* Status */}
          <td className="px-4 py-3">
            <select
              value={task.status}
              onChange={(e) => onUpdateStatus(task.id, e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </td>

          {/* Progress */}
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                <div
                  className={`h-2 rounded-full ${completion === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${completion}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 font-medium w-10 text-right">{completion}%</span>
            </div>
          </td>

          {/* Start Date */}
          <td className="px-4 py-3 text-sm text-gray-600">
            {formatDate(task.planned_start_date)}
          </td>

          {/* End Date */}
          <td className="px-4 py-3 text-sm text-gray-600">
            {formatDate(task.planned_end_date)}
          </td>

          {/* Duration */}
          <td className="px-4 py-3 text-sm text-gray-600 text-center">
            {task.duration_days}d
          </td>

          {/* Assignees */}
          <td className="px-4 py-3">
            {task.assigned_to_count > 0 ? (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{task.assigned_to_count}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </td>

          {/* Actions */}
          <td className="px-4 py-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAddDependency(task)}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Add Dependency"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEditTask(task)}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Edit Task"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteTask(task.id)}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && task.children.map(child => renderTaskRow(child, level + 1))}
      </React.Fragment>
    );
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No tasks found</p>
          <p className="text-sm text-gray-500 mt-1">Create your first task to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Task Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-40">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-32">
                Progress
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-32">
                Start Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-32">
                End Date
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-24">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-24">
                Assigned
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rootTasks.map(task => renderTaskRow(task, 0))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskList;
