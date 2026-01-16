import React, { useState, useEffect } from 'react';
import {
  Plus, Calendar, BarChart3, Target, ListChecks, Filter, Search,
  ChevronDown, ChevronRight, AlertCircle, CheckCircle2, Clock,
  Edit2, Trash2, Link as LinkIcon, Users, TrendingUp, AlertTriangle
} from 'lucide-react';
import GanttChart from './GanttChart';
import TaskList from './TaskList';
import MilestoneList from './MilestoneList';
import ScheduleAnalytics from './ScheduleAnalytics';
import TaskModal from './TaskModal';
import DependencyModal from './DependencyModal';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const Schedule = ({ projectId, token }) => {
  const [activeTab, setActiveTab] = useState('gantt'); // 'gantt', 'tasks', 'milestones', 'analytics'
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [criticalPath, setCriticalPath] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [scheduleSummary, setSummary] = useState(null);
  const [ganttData, setGanttData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'not_started', 'in_progress', 'completed'
  const [filterCritical, setFilterCritical] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadScheduleData();
    }
  }, [projectId]);

  const loadScheduleData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTasks(),
        loadMilestones(),
        loadCriticalPath(),
        loadSummary(),
        loadGanttData()
      ]);
    } catch (error) {
      console.error('Failed to load schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/schedule/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load tasks');
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadMilestones = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/schedule/milestones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load milestones');
      const data = await response.json();
      setMilestones(data.milestones || []);
    } catch (error) {
      console.error('Failed to load milestones:', error);
    }
  };

  const loadCriticalPath = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/schedule/critical-path`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load critical path');
      const data = await response.json();
      setCriticalPath(data.critical_path || []);
    } catch (error) {
      console.error('Failed to load critical path:', error);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/schedule/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load summary');
      const data = await response.json();
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const loadGanttData = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/schedule/gantt`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load gantt data');
      const data = await response.json();
      setGanttData(data);
    } catch (error) {
      console.error('Failed to load gantt data:', error);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task? This will also remove all dependencies.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/schedule/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete task');

      await loadScheduleData();
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task');
    }
  };

  const handleTaskSaved = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    loadScheduleData();
  };

  const handleAddDependency = (task) => {
    setSelectedTask(task);
    setShowDependencyModal(true);
  };

  const handleDependencySaved = () => {
    setShowDependencyModal(false);
    setSelectedTask(null);
    loadScheduleData();
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/schedule/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update task status');

      await loadScheduleData();
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('Failed to update task status');
    }
  };

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery ||
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;

    const matchesCritical = !filterCritical || criticalPath.some(cp => cp.task_id === task.id);

    return matchesSearch && matchesStatus && matchesCritical;
  });

  const tabs = [
    { id: 'gantt', label: 'Gantt Chart', icon: BarChart3 },
    { id: 'tasks', label: 'Task List', icon: ListChecks },
    { id: 'milestones', label: 'Milestones', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Project Schedule</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage tasks, dependencies, and track project timeline
            </p>
          </div>
          <button
            onClick={handleCreateTask}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>

        {/* Summary Stats */}
        {scheduleSummary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Total Tasks</div>
              <div className="text-xl font-bold text-gray-900">{scheduleSummary.total_tasks}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600 mb-1">In Progress</div>
              <div className="text-xl font-bold text-blue-900">{scheduleSummary.in_progress_tasks}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xs text-green-600 mb-1">Completed</div>
              <div className="text-xl font-bold text-green-900">{scheduleSummary.completed_tasks}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-xs text-orange-600 mb-1">Critical Path</div>
              <div className="text-xl font-bold text-orange-900">{scheduleSummary.critical_path_tasks}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-xs text-purple-600 mb-1">Progress</div>
              <div className="text-xl font-bold text-purple-900">{scheduleSummary.completion_percentage}%</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Filters - Show for tasks tab */}
      {activeTab === 'tasks' && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="flex items-center gap-3 mt-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterCritical}
                  onChange={(e) => setFilterCritical(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Critical Path Only</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Clock className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading schedule...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'gantt' && (
              <GanttChart
                ganttData={ganttData}
                tasks={tasks}
                criticalPath={criticalPath}
                onTaskClick={handleEditTask}
              />
            )}
            {activeTab === 'tasks' && (
              <TaskList
                tasks={filteredTasks}
                criticalPath={criticalPath}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onUpdateStatus={handleUpdateTaskStatus}
                onAddDependency={handleAddDependency}
              />
            )}
            {activeTab === 'milestones' && (
              <MilestoneList
                milestones={milestones}
                projectId={projectId}
                token={token}
                onUpdate={loadScheduleData}
              />
            )}
            {activeTab === 'analytics' && (
              <ScheduleAnalytics
                summary={scheduleSummary}
                criticalPath={criticalPath}
                tasks={tasks}
                projectId={projectId}
                token={token}
              />
            )}
          </>
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          projectId={projectId}
          token={token}
          tasks={tasks}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSave={handleTaskSaved}
        />
      )}

      {/* Dependency Modal */}
      {showDependencyModal && selectedTask && (
        <DependencyModal
          task={selectedTask}
          allTasks={tasks}
          token={token}
          onClose={() => {
            setShowDependencyModal(false);
            setSelectedTask(null);
          }}
          onSave={handleDependencySaved}
        />
      )}
    </div>
  );
};

export default Schedule;
