import React, { useState, useEffect } from 'react';
import { History, Check, XCircle, Clock, Pause, ChevronRight, RefreshCw } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

/**
 * MigrationHistory
 *
 * Displays past migrations for a project with ability to view details and retry
 */
const MigrationHistory = ({ projectId, token, onViewDetails }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSessions();
  }, [projectId]);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/migration/sessions?project_id=${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load migration history');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to load migration history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'in_progress':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'paused':
        return <Pause className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'paused':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatSourceType = (type) => {
    const types = {
      'procore_api': 'Procore API',
      'csv': 'CSV Import',
      'excel': 'Excel Import'
    };
    return types[type] || type;
  };

  const formatEntityTypes = (types) => {
    if (!types || types.length === 0) return 'Unknown';

    const names = {
      'rfis': 'RFIs',
      'submittals': 'Submittals',
      'punch_items': 'Punch Items',
      'documents': 'Documents',
      'drawings': 'Drawings',
      'photos': 'Photos'
    };

    return types.map(t => names[t] || t).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <XCircle className="w-5 h-5" />
          <span>Error loading history: {error}</span>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No migration history yet</p>
        <p className="text-sm text-gray-500 mt-1">Migrations will appear here after you import data</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Migration History</h3>
        <button
          onClick={loadSessions}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {sessions.map(session => (
          <button
            key={session.id}
            onClick={() => onViewDetails && onViewDetails(session.id)}
            className={`w-full p-4 border rounded-lg text-left transition-colors hover:shadow-md ${getStatusColor(session.status)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(session.status)}
                  <div>
                    <div className="font-semibold">
                      {formatSourceType(session.source_type)}
                    </div>
                    <div className="text-sm opacity-80">
                      {formatEntityTypes(session.entity_types)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm mt-2">
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>{session.successful_entities || 0} success</span>
                  </div>
                  {session.failed_entities > 0 && (
                    <div className="flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>{session.failed_entities} failed</span>
                    </div>
                  )}
                  <div className="text-gray-600">
                    {new Date(session.created_at).toLocaleDateString()} {new Date(session.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MigrationHistory;
