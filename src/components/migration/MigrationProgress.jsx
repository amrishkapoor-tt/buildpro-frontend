import React, { useState, useEffect } from 'react';
import { Loader, Check, AlertCircle, XCircle, Clock, ChevronRight, X, Pause, Play, RefreshCw } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

/**
 * MigrationProgress
 *
 * Real-time progress display for running migrations.
 * Polls backend every 2 seconds for updates.
 */
const MigrationProgress = ({ sessionId, token, onComplete, onClose }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadSession();

    // Start polling every 2 seconds
    const interval = setInterval(() => {
      loadSession();
    }, 2000);

    setPollingInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const response = await fetch(`${API_URL}/migration/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load migration status');
      }

      const data = await response.json();
      setSession(data.session);
      setLoading(false);

      // Stop polling if migration is complete or failed
      if (data.session.status === 'completed' || data.session.status === 'failed') {
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }

        if (data.session.status === 'completed' && onComplete) {
          onComplete(data.session);
        }
      }
    } catch (err) {
      console.error('Failed to load migration session:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-gray-500" />;
      case 'in_progress':
        return <Loader className="w-6 h-6 text-blue-600 animate-spin" />;
      case 'paused':
        return <Pause className="w-6 h-6 text-yellow-600" />;
      case 'completed':
        return <Check className="w-6 h-6 text-green-600" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = () => {
    if (!session || session.total_entities === 0) return 0;
    return Math.round((session.processed_entities / session.total_entities) * 100);
  };

  const formatEntityType = (type) => {
    const names = {
      'rfis': 'RFIs',
      'submittals': 'Submittals',
      'punch_items': 'Punch Items',
      'documents': 'Documents',
      'drawings': 'Drawings',
      'photos': 'Photos'
    };
    return names[type] || type;
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/migration/sessions/${sessionId}/pause`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to pause migration');
      }

      loadSession(); // Refresh status
    } catch (err) {
      alert(`Failed to pause: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/migration/sessions/${sessionId}/resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to resume migration');
      }

      loadSession(); // Refresh status
    } catch (err) {
      alert(`Failed to resume: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!confirm(`Retry ${session.failed_entities} failed entities?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/migration/sessions/${sessionId}/retry`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to retry failed entities');
      }

      const data = await response.json();
      alert(`Retry complete: ${data.successful} successful, ${data.still_failed} still failed`);
      loadSession(); // Refresh status
    } catch (err) {
      alert(`Failed to retry: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !session) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span>Error loading migration status: {error}</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const progress = getProgressPercentage();
  const isComplete = session.status === 'completed';
  const isFailed = session.status === 'failed';
  const isRunning = session.status === 'in_progress';
  const isPaused = session.status === 'paused';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon(session.status)}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Migration {isComplete ? 'Complete' : isFailed ? 'Failed' : isPaused ? 'Paused' : 'In Progress'}
            </h3>
            <p className="text-sm text-gray-600">
              {session.entity_types?.map(formatEntityType).join(', ')}
            </p>
          </div>
        </div>
        {(isComplete || isFailed) && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
          {session.status.replace('_', ' ').toUpperCase()}
        </span>
        {session.current_entity_type && isRunning && (
          <span className="text-sm text-gray-600">
            Processing {formatEntityType(session.current_entity_type)}...
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {session.total_entities > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {session.processed_entities} / {session.total_entities} entities
            </span>
            <span className="text-sm font-medium text-gray-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isComplete ? 'bg-green-600' : isFailed ? 'bg-red-600' : 'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">
            {session.successful_entities}
          </div>
          <div className="text-sm text-green-600">Successful</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-700">
            {session.failed_entities}
          </div>
          <div className="text-sm text-red-600">Failed</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700">
            {session.total_entities}
          </div>
          <div className="text-sm text-blue-600">Total</div>
        </div>
      </div>

      {/* Timeline */}
      {session.started_at && (
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Started: {new Date(session.started_at).toLocaleString()}</span>
          </div>
          {session.completed_at && (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Completed: {new Date(session.completed_at).toLocaleString()}</span>
            </div>
          )}
          {isRunning && (
            <div className="flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Running for {Math.round((Date.now() - new Date(session.started_at)) / 1000)}s</span>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {isComplete && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-900 mb-1">Migration Completed Successfully!</p>
              <p className="text-sm text-green-800">
                {session.successful_entities} entities imported successfully
                {session.failed_entities > 0 && ` with ${session.failed_entities} errors`}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Failure Message */}
      {isFailed && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 mb-1">Migration Failed</p>
              <p className="text-sm text-red-800">
                The migration encountered an error and could not complete.
                Check the error logs for details.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Paused State Message */}
      {isPaused && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Pause className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-yellow-900 mb-1">Migration Paused</p>
              <p className="text-sm text-yellow-800">
                The migration has been paused. Click Resume to continue from where it left off.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {/* Pause button (only when running) */}
        {isRunning && (
          <button
            onClick={handlePause}
            disabled={actionLoading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Pause className="w-4 h-4" />
            {actionLoading ? 'Pausing...' : 'Pause'}
          </button>
        )}

        {/* Resume button (only when paused) */}
        {isPaused && (
          <button
            onClick={handleResume}
            disabled={actionLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            {actionLoading ? 'Resuming...' : 'Resume'}
          </button>
        )}

        {/* Retry button (only when complete with failures) */}
        {(isComplete || isFailed) && session.failed_entities > 0 && (
          <button
            onClick={handleRetry}
            disabled={actionLoading}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {actionLoading ? 'Retrying...' : `Retry ${session.failed_entities} Failed`}
          </button>
        )}

        {/* Done button (when complete or failed) */}
        {(isComplete || isFailed || isPaused) && (
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isPaused ? 'Close' : 'Done'}
          </button>
        )}
      </div>

      {/* Loading State for Running Migration */}
      {isRunning && session.total_entities === 0 && (
        <div className="text-center py-6">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Fetching data from Procore...</p>
        </div>
      )}
    </div>
  );
};

export default MigrationProgress;
