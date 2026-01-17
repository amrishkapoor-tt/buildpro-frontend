import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const GanttChart = ({ ganttData, tasks, criticalPath, onTaskClick }) => {
  const [scale, setScale] = useState('week'); // 'day', 'week', 'month'
  const [viewWindow, setViewWindow] = useState({ start: null, end: null }); // Current visible date range
  const [statusFilter, setStatusFilter] = useState({
    critical: true,
    in_progress: true,
    completed: true,
    not_started: true
  });
  const containerRef = useRef(null);

  // Reset view window when scale changes
  useEffect(() => {
    setViewWindow({ start: null, end: null });
  }, [scale]);

  if (!ganttData || !tasks || tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Maximize2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No tasks to display</p>
          <p className="text-sm text-gray-500 mt-1">Create your first task to see the Gantt chart</p>
        </div>
      </div>
    );
  }

  // Parse dates from gantt data with padding
  const projectStartDate = ganttData.start_date ? new Date(ganttData.start_date) : new Date();
  const projectEndDate = ganttData.end_date ? new Date(ganttData.end_date) : new Date();

  // Add padding: 2 weeks before and after for better context
  const paddedStartDate = new Date(projectStartDate);
  paddedStartDate.setDate(paddedStartDate.getDate() - 14);

  const paddedEndDate = new Date(projectEndDate);
  paddedEndDate.setDate(paddedEndDate.getDate() + 14);

  // Use view window if set, otherwise use full padded range
  const startDate = viewWindow.start || paddedStartDate;
  const endDate = viewWindow.end || paddedEndDate;

  // Calculate total days
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;

  // Generate time periods based on scale
  const generateTimePeriods = () => {
    const periods = [];
    let currentDate = new Date(startDate);

    if (scale === 'day') {
      while (currentDate <= endDate) {
        periods.push({
          label: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          date: new Date(currentDate)
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (scale === 'week') {
      while (currentDate <= endDate) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        periods.push({
          label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          date: new Date(currentDate)
        });
        currentDate.setDate(currentDate.getDate() + 7);
      }
    } else {
      while (currentDate <= endDate) {
        periods.push({
          label: currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          date: new Date(currentDate)
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    return periods;
  };

  const periods = generateTimePeriods();

  // Base pixel width per period based on scale
  const basePeriodWidth = scale === 'day' ? 40 : scale === 'week' ? 120 : 150;

  // Days per period based on scale
  const daysPerPeriod = scale === 'day' ? 1 : scale === 'week' ? 7 : 30;

  // Calculate timeline width - ensure minimum width for proper display
  const calculatedWidth = periods.length * basePeriodWidth;
  const minTimelineWidth = 1200; // Minimum width to fill screen
  const timelineWidth = Math.max(calculatedWidth, minTimelineWidth);

  // Adjust period width to fill the timeline evenly
  const periodWidth = timelineWidth / periods.length;

  // Pixel width per day (based on actual period width)
  const pixelsPerDay = periodWidth / daysPerPeriod;

  // Calculate task position and width in pixels
  const getTaskStyle = (task) => {
    const taskStart = new Date(task.planned_start_date);
    const taskEnd = new Date(task.planned_end_date);

    // Calculate days from project start
    const daysFromStart = Math.max(0, Math.ceil((taskStart - startDate) / (1000 * 60 * 60 * 24)));

    // Calculate task duration in days
    const taskDuration = Math.max(1, Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24)));

    // Convert to pixels
    const leftPx = daysFromStart * pixelsPerDay;
    const widthPx = Math.max(20, taskDuration * pixelsPerDay); // Minimum 20px width for visibility

    return {
      left: `${leftPx}px`,
      width: `${widthPx}px`
    };
  };

  // Check if task is on critical path
  const isCritical = (taskId) => {
    return criticalPath.some(cp => cp.task_id === taskId);
  };

  // Get status color with gradients
  const getStatusColor = (status, critical) => {
    if (critical) return 'bg-gradient-to-r from-red-500 to-red-600 border border-red-700';
    if (status === 'completed') return 'bg-gradient-to-r from-green-500 to-green-600 border border-green-700';
    if (status === 'in_progress') return 'bg-gradient-to-r from-blue-500 to-blue-600 border border-blue-700';
    return 'bg-gradient-to-r from-gray-400 to-gray-500 border border-gray-600';
  };

  // Get progress percentage for in-progress tasks
  const getTaskProgress = (task) => {
    if (task.status !== 'in_progress') return 0;

    const taskStart = new Date(task.planned_start_date);
    const taskEnd = new Date(task.planned_end_date);
    const today = new Date();

    if (today < taskStart) return 0;
    if (today > taskEnd) return 100;

    const totalDuration = taskEnd - taskStart;
    const elapsed = today - taskStart;

    return Math.round((elapsed / totalDuration) * 100);
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

    const flattenTasks = (task, level = 0) => {
      const result = [{ ...task, level }];
      task.children.forEach(child => {
        result.push(...flattenTasks(child, level + 1));
      });
      return result;
    };

    return rootTasks.flatMap(task => flattenTasks(task));
  };

  const hierarchicalTasks = organizeTasksByHierarchy();

  // Filter tasks based on status filter
  const filteredTasks = hierarchicalTasks.filter(task => {
    const critical = isCritical(task.id);

    if (critical && !statusFilter.critical) return false;
    if (task.status === 'completed' && !statusFilter.completed) return false;
    if (task.status === 'in_progress' && !statusFilter.in_progress) return false;
    if (task.status === 'not_started' && !statusFilter.not_started) return false;

    return true;
  });

  // Calculate appropriate window size for each scale
  const calculateWindowSize = () => {
    if (scale === 'day') {
      return 30; // 30 days
    } else if (scale === 'week') {
      return 84; // 12 weeks = 84 days
    } else {
      return 180; // 6 months = ~180 days
    }
  };

  // Navigation functions
  const navigatePeriod = (direction) => {
    const currentStart = viewWindow.start || paddedStartDate;
    const windowSize = calculateWindowSize();

    const newStart = new Date(currentStart);

    if (scale === 'day') {
      newStart.setDate(newStart.getDate() + (direction * 14)); // Move by 2 weeks
    } else if (scale === 'week') {
      newStart.setDate(newStart.getDate() + (direction * 28)); // Move by 4 weeks
    } else {
      newStart.setMonth(newStart.getMonth() + (direction * 2)); // Move by 2 months
    }

    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + windowSize);

    setViewWindow({ start: newStart, end: newEnd });
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const windowSize = calculateWindowSize();
    const halfWindow = Math.floor(windowSize / 2);

    const newStart = new Date(today);
    newStart.setDate(newStart.getDate() - halfWindow);

    const newEnd = new Date(today);
    newEnd.setDate(newEnd.getDate() + halfWindow);

    setViewWindow({ start: newStart, end: newEnd });
  };

  // Check if today is in current view
  const isTodayInView = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today >= startDate && today <= endDate;
  };

  const resetView = () => {
    setViewWindow({ start: null, end: null });
  };

  const toggleStatusFilter = (status) => {
    setStatusFilter(prev => ({ ...prev, [status]: !prev[status] }));
  };

  // Calculate today's position for indicator line
  const getTodayPosition = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Normalize comparison dates to midnight
    const normalizedStart = new Date(startDate);
    normalizedStart.setHours(0, 0, 0, 0);

    const normalizedEnd = new Date(endDate);
    normalizedEnd.setHours(23, 59, 59, 999);

    // Check if today is within the visible range
    if (today < normalizedStart || today > normalizedEnd) {
      return null;
    }

    const daysFromStart = Math.ceil((today - normalizedStart) / (1000 * 60 * 60 * 24));
    return daysFromStart * pixelsPerDay;
  };

  const todayPosition = getTodayPosition();

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Controls */}
      <div className="flex flex-col gap-3 px-6 py-3 border-b border-gray-200 bg-gray-50">
        {/* Top row: Scale and Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">View:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setScale('day')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  scale === 'day' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setScale('week')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  scale === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setScale('month')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  scale === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Month
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigatePeriod(-1)}
              className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              title="Previous period"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={goToToday}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isTodayInView()
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => navigatePeriod(1)}
              className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              title="Next period"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={resetView}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              title="Show full timeline"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom row: Legend/Filters */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">Filter:</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleStatusFilter('critical')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                statusFilter.critical
                  ? 'bg-red-50 border-2 border-red-300'
                  : 'bg-white border-2 border-gray-200 opacity-50 hover:opacity-75'
              }`}
            >
              <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded border border-red-700 shadow-sm"></div>
              <span className="text-gray-700">Critical Path</span>
            </button>
            <button
              onClick={() => toggleStatusFilter('in_progress')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                statusFilter.in_progress
                  ? 'bg-blue-50 border-2 border-blue-300'
                  : 'bg-white border-2 border-gray-200 opacity-50 hover:opacity-75'
              }`}
            >
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded border border-blue-700 shadow-sm"></div>
              <span className="text-gray-700">In Progress</span>
            </button>
            <button
              onClick={() => toggleStatusFilter('completed')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                statusFilter.completed
                  ? 'bg-green-50 border-2 border-green-300'
                  : 'bg-white border-2 border-gray-200 opacity-50 hover:opacity-75'
              }`}
            >
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded border border-green-700 shadow-sm"></div>
              <span className="text-gray-700">Completed</span>
            </button>
            <button
              onClick={() => toggleStatusFilter('not_started')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                statusFilter.not_started
                  ? 'bg-gray-50 border-2 border-gray-300'
                  : 'bg-white border-2 border-gray-200 opacity-50 hover:opacity-75'
              }`}
            >
              <div className="w-3 h-3 bg-gradient-to-r from-gray-400 to-gray-500 rounded border border-gray-600 shadow-sm"></div>
              <span className="text-gray-700">Not Started</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 overflow-auto" ref={containerRef}>
        <div className="flex min-w-max">
          {/* Task Names Column */}
          <div className="w-80 flex-shrink-0 bg-gray-50 border-r-2 border-gray-300 sticky left-0 z-30">
            {/* Header */}
            <div className="h-12 flex items-center px-4 border-b-2 border-gray-300 bg-gradient-to-b from-gray-100 to-gray-50 font-semibold text-gray-900 text-sm shadow-sm">
              Task Name
            </div>

            {/* Task Rows */}
            {filteredTasks.map((task) => {
              const critical = isCritical(task.id);
              return (
                <div
                  key={task.id}
                  className={`h-12 flex items-center px-4 border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors ${
                    critical ? 'bg-red-50/50' : 'bg-white'
                  }`}
                  onClick={() => onTaskClick(task)}
                  style={{ paddingLeft: `${task.level * 20 + 16}px` }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {task.children && task.children.length > 0 && (
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`text-sm truncate ${task.children?.length > 0 ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {task.wbs_code && <span className="text-gray-400 mr-2 font-mono text-xs">{task.wbs_code}</span>}
                      {task.name}
                    </span>
                    {critical && (
                      <span className="ml-auto text-xs text-red-600 font-semibold whitespace-nowrap">CP</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline Column */}
          <div className="flex-shrink-0" style={{ width: `${timelineWidth}px` }}>
            {/* Timeline Header */}
            <div className="h-12 flex border-b border-gray-200 bg-white">
              {periods.map((period, idx) => (
                <div
                  key={idx}
                  className="border-r border-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium"
                  style={{ width: `${periodWidth}px` }}
                >
                  {period.label}
                </div>
              ))}
            </div>

            {/* Task Bars */}
            <div className="relative">
              {/* Today indicator line */}
              {todayPosition !== null && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                  style={{ left: `${todayPosition}px` }}
                >
                  <div className="absolute top-0 -left-6 bg-red-500 text-white text-xs px-2 py-0.5 rounded shadow-sm">
                    Today
                  </div>
                </div>
              )}

              {filteredTasks.map((task, idx) => {
                const style = getTaskStyle(task);
                const critical = isCritical(task.id);
                const bgColor = getStatusColor(task.status, critical);
                const progress = getTaskProgress(task);

                return (
                  <div key={task.id} className="relative">
                    {/* Background row */}
                    <div className="h-12 border-b border-gray-200 hover:bg-blue-50 relative">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex">
                        {periods.map((_, pIdx) => (
                          <div
                            key={pIdx}
                            className="border-r border-gray-100"
                            style={{ width: `${periodWidth}px` }}
                          />
                        ))}
                      </div>

                      {/* Task bar */}
                      <div
                        className={`absolute top-2 h-8 ${bgColor} rounded shadow-sm cursor-pointer hover:shadow-lg transition-all z-10 overflow-hidden`}
                        style={style}
                        onClick={() => onTaskClick(task)}
                        title={`${task.name}\n${task.planned_start_date} - ${task.planned_end_date}\nDuration: ${task.duration_days} days${task.status === 'in_progress' ? `\nProgress: ${progress}%` : ''}${critical ? '\n⚠️ CRITICAL PATH' : ''}`}
                      >
                        {/* Progress indicator for in-progress tasks */}
                        {task.status === 'in_progress' && progress > 0 && (
                          <div
                            className="absolute inset-0 bg-white/20"
                            style={{ width: `${progress}%` }}
                          />
                        )}

                        {/* Task name */}
                        <div className="relative px-3 py-1 flex items-center h-full">
                          <span className="text-xs text-white font-medium truncate drop-shadow-sm">
                            {task.name}
                          </span>
                          {task.status === 'in_progress' && (
                            <span className="ml-auto text-xs text-white font-semibold opacity-90 pl-2">
                              {progress}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing <span className="font-semibold text-gray-900">{filteredTasks.length}</span> of <span className="font-semibold text-gray-900">{hierarchicalTasks.length}</span> tasks
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-gray-500">Timeline:</span> {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div>
              <span className="text-gray-500">Duration:</span> <span className="font-semibold text-gray-900">{totalDays}</span> days
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
