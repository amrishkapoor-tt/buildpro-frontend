import React, { useState, useEffect, useRef } from 'react';
import { Maximize2 } from 'lucide-react';

const GanttChart = ({ ganttData, tasks, criticalPath, onTaskClick }) => {
  const [scale, setScale] = useState('week'); // 'day', 'week', 'month'
  const [centerDate, setCenterDate] = useState(null); // Date to center view on
  const [statusFilter, setStatusFilter] = useState({
    critical: true,
    in_progress: true,
    completed: true,
    not_started: true
  });
  const containerRef = useRef(null);

  // Initialize center date to today
  useEffect(() => {
    if (!centerDate) {
      setCenterDate(new Date());
    }
  }, []);

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

  // Calculate visible date range based on scale, centered on centerDate (or today by default)
  const center = centerDate || new Date();
  let startDate, endDate;

  if (scale === 'day') {
    // Show 30 days centered on center date
    startDate = new Date(center);
    startDate.setDate(startDate.getDate() - 15);
    endDate = new Date(center);
    endDate.setDate(endDate.getDate() + 15);
  } else if (scale === 'week') {
    // Show 16 weeks centered on center date
    startDate = new Date(center);
    startDate.setDate(startDate.getDate() - 56); // 8 weeks before
    endDate = new Date(center);
    endDate.setDate(endDate.getDate() + 56); // 8 weeks after
  } else {
    // Show 6 months centered on center date
    // For month view, normalize to full month boundaries
    startDate = new Date(center);
    startDate.setMonth(startDate.getMonth() - 3);
    startDate.setDate(1); // Start from 1st of the month

    endDate = new Date(center);
    endDate.setMonth(endDate.getMonth() + 3 + 1); // Go to next month
    endDate.setDate(0); // Last day of previous month
  }

  // Normalize dates to start of day
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  // Calculate total days in visible range
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;

  // Generate time periods based on scale
  const generateTimePeriods = () => {
    const periods = [];
    let currentDate = new Date(startDate);

    if (scale === 'day') {
      while (currentDate <= endDate) {
        periods.push({
          label: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          date: new Date(currentDate),
          days: 1
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (scale === 'week') {
      while (currentDate <= endDate) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const actualWeekEnd = weekEnd > endDate ? endDate : weekEnd;
        const daysInWeek = Math.ceil((actualWeekEnd - weekStart) / (1000 * 60 * 60 * 24)) + 1;

        periods.push({
          label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          date: new Date(currentDate),
          days: daysInWeek
        });
        currentDate.setDate(currentDate.getDate() + 7);
      }
    } else {
      // Month view - always start from 1st of each month
      while (currentDate <= endDate) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const actualMonthEnd = monthEnd > endDate ? endDate : monthEnd;
        const daysInMonth = Math.ceil((actualMonthEnd - monthStart) / (1000 * 60 * 60 * 24)) + 1;

        periods.push({
          label: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          date: new Date(monthStart),
          days: daysInMonth
        });

        // Move to first day of next month
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      }
    }

    return periods;
  };

  const periods = generateTimePeriods();

  // Fixed timeline width - no horizontal scrolling, fit to container
  // Use container width if available, otherwise use a reasonable default
  const timelineWidth = containerRef.current?.offsetWidth || 1200;
  const taskNameColumnWidth = 320;
  const availableTimelineWidth = Math.max(timelineWidth - taskNameColumnWidth, 800);

  // Calculate pixels per day to fill available width
  const pixelsPerDay = availableTimelineWidth / totalDays;

  // Calculate width for each period based on its actual days
  const getPeriodWidth = (period) => {
    return period.days * pixelsPerDay;
  };

  // Filter tasks to only show those that overlap with visible date range
  const getVisibleTasks = () => {
    return tasks.filter(task => {
      const taskStart = new Date(task.planned_start_date);
      const taskEnd = new Date(task.planned_end_date);

      // Task is visible if it overlaps with [startDate, endDate]
      return taskStart <= endDate && taskEnd >= startDate;
    });
  };

  const visibleTasks = getVisibleTasks();

  // Calculate task position and width, clipped to visible boundaries
  const getTaskStyle = (task) => {
    const taskStart = new Date(task.planned_start_date);
    const taskEnd = new Date(task.planned_end_date);

    // Clip task to visible boundaries
    const visibleStart = taskStart < startDate ? startDate : taskStart;
    const visibleEnd = taskEnd > endDate ? endDate : taskEnd;

    // Calculate days from visible start
    const daysFromStart = Math.max(0, Math.ceil((visibleStart - startDate) / (1000 * 60 * 60 * 24)));

    // Calculate visible duration in days
    const visibleDuration = Math.max(1, Math.ceil((visibleEnd - visibleStart) / (1000 * 60 * 60 * 24)));

    // Convert to pixels
    const leftPx = daysFromStart * pixelsPerDay;
    const widthPx = Math.max(20, visibleDuration * pixelsPerDay);

    return {
      left: `${leftPx}px`,
      width: `${widthPx}px`,
      isClippedStart: taskStart < startDate,
      isClippedEnd: taskEnd > endDate
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
    const taskMap = new Map(visibleTasks.map(t => [t.id, { ...t, children: [] }]));
    const rootTasks = [];

    visibleTasks.forEach(task => {
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

  const toggleStatusFilter = (status) => {
    setStatusFilter(prev => ({ ...prev, [status]: !prev[status] }));
  };

  // Go to today
  const goToToday = () => {
    setCenterDate(new Date());
  };

  // Check if today is in current view
  const isTodayInView = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today >= startDate && today <= endDate;
  };

  // Calculate today's position for indicator line
  const getTodayPosition = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const normalizedStart = new Date(startDate);
    normalizedStart.setHours(0, 0, 0, 0);

    const normalizedEnd = new Date(endDate);
    normalizedEnd.setHours(23, 59, 59, 999);

    if (today < normalizedStart || today > normalizedEnd) {
      return null;
    }

    const daysFromStart = Math.ceil((today - normalizedStart) / (1000 * 60 * 60 * 24));
    return daysFromStart * pixelsPerDay;
  };

  const todayPosition = getTodayPosition();

  return (
    <div className="h-full flex flex-col bg-white" ref={containerRef}>
      {/* Controls */}
      <div className="flex flex-col gap-3 px-6 py-3 border-b border-gray-200 bg-gray-50">
        {/* Top row: Scale and Today */}
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
              onClick={goToToday}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                isTodayInView()
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Today
            </button>
          </div>
        </div>

        {/* Bottom row: Filters */}
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

      {/* Gantt Chart - No horizontal scroll */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
        <div className="flex min-h-full">
          {/* Task Names Column */}
          <div className="flex-shrink-0 bg-gray-50 border-r-2 border-gray-300 sticky left-0 z-30" style={{ width: `${taskNameColumnWidth}px` }}>
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

          {/* Timeline Column - Fixed width, no scroll */}
          <div className="flex-shrink-0" style={{ width: `${availableTimelineWidth}px` }}>
            {/* Timeline Header */}
            <div className="h-12 flex border-b border-gray-200 bg-white">
              {periods.map((period, idx) => (
                <div
                  key={idx}
                  className="border-r border-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium"
                  style={{ width: `${getPeriodWidth(period)}px` }}
                >
                  {period.label}
                </div>
              ))}
            </div>

            {/* Task Bars */}
            <div className="relative" style={{ width: `${availableTimelineWidth}px` }}>
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

              {filteredTasks.map((task) => {
                const style = getTaskStyle(task);
                const critical = isCritical(task.id);
                const bgColor = getStatusColor(task.status, critical);
                const progress = getTaskProgress(task);

                return (
                  <div key={task.id} className="relative" style={{ width: `${availableTimelineWidth}px` }}>
                    {/* Background row */}
                    <div className="h-12 border-b border-gray-200 hover:bg-blue-50 relative" style={{ width: `${availableTimelineWidth}px` }}>
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex">
                        {periods.map((period, pIdx) => (
                          <div
                            key={pIdx}
                            className="border-r border-gray-100"
                            style={{ width: `${getPeriodWidth(period)}px` }}
                          />
                        ))}
                      </div>

                      {/* Task bar */}
                      <div
                        className={`absolute top-2 h-8 ${bgColor} rounded shadow-sm cursor-pointer hover:shadow-lg transition-all z-10 overflow-hidden ${
                          style.isClippedStart ? 'rounded-l-none' : ''
                        } ${style.isClippedEnd ? 'rounded-r-none' : ''}`}
                        style={{ left: style.left, width: style.width }}
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
            Showing <span className="font-semibold text-gray-900">{filteredTasks.length}</span> of <span className="font-semibold text-gray-900">{visibleTasks.length}</span> tasks in view
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-gray-500">View Range:</span> {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
