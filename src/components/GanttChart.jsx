import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const GanttChart = ({ ganttData, tasks, criticalPath, onTaskClick }) => {
  const [scale, setScale] = useState('week'); // 'day', 'week', 'month'
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = useRef(null);

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

  // Parse dates
  const startDate = ganttData.start_date ? new Date(ganttData.start_date) : new Date();
  const endDate = ganttData.end_date ? new Date(ganttData.end_date) : new Date();

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
  const dayWidth = scale === 'day' ? 40 : scale === 'week' ? 80 : 120;

  // Calculate task position and width
  const getTaskStyle = (task) => {
    const taskStart = new Date(task.planned_start_date);
    const taskEnd = new Date(task.planned_end_date);

    const daysFromStart = Math.ceil((taskStart - startDate) / (1000 * 60 * 60 * 24));
    const taskDuration = Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24)) || 1;

    const left = (daysFromStart / totalDays) * 100;
    const width = (taskDuration / totalDays) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  // Check if task is on critical path
  const isCritical = (taskId) => {
    return criticalPath.some(cp => cp.task_id === taskId);
  };

  // Get status color
  const getStatusColor = (status, critical) => {
    if (critical) return 'bg-red-500';
    if (status === 'completed') return 'bg-green-500';
    if (status === 'in_progress') return 'bg-blue-500';
    return 'bg-gray-400';
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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Controls */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-2">View:</span>
          <button
            onClick={() => setScale('day')}
            className={`px-3 py-1 rounded text-sm ${
              scale === 'day' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setScale('week')}
            className={`px-3 py-1 rounded text-sm ${
              scale === 'week' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setScale('month')}
            className={`px-3 py-1 rounded text-sm ${
              scale === 'month' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-700">Critical Path</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-gray-700">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-700">Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 overflow-auto" ref={containerRef}>
        <div className="flex min-w-max">
          {/* Task Names Column */}
          <div className="w-80 flex-shrink-0 bg-gray-50 border-r border-gray-200">
            {/* Header */}
            <div className="h-12 flex items-center px-4 border-b border-gray-200 bg-white font-medium text-gray-900">
              Task Name
            </div>

            {/* Task Rows */}
            {hierarchicalTasks.map((task) => (
              <div
                key={task.id}
                className="h-12 flex items-center px-4 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                onClick={() => onTaskClick(task)}
                style={{ paddingLeft: `${task.level * 20 + 16}px` }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {task.children && task.children.length > 0 && (
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  <span className={`text-sm truncate ${task.children?.length > 0 ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                    {task.wbs_code && <span className="text-gray-400 mr-2">{task.wbs_code}</span>}
                    {task.name}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline Column */}
          <div className="flex-1 min-w-max">
            {/* Timeline Header */}
            <div className="h-12 flex border-b border-gray-200 bg-white">
              {periods.map((period, idx) => (
                <div
                  key={idx}
                  className="border-r border-gray-200 flex items-center justify-center text-xs text-gray-600"
                  style={{ width: `${dayWidth}px` }}
                >
                  {period.label}
                </div>
              ))}
            </div>

            {/* Task Bars */}
            <div className="relative">
              {hierarchicalTasks.map((task, idx) => {
                const style = getTaskStyle(task);
                const critical = isCritical(task.id);
                const bgColor = getStatusColor(task.status, critical);

                return (
                  <div key={task.id} className="relative">
                    {/* Background row */}
                    <div className="h-12 border-b border-gray-200 hover:bg-blue-50">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex">
                        {periods.map((_, pIdx) => (
                          <div
                            key={pIdx}
                            className="border-r border-gray-100"
                            style={{ width: `${dayWidth}px` }}
                          />
                        ))}
                      </div>

                      {/* Task bar */}
                      <div
                        className={`absolute top-2 h-8 ${bgColor} rounded flex items-center px-2 cursor-pointer hover:opacity-90 transition-opacity`}
                        style={style}
                        onClick={() => onTaskClick(task)}
                        title={`${task.name}\n${task.planned_start_date} - ${task.planned_end_date}\nDuration: ${task.duration_days} days${critical ? '\n⚠️ CRITICAL PATH' : ''}`}
                      >
                        <span className="text-xs text-white font-medium truncate">
                          {task.name}
                        </span>
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
            Showing {hierarchicalTasks.length} tasks from {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
          </div>
          <div>
            Duration: {totalDays} days
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
