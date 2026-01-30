import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, Sun, Cloud, Lock } from 'lucide-react';
import DailyLogDetail from './dailylogs/DailyLogDetail';
import { usePermissions } from '../contexts/PermissionContext';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const DailyLogs = ({ projectId, token }) => {
  const { can } = usePermissions();
  const [dailyLogs, setDailyLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showNewLog, setShowNewLog] = useState(false);
  const [showLogDetail, setShowLogDetail] = useState(false);
  
  const [logForm, setLogForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    weather: { temperature: '', conditions: 'sunny', wind: '' },
    work_performed: '',
    delays: ''
  });

  useEffect(() => {
    if (projectId) loadDailyLogs();
  }, [projectId]);

  const apiCall = async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || 'Request failed');
    }
    return response.json();
  };

  const loadDailyLogs = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/projects/${projectId}/daily-logs`);
      setDailyLogs(data.daily_logs || []);
    } catch (error) {
      console.error('Failed to load daily logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();
    try {
      const data = await apiCall(`/projects/${projectId}/daily-logs`, {
        method: 'POST',
        body: JSON.stringify(logForm)
      });
      setDailyLogs([data.daily_log, ...dailyLogs]);
      setShowNewLog(false);
      setLogForm({
        log_date: new Date().toISOString().split('T')[0],
        weather: { temperature: '', conditions: 'sunny', wind: '' },
        work_performed: '',
        delays: ''
      });
    } catch (error) {
      alert('Failed to create daily log: ' + error.message);
    }
  };

  const loadLogDetail = async (logId) => {
    try {
      const data = await apiCall(`/daily-logs/${logId}`);
      setSelectedLog(data.daily_log);
      setShowLogDetail(true);
    } catch (error) {
      console.error('Failed to load log:', error);
    }
  };

  const handleLogUpdate = () => {
    loadDailyLogs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Daily Logs</h2>
        {can('create_log') && (
          <button
            onClick={() => setShowNewLog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            New Daily Log
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : dailyLogs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No daily logs yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dailyLogs.map(log => {
            const WeatherIcon = log.weather?.conditions === 'rainy' ? Cloud : Sun;
            return (
              <div
                key={log.id}
                onClick={() => loadLogDetail(log.id)}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">
                      {new Date(log.log_date).toLocaleDateString()}
                    </span>
                  </div>
                  {log.is_submitted ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Submitted
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                      Draft
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <WeatherIcon className="w-4 h-4" />
                    <span>{log.weather?.temperature || 'N/A'}</span>
                  </div>
                  <p className="text-xs line-clamp-2">{log.work_performed}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Log Modal */}
      {showNewLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Create Daily Log</h3>
              <button onClick={() => setShowNewLog(false)} type="button">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreateLog} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={logForm.log_date}
                  onChange={(e) => setLogForm({ ...logForm, log_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                  <input
                    value={logForm.weather.temperature}
                    onChange={(e) => setLogForm({ ...logForm, weather: { ...logForm.weather, temperature: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="72°F"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conditions</label>
                  <select
                    value={logForm.weather.conditions}
                    onChange={(e) => setLogForm({ ...logForm, weather: { ...logForm.weather, conditions: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sunny">Sunny</option>
                    <option value="cloudy">Cloudy</option>
                    <option value="rainy">Rainy</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Performed</label>
                <textarea
                  value={logForm.work_performed}
                  onChange={(e) => setLogForm({ ...logForm, work_performed: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe work completed today..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delays (if any)</label>
                <textarea
                  value={logForm.delays}
                  onChange={(e) => setLogForm({ ...logForm, delays: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any delays or issues encountered..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Log
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewLog(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {showLogDetail && selectedLog && (
        <DailyLogDetail
          log={selectedLog}
          onClose={() => setShowLogDetail(false)}
          onUpdate={handleLogUpdate}
          token={token}
          projectId={projectId}
        />
      )}
    </div>
  );
};

export default DailyLogs;