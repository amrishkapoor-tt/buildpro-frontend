import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Lock,
  Cloud,
  Phone,
  Clock,
  Users,
  Package,
  Trash2,
  TrendingUp,
  Info
} from 'lucide-react';
import LinkedDocuments from '../LinkedDocuments';
import { usePermissions } from '../../contexts/PermissionContext';
import WeatherForm from './WeatherForm';
import CallsForm from './CallsForm';
import DelaysForm from './DelaysForm';
import WorkForm from './WorkForm';
import QuantitiesForm from './QuantitiesForm';
import WasteForm from './WasteForm';
import ProductivityForm from './ProductivityForm';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

/**
 * DailyLogDetail - Enhanced daily log viewer with child entities
 *
 * Displays daily log with tabbed navigation for:
 * - Summary (basic info + work performed)
 * - Weather (detailed weather tracking)
 * - Calls (phone logs)
 * - Delays (structured delay tracking)
 * - Work (activities performed)
 * - Quantities (materials)
 * - Waste (disposal records)
 * - Productivity (crew metrics)
 * - Documents (linked files)
 */
const DailyLogDetail = ({ log, onClose, onUpdate, token, projectId }) => {
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState('summary');
  const [dailyLog, setDailyLog] = useState(log);
  const [loading, setLoading] = useState(false);

  // Child entity data
  const [weather, setWeather] = useState([]);
  const [calls, setCalls] = useState([]);
  const [delays, setDelays] = useState([]);
  const [work, setWork] = useState([]);
  const [quantities, setQuantities] = useState([]);
  const [waste, setWaste] = useState([]);
  const [productivity, setProductivity] = useState([]);

  useEffect(() => {
    if (activeTab !== 'summary' && activeTab !== 'documents') {
      loadTabData(activeTab);
    }
  }, [activeTab]);

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

  const loadTabData = async (tab) => {
    setLoading(true);
    try {
      let endpoint = '';
      let dataKey = '';

      switch (tab) {
        case 'weather':
          endpoint = `/daily-logs/${dailyLog.id}/weather`;
          dataKey = 'weather';
          break;
        case 'calls':
          endpoint = `/daily-logs/${dailyLog.id}/calls`;
          dataKey = 'calls';
          break;
        case 'delays':
          endpoint = `/daily-logs/${dailyLog.id}/delays`;
          dataKey = 'delays';
          break;
        case 'work':
          endpoint = `/daily-logs/${dailyLog.id}/work`;
          dataKey = 'work';
          break;
        case 'quantities':
          endpoint = `/daily-logs/${dailyLog.id}/quantities`;
          dataKey = 'quantities';
          break;
        case 'waste':
          endpoint = `/daily-logs/${dailyLog.id}/waste`;
          dataKey = 'waste';
          break;
        case 'productivity':
          endpoint = `/daily-logs/${dailyLog.id}/productivity`;
          dataKey = 'productivity';
          break;
        default:
          return;
      }

      const data = await apiCall(endpoint);

      // Update the corresponding state
      switch (tab) {
        case 'weather':
          setWeather(data[dataKey] || []);
          break;
        case 'calls':
          setCalls(data[dataKey] || []);
          break;
        case 'delays':
          setDelays(data[dataKey] || []);
          break;
        case 'work':
          setWork(data[dataKey] || []);
          break;
        case 'quantities':
          setQuantities(data[dataKey] || []);
          break;
        case 'waste':
          setWaste(data[dataKey] || []);
          break;
        case 'productivity':
          setProductivity(data[dataKey] || []);
          break;
      }
    } catch (error) {
      console.error(`Failed to load ${tab}:`, error);
      window.alert(`Failed to load ${tab}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLog = async () => {
    if (!window.confirm('Submit this log? It will become read-only.')) return;

    try {
      await apiCall(`/daily-logs/${dailyLog.id}/submit`, {
        method: 'POST'
      });

      if (onUpdate) {
        onUpdate();
      }
      onClose();
    } catch (error) {
      window.alert(`Failed to submit log: ${error.message}`);
    }
  };

  const tabs = [
    { id: 'summary', label: 'Summary', icon: Info },
    { id: 'weather', label: 'Weather', icon: Cloud },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'delays', label: 'Delays', icon: Clock },
    { id: 'work', label: 'Work', icon: Users },
    { id: 'quantities', label: 'Quantities', icon: Package },
    { id: 'waste', label: 'Waste', icon: Trash2 },
    { id: 'productivity', label: 'Productivity', icon: TrendingUp },
    { id: 'documents', label: 'Documents', icon: Info }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">
              Daily Log - {new Date(dailyLog.log_date || dailyLog.date).toLocaleDateString()}
            </h3>
            {dailyLog.is_submitted ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded mt-2">
                <Lock className="w-3 h-3" />
                Submitted
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded mt-2">
                Draft
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!dailyLog.is_submitted && can('create_log') && (
              <button
                onClick={handleSubmitLog}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Send className="w-4 h-4" />
                Submit & Lock
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex px-6 gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <>
              {/* Summary Tab */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Weather</h4>
                    <p className="text-sm text-gray-700">
                      {dailyLog.weather?.temperature || 'N/A'} • {dailyLog.weather?.conditions || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Work Performed</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {dailyLog.work_performed || 'No work recorded'}
                    </p>
                  </div>
                  {dailyLog.delays && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Delays</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{dailyLog.delays}</p>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 pt-4">
                    Created by {dailyLog.creator_name || 'Unknown'} on{' '}
                    {new Date(dailyLog.created_at).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Weather Tab */}
              {activeTab === 'weather' && (
                <WeatherForm
                  dailyLogId={dailyLog.id}
                  token={token}
                  readOnly={dailyLog.is_submitted}
                  onUpdate={loadTabData}
                />
              )}

              {/* Calls Tab */}
              {activeTab === 'calls' && (
                <CallsForm
                  dailyLogId={dailyLog.id}
                  token={token}
                  readOnly={dailyLog.is_submitted}
                  onUpdate={loadTabData}
                />
              )}

              {/* Delays Tab */}
              {activeTab === 'delays' && (
                <DelaysForm
                  dailyLogId={dailyLog.id}
                  token={token}
                  readOnly={dailyLog.is_submitted}
                  onUpdate={loadTabData}
                />
              )}

              {/* Work Tab */}
              {activeTab === 'work' && (
                <WorkForm
                  dailyLogId={dailyLog.id}
                  token={token}
                  readOnly={dailyLog.is_submitted}
                  onUpdate={loadTabData}
                />
              )}

              {/* Quantities Tab */}
              {activeTab === 'quantities' && (
                <QuantitiesForm
                  dailyLogId={dailyLog.id}
                  token={token}
                  readOnly={dailyLog.is_submitted}
                  onUpdate={loadTabData}
                />
              )}

              {/* Waste Tab */}
              {activeTab === 'waste' && (
                <WasteForm
                  dailyLogId={dailyLog.id}
                  token={token}
                  readOnly={dailyLog.is_submitted}
                  onUpdate={loadTabData}
                />
              )}

              {/* Productivity Tab */}
              {activeTab === 'productivity' && (
                <ProductivityForm
                  dailyLogId={dailyLog.id}
                  token={token}
                  readOnly={dailyLog.is_submitted}
                  onUpdate={loadTabData}
                />
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <LinkedDocuments
                  entityType="daily_log"
                  entityId={dailyLog.id}
                  token={token}
                  projectId={projectId}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyLogDetail;
