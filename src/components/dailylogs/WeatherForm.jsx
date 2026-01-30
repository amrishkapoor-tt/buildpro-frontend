import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Cloud } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

/**
 * WeatherForm - Weather data entry and management for daily logs
 *
 * Features:
 * - Temperature high/low tracking
 * - Precipitation type and amount
 * - Wind speed and direction
 * - Weather and ground conditions
 * - Delay impact tracking
 */
const WeatherForm = ({ dailyLogId, token, readOnly = false, onUpdate }) => {
  const [weather, setWeather] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    temperature_high: '',
    temperature_low: '',
    temperature_unit: 'F',
    precipitation_type: '',
    precipitation_amount: '',
    wind_speed: '',
    wind_direction: '',
    weather_condition: 'clear',
    ground_condition: 'dry',
    caused_delay: false,
    delay_hours: '',
    work_impact: ''
  });

  useEffect(() => {
    loadWeather();
  }, [dailyLogId]);

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

  const loadWeather = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/daily-logs/${dailyLogId}/weather`);
      setWeather(data.weather || []);
    } catch (error) {
      console.error('Failed to load weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await apiCall(`/daily-logs/${dailyLogId}/weather`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadWeather();
      if (onUpdate) onUpdate();
    } catch (error) {
      window.alert(`Failed to save weather: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      temperature_high: '',
      temperature_low: '',
      temperature_unit: 'F',
      precipitation_type: '',
      precipitation_amount: '',
      wind_speed: '',
      wind_direction: '',
      weather_condition: 'clear',
      ground_condition: 'dry',
      caused_delay: false,
      delay_hours: '',
      work_impact: ''
    });
  };

  const handleEdit = (w) => {
    setFormData({
      temperature_high: w.temperature_high || '',
      temperature_low: w.temperature_low || '',
      temperature_unit: w.temperature_unit || 'F',
      precipitation_type: w.precipitation_type || '',
      precipitation_amount: w.precipitation_amount || '',
      wind_speed: w.wind_speed || '',
      wind_direction: w.wind_direction || '',
      weather_condition: w.weather_condition || 'clear',
      ground_condition: w.ground_condition || 'dry',
      caused_delay: w.caused_delay || false,
      delay_hours: w.delay_hours || '',
      work_impact: w.work_impact || ''
    });
    setEditingId(w.id);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading weather data...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Cloud className="w-5 h-5" />
          Weather Details
        </h4>
        {!readOnly && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Weather
          </button>
        )}
      </div>

      {/* Weather List */}
      {weather.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          No weather data recorded yet
        </div>
      ) : (
        <div className="space-y-3">
          {weather.map(w => (
            <div key={w.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 block mb-1">Temperature:</span>
                  <p className="font-medium text-gray-900">
                    {w.temperature_high}° - {w.temperature_low}° {w.temperature_unit}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 block mb-1">Conditions:</span>
                  <p className="font-medium text-gray-900 capitalize">{w.weather_condition}</p>
                </div>
                {w.wind_speed && (
                  <div>
                    <span className="text-gray-600 block mb-1">Wind:</span>
                    <p className="font-medium text-gray-900">
                      {w.wind_speed} mph {w.wind_direction ? `(${w.wind_direction})` : ''}
                    </p>
                  </div>
                )}
                {w.precipitation_amount && (
                  <div>
                    <span className="text-gray-600 block mb-1">Precipitation:</span>
                    <p className="font-medium text-gray-900 capitalize">
                      {w.precipitation_type}: {w.precipitation_amount}
                    </p>
                  </div>
                )}
              </div>

              {w.ground_condition && (
                <div className="mt-3 text-sm">
                  <span className="text-gray-600">Ground Condition: </span>
                  <span className="font-medium text-gray-900 capitalize">{w.ground_condition}</span>
                </div>
              )}

              {w.caused_delay && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium text-yellow-900 block mb-1">Weather Delay:</span>
                      <span className="text-sm text-yellow-800">
                        {w.delay_hours} hours - {w.work_impact}
                      </span>
                    </div>
                    {!readOnly && (
                      <button
                        onClick={() => handleEdit(w)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!w.caused_delay && !readOnly && (
                <div className="mt-3 text-right">
                  <button
                    onClick={() => handleEdit(w)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Weather' : 'Add Weather'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature Range
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <input
                      type="number"
                      placeholder="High"
                      value={formData.temperature_high}
                      onChange={(e) => setFormData({ ...formData, temperature_high: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">High</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Low"
                      value={formData.temperature_low}
                      onChange={(e) => setFormData({ ...formData, temperature_low: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">Low</span>
                  </div>
                  <div>
                    <select
                      value={formData.temperature_unit}
                      onChange={(e) => setFormData({ ...formData, temperature_unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="F">°F</option>
                      <option value="C">°C</option>
                    </select>
                    <span className="text-xs text-gray-500">Unit</span>
                  </div>
                </div>
              </div>

              {/* Weather Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weather Condition
                </label>
                <select
                  value={formData.weather_condition}
                  onChange={(e) => setFormData({ ...formData, weather_condition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="clear">Clear</option>
                  <option value="partly_cloudy">Partly Cloudy</option>
                  <option value="cloudy">Cloudy</option>
                  <option value="overcast">Overcast</option>
                  <option value="rainy">Rainy</option>
                  <option value="snowy">Snowy</option>
                  <option value="stormy">Stormy</option>
                  <option value="foggy">Foggy</option>
                </select>
              </div>

              {/* Precipitation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precipitation Type
                  </label>
                  <select
                    value={formData.precipitation_type}
                    onChange={(e) => setFormData({ ...formData, precipitation_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    <option value="rain">Rain</option>
                    <option value="snow">Snow</option>
                    <option value="sleet">Sleet</option>
                    <option value="hail">Hail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 0.5 inches"
                    value={formData.precipitation_amount}
                    onChange={(e) => setFormData({ ...formData, precipitation_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Wind */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wind Speed (mph)
                  </label>
                  <input
                    type="number"
                    placeholder="15"
                    value={formData.wind_speed}
                    onChange={(e) => setFormData({ ...formData, wind_speed: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wind Direction
                  </label>
                  <select
                    value={formData.wind_direction}
                    onChange={(e) => setFormData({ ...formData, wind_direction: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="N">North</option>
                    <option value="NE">Northeast</option>
                    <option value="E">East</option>
                    <option value="SE">Southeast</option>
                    <option value="S">South</option>
                    <option value="SW">Southwest</option>
                    <option value="W">West</option>
                    <option value="NW">Northwest</option>
                  </select>
                </div>
              </div>

              {/* Ground Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ground Condition
                </label>
                <select
                  value={formData.ground_condition}
                  onChange={(e) => setFormData({ ...formData, ground_condition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dry">Dry</option>
                  <option value="wet">Wet</option>
                  <option value="muddy">Muddy</option>
                  <option value="frozen">Frozen</option>
                  <option value="snow_covered">Snow Covered</option>
                </select>
              </div>

              {/* Delay Impact */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="caused_delay"
                    checked={formData.caused_delay}
                    onChange={(e) => setFormData({ ...formData, caused_delay: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="caused_delay" className="ml-2 text-sm font-medium text-gray-700">
                    Weather caused delay
                  </label>
                </div>

                {formData.caused_delay && (
                  <div className="space-y-3 ml-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delay Hours
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="4"
                        value={formData.delay_hours}
                        onChange={(e) => setFormData({ ...formData, delay_hours: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Work Impact
                      </label>
                      <textarea
                        placeholder="Describe how weather impacted work..."
                        value={formData.work_impact}
                        onChange={(e) => setFormData({ ...formData, work_impact: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingId ? 'Update' : 'Save'} Weather
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherForm;
