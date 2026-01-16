import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Link as LinkIcon, Save, AlertCircle } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const DEPENDENCY_TYPES = [
  { value: 'FS', label: 'Finish-to-Start (FS)', description: 'Successor starts after predecessor finishes' },
  { value: 'SS', label: 'Start-to-Start (SS)', description: 'Both tasks start at the same time' },
  { value: 'FF', label: 'Finish-to-Finish (FF)', description: 'Both tasks finish at the same time' },
  { value: 'SF', label: 'Start-to-Finish (SF)', description: 'Successor finishes when predecessor starts' }
];

const DependencyModal = ({ task, allTasks, token, onClose, onSave }) => {
  const [dependencies, setDependencies] = useState([]);
  const [newDependency, setNewDependency] = useState({
    predecessor_task_id: '',
    dependency_type: 'FS',
    lag_days: 0
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDependencies();
  }, [task.id]);

  const loadDependencies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/schedule/tasks/${task.id}/dependencies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load dependencies');

      const data = await response.json();
      setDependencies(data.dependencies || []);
    } catch (err) {
      console.error('Failed to load dependencies:', err);
      setError('Failed to load existing dependencies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDependency = async () => {
    if (!newDependency.predecessor_task_id) {
      setError('Please select a predecessor task');
      return;
    }

    // Check for circular dependency
    if (wouldCreateCircular(newDependency.predecessor_task_id)) {
      setError('This would create a circular dependency');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/schedule/tasks/${task.id}/dependencies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newDependency)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add dependency');
      }

      // Reset form
      setNewDependency({
        predecessor_task_id: '',
        dependency_type: 'FS',
        lag_days: 0
      });

      // Reload dependencies
      await loadDependencies();
    } catch (err) {
      console.error('Failed to add dependency:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDependency = async (dependencyId) => {
    if (!window.confirm('Are you sure you want to remove this dependency?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/schedule/dependencies/${dependencyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete dependency');

      await loadDependencies();
    } catch (err) {
      console.error('Failed to delete dependency:', err);
      setError('Failed to delete dependency');
    }
  };

  // Simple circular dependency check
  const wouldCreateCircular = (predecessorId) => {
    // Can't depend on yourself
    if (predecessorId === task.id) return true;

    // Check if predecessorId already depends on task (directly or indirectly)
    const visited = new Set();
    const checkPath = (taskId) => {
      if (taskId === task.id) return true;
      if (visited.has(taskId)) return false;
      visited.add(taskId);

      const taskDeps = dependencies.filter(d => d.successor_task_id === taskId);
      return taskDeps.some(d => checkPath(d.predecessor_task_id));
    };

    return checkPath(predecessorId);
  };

  // Get available tasks (exclude current task and its children)
  const getAvailableTasks = () => {
    return allTasks.filter(t => t.id !== task.id);
  };

  const availableTasks = getAvailableTasks();

  // Get task name by ID
  const getTaskName = (taskId) => {
    const t = allTasks.find(task => task.id === taskId);
    return t ? t.name : 'Unknown Task';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Task Dependencies</h3>
            <p className="text-sm text-gray-600 mt-1">{task.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Existing Dependencies */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Current Dependencies</h4>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading dependencies...
              </div>
            ) : dependencies.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                No dependencies yet. Add one below to link tasks.
              </div>
            ) : (
              <div className="space-y-2">
                {dependencies.map((dep) => (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {getTaskName(dep.predecessor_task_id)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {DEPENDENCY_TYPES.find(t => t.value === dep.dependency_type)?.label || dep.dependency_type}
                          {dep.lag_days !== 0 && (
                            <span className="ml-2">
                              Lag: {dep.lag_days > 0 ? '+' : ''}{dep.lag_days} days
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDependency(dep.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Dependency */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Add New Dependency</h4>
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Predecessor Task <span className="text-red-500">*</span>
                </label>
                <select
                  value={newDependency.predecessor_task_id}
                  onChange={(e) => setNewDependency({ ...newDependency, predecessor_task_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a task...</option>
                  {availableTasks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.wbs_code ? `${t.wbs_code} - ${t.name}` : t.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  This task will depend on the selected task
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dependency Type
                  </label>
                  <select
                    value={newDependency.dependency_type}
                    onChange={(e) => setNewDependency({ ...newDependency, dependency_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {DEPENDENCY_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    {DEPENDENCY_TYPES.find(t => t.value === newDependency.dependency_type)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lag (days)
                  </label>
                  <input
                    type="number"
                    value={newDependency.lag_days}
                    onChange={(e) => setNewDependency({ ...newDependency, lag_days: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Positive for delay, negative for overlap
                  </p>
                </div>
              </div>

              <button
                onClick={handleAddDependency}
                disabled={saving || !newDependency.predecessor_task_id}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                {saving ? 'Adding...' : 'Add Dependency'}
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Dependency Types Explained</h5>
            <div className="space-y-2 text-xs text-gray-600">
              {DEPENDENCY_TYPES.map(type => (
                <div key={type.value}>
                  <span className="font-medium">{type.label}:</span> {type.description}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() => {
              onSave();
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DependencyModal;
