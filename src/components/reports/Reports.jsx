import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  AlertTriangle,
  ClipboardList,
  TrendingUp,
  Users,
  Package,
  Trash2,
  Clock
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

/**
 * Reports - Generate and export project reports
 *
 * Features:
 * - Daily logs reports
 * - Safety violations reports
 * - Productivity reports
 * - Material tracking reports
 * - Custom date range selection
 * - Export to CSV/Excel format
 */
const Reports = ({ projectId, token }) => {
  const [generating, setGenerating] = useState(false);
  const [filters, setFilters] = useState({
    report_type: 'daily_logs',
    date_from: '',
    date_to: '',
    format: 'csv'
  });

  const reportTypes = [
    {
      id: 'daily_logs',
      name: 'Daily Logs Report',
      description: 'Complete daily logs with weather, work performed, and delays',
      icon: ClipboardList,
      color: 'blue'
    },
    {
      id: 'daily_logs_detailed',
      name: 'Daily Logs Detailed Report',
      description: 'Includes all child entities: weather, calls, delays, work, quantities, waste, productivity',
      icon: FileText,
      color: 'indigo'
    },
    {
      id: 'safety_violations',
      name: 'Safety Violations Report',
      description: 'All safety violations with status, severity, and corrective actions',
      icon: AlertTriangle,
      color: 'orange'
    },
    {
      id: 'productivity',
      name: 'Productivity Report',
      description: 'Productivity metrics with planned vs actual performance',
      icon: TrendingUp,
      color: 'green'
    },
    {
      id: 'materials',
      name: 'Materials Report',
      description: 'Material quantities received, installed, and wasted',
      icon: Package,
      color: 'purple'
    },
    {
      id: 'delays',
      name: 'Delays Report',
      description: 'All project delays with hours lost and cost impact',
      icon: Clock,
      color: 'red'
    },
    {
      id: 'waste',
      name: 'Waste Management Report',
      description: 'Waste disposal tracking with compliance documentation',
      icon: Trash2,
      color: 'yellow'
    },
    {
      id: 'workforce',
      name: 'Workforce Report',
      description: 'Crew sizes, hours worked, and contractor activity',
      icon: Users,
      color: 'teal'
    }
  ];

  const handleGenerateReport = async () => {
    if (!filters.date_from || !filters.date_to) {
      window.alert('Please select a date range');
      return;
    }

    setGenerating(true);
    try {
      // In a real implementation, this would call a backend endpoint that generates the report
      // For now, we'll create a simple CSV export using the existing data

      const params = new URLSearchParams({
        date_from: filters.date_from,
        date_to: filters.date_to
      });

      let data;
      let filename;

      switch (filters.report_type) {
        case 'daily_logs':
          data = await fetchDailyLogs(params);
          filename = `daily_logs_${filters.date_from}_to_${filters.date_to}.csv`;
          break;
        case 'daily_logs_detailed':
          data = await fetchDailyLogsDetailed(params);
          filename = `daily_logs_detailed_${filters.date_from}_to_${filters.date_to}.csv`;
          break;
        case 'safety_violations':
          data = await fetchSafetyViolations(params);
          filename = `safety_violations_${filters.date_from}_to_${filters.date_to}.csv`;
          break;
        case 'productivity':
          data = await fetchProductivity(params);
          filename = `productivity_${filters.date_from}_to_${filters.date_to}.csv`;
          break;
        case 'materials':
          data = await fetchMaterials(params);
          filename = `materials_${filters.date_from}_to_${filters.date_to}.csv`;
          break;
        case 'delays':
          data = await fetchDelays(params);
          filename = `delays_${filters.date_from}_to_${filters.date_to}.csv`;
          break;
        case 'waste':
          data = await fetchWaste(params);
          filename = `waste_${filters.date_from}_to_${filters.date_to}.csv`;
          break;
        case 'workforce':
          data = await fetchWorkforce(params);
          filename = `workforce_${filters.date_from}_to_${filters.date_to}.csv`;
          break;
        default:
          throw new Error('Unknown report type');
      }

      // Download the CSV
      downloadCSV(data, filename);
      window.alert('Report generated successfully!');
    } catch (error) {
      window.alert(`Failed to generate report: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const apiCall = async (endpoint) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    return response.json();
  };

  const fetchDailyLogs = async (params) => {
    const data = await apiCall(`/projects/${projectId}/daily-logs?${params}`);
    const logs = data.daily_logs || [];

    const csv = [
      ['Date', 'Weather', 'Work Performed', 'Delays', 'Status', 'Created By'].join(','),
      ...logs.map(log => [
        log.log_date || log.date,
        `"${log.weather?.temperature || ''} ${log.weather?.conditions || ''}"`,
        `"${(log.work_performed || '').replace(/"/g, '""')}"`,
        `"${(log.delays || '').replace(/"/g, '""')}"`,
        log.is_submitted ? 'Submitted' : 'Draft',
        log.creator_name || ''
      ].join(','))
    ].join('\n');

    return csv;
  };

  const fetchDailyLogsDetailed = async (params) => {
    // This would aggregate data from all child entities
    return 'Detailed daily logs report (implementation pending)\n';
  };

  const fetchSafetyViolations = async (params) => {
    const data = await apiCall(`/projects/${projectId}/safety-violations?${params}`);
    const violations = data.violations || [];

    const csv = [
      ['Date', 'Type', 'Severity', 'Description', 'Location', 'Status', 'Fine Amount', 'OSHA Recordable'].join(','),
      ...violations.map(v => [
        v.issued_at ? new Date(v.issued_at).toLocaleDateString() : '',
        v.violation_type,
        v.severity || '',
        `"${(v.description || '').replace(/"/g, '""')}"`,
        `"${(v.location || '').replace(/"/g, '""')}"`,
        v.status,
        v.fine_amount || '0',
        v.osha_recordable ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    return csv;
  };

  const fetchProductivity = async (params) => {
    return 'Productivity report (implementation pending)\n';
  };

  const fetchMaterials = async (params) => {
    return 'Materials report (implementation pending)\n';
  };

  const fetchDelays = async (params) => {
    return 'Delays report (implementation pending)\n';
  };

  const fetchWaste = async (params) => {
    return 'Waste report (implementation pending)\n';
  };

  const fetchWorkforce = async (params) => {
    return 'Workforce report (implementation pending)\n';
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedReport = reportTypes.find(r => r.id === filters.report_type);
  const IconComponent = selectedReport?.icon || FileText;
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    teal: 'bg-teal-100 text-teal-600'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-7 h-7 text-blue-600" />
          Reports
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Generate and export project reports for analysis and compliance
        </p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Configure Report
        </h3>

        <div className="space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Report Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {reportTypes.map(report => (
                <button
                  key={report.id}
                  onClick={() => setFilters({ ...filters, report_type: report.id })}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    filters.report_type === report.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${colorClasses[report.color]} flex items-center justify-center mb-3`}>
                    <report.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">{report.name}</h4>
                  <p className="text-xs text-gray-600">{report.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={filters.format === 'csv'}
                  onChange={(e) => setFilters({ ...filters, format: e.target.value })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">CSV (Excel Compatible)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pdf"
                  checked={filters.format === 'pdf'}
                  onChange={(e) => setFilters({ ...filters, format: e.target.value })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  disabled
                />
                <span className="ml-2 text-sm text-gray-400">PDF (Coming Soon)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Report Preview */}
      {selectedReport && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg ${colorClasses[selectedReport.color]} flex items-center justify-center flex-shrink-0`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedReport.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{selectedReport.description}</p>

              {filters.date_from && filters.date_to && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Report period: <strong>{filters.date_from}</strong> to <strong>{filters.date_to}</strong>
                  </p>
                </div>
              )}

              <button
                onClick={handleGenerateReport}
                disabled={generating || !filters.date_from || !filters.date_to}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Download className="w-5 h-5" />
                {generating ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">About Reports</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Reports are generated based on your selected date range</li>
          <li>CSV files can be opened in Excel, Google Sheets, or any spreadsheet software</li>
          <li>All data is exported in accordance with your project permissions</li>
          <li>Reports include all relevant data within the specified time period</li>
        </ul>
      </div>
    </div>
  );
};

export default Reports;
