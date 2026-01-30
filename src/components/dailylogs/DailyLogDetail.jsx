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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">Weather Details</h4>
                    {!dailyLog.is_submitted && can('create_log') && (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                        Add Weather
                      </button>
                    )}
                  </div>
                  {weather.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No weather data recorded yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {weather.map(w => (
                        <div key={w.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Temperature:</span>
                              <p className="font-medium">{w.temperature_high}° - {w.temperature_low}° {w.temperature_unit}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Conditions:</span>
                              <p className="font-medium">{w.weather_condition}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Wind:</span>
                              <p className="font-medium">{w.wind_speed} {w.wind_direction}</p>
                            </div>
                            {w.precipitation_amount && (
                              <div>
                                <span className="text-gray-600">Precipitation:</span>
                                <p className="font-medium">{w.precipitation_type}: {w.precipitation_amount}</p>
                              </div>
                            )}
                          </div>
                          {w.caused_delay && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                              <span className="font-medium text-yellow-900">Caused Delay: </span>
                              <span className="text-yellow-800">{w.delay_hours} hours - {w.work_impact}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Calls Tab */}
              {activeTab === 'calls' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">Phone Calls</h4>
                    {!dailyLog.is_submitted && can('create_log') && (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                        Add Call
                      </button>
                    )}
                  </div>
                  {calls.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No calls recorded</div>
                  ) : (
                    <div className="space-y-3">
                      {calls.map(call => (
                        <div key={call.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">{call.contact_name}</h5>
                              <p className="text-sm text-gray-600">{call.company_name}</p>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(call.call_time).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-700">{call.notes}</p>
                          {call.action_required && (
                            <div className="mt-2 text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                              Action Required
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Delays Tab */}
              {activeTab === 'delays' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">Delays</h4>
                    {!dailyLog.is_submitted && can('create_log') && (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                        Add Delay
                      </button>
                    )}
                  </div>
                  {delays.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No delays recorded</div>
                  ) : (
                    <div className="space-y-3">
                      {delays.map(delay => (
                        <div key={delay.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{delay.delay_type}</h5>
                            <span className="text-sm font-medium text-gray-700">{delay.hours_lost} hours</span>
                          </div>
                          <p className="text-sm text-gray-700">{delay.description}</p>
                          {delay.responsible_party && (
                            <p className="text-xs text-gray-600 mt-2">
                              Responsible: {delay.responsible_party}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Work Tab */}
              {activeTab === 'work' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">Work Activities</h4>
                    {!dailyLog.is_submitted && can('create_log') && (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                        Add Work
                      </button>
                    )}
                  </div>
                  {work.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No work activities recorded</div>
                  ) : (
                    <div className="space-y-3">
                      {work.map(w => (
                        <div key={w.id} className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900">{w.activity_name}</h5>
                          <p className="text-sm text-gray-700 mt-1">{w.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3 text-sm">
                            {w.location && (
                              <div>
                                <span className="text-gray-600">Location:</span>
                                <p className="font-medium">{w.location}</p>
                              </div>
                            )}
                            {w.crew_size && (
                              <div>
                                <span className="text-gray-600">Crew:</span>
                                <p className="font-medium">{w.crew_size} workers</p>
                              </div>
                            )}
                            {w.hours_worked && (
                              <div>
                                <span className="text-gray-600">Hours:</span>
                                <p className="font-medium">{w.hours_worked} hrs</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quantities Tab */}
              {activeTab === 'quantities' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">Material Quantities</h4>
                    {!dailyLog.is_submitted && can('create_log') && (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                        Add Quantity
                      </button>
                    )}
                  </div>
                  {quantities.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No quantities recorded</div>
                  ) : (
                    <div className="space-y-3">
                      {quantities.map(q => (
                        <div key={q.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">{q.material_type}</h5>
                              <p className="text-sm text-gray-600">{q.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{q.quantity} {q.unit}</p>
                              {q.transaction_type && (
                                <span className="text-xs text-gray-600">{q.transaction_type}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Waste Tab */}
              {activeTab === 'waste' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">Waste Disposal</h4>
                    {!dailyLog.is_submitted && can('create_log') && (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                        Add Waste
                      </button>
                    )}
                  </div>
                  {waste.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No waste recorded</div>
                  ) : (
                    <div className="space-y-3">
                      {waste.map(w => (
                        <div key={w.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">{w.material}</h5>
                              <p className="text-sm text-gray-600">{w.waste_type}</p>
                            </div>
                            <p className="font-semibold text-gray-900">{w.quantity} {w.unit}</p>
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            <p>Disposal: {w.disposal_method} at {w.disposal_location}</p>
                            {w.requires_documentation && (
                              <p className="text-orange-700 mt-1">Requires documentation</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Productivity Tab */}
              {activeTab === 'productivity' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">Productivity Metrics</h4>
                    {!dailyLog.is_submitted && can('create_log') && (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                        Add Productivity
                      </button>
                    )}
                  </div>
                  {productivity.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No productivity data recorded</div>
                  ) : (
                    <div className="space-y-3">
                      {productivity.map(p => (
                        <div key={p.id} className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900">{p.activity_name}</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                            {p.quantity_planned && (
                              <div>
                                <span className="text-gray-600">Planned:</span>
                                <p className="font-medium">{p.quantity_planned} {p.unit}</p>
                              </div>
                            )}
                            {p.quantity_actual && (
                              <div>
                                <span className="text-gray-600">Actual:</span>
                                <p className="font-medium">{p.quantity_actual} {p.unit}</p>
                              </div>
                            )}
                            {p.productivity_rate && (
                              <div>
                                <span className="text-gray-600">Rate:</span>
                                <p className="font-medium">{p.productivity_rate} {p.unit}/hr</p>
                              </div>
                            )}
                            {p.percent_complete && (
                              <div>
                                <span className="text-gray-600">Complete:</span>
                                <p className="font-medium">{p.percent_complete}%</p>
                              </div>
                            )}
                          </div>
                          {p.on_schedule === false && (
                            <div className="mt-2 text-xs text-red-700 bg-red-50 px-2 py-1 rounded">
                              Behind Schedule
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
