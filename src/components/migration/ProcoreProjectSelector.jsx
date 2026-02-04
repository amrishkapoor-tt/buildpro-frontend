import React, { useState, useEffect } from 'react';
import { Building2, Loader, AlertCircle, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

/**
 * ProcoreProjectSelector
 *
 * Shows list of Procore projects from connected account.
 * User selects which Procore project to import data from.
 */
const ProcoreProjectSelector = ({ token, connection, connectorType = 'procore_api', onBack, onSelectProject }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Determine endpoint based on connector type
  const getProjectsEndpoint = () => {
    if (connectorType === 'trunk_tools' || connectorType === 'acc') {
      return `${API_URL}/migration/connectors/${connectorType}/projects?connection_id=${connection.id}`;
    }
    return `${API_URL}/migration/procore/projects?connection_id=${connection.id}`;
  };

  // Determine display name based on connector type
  const getConnectorName = () => {
    const names = {
      'procore_api': 'Procore',
      'trunk_tools': 'TrunkTools',
      'acc': 'ACC/BIM360'
    };
    return names[connectorType] || 'External System';
  };

  useEffect(() => {
    loadProjects();
  }, [connection]);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(getProjectsEndpoint(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        const data = await response.json();
        if (data.needs_refresh) {
          setError(`Your ${getConnectorName()} connection has expired. Please refresh your token.`);
          return;
        }
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error(`Failed to load ${getConnectorName()} projects:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      const response = await fetch(
        `${API_URL}/migration/procore/connections/${connection.id}/refresh`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        window.alert('Token refreshed successfully!');
        loadProjects();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to refresh token');
      }
    } catch (err) {
      window.alert(`Token refresh failed: ${err.message}\n\nYou may need to reconnect your Procore account.`);
    }
  };

  const handleSelectProject = () => {
    if (selectedProject && onSelectProject) {
      onSelectProject(selectedProject);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Select {getConnectorName()} Project
        </h3>
        <p className="text-sm text-gray-600">
          Choose which {getConnectorName()} project to import data from.
        </p>
      </div>

      {/* Connection Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Connected to:</strong> {connection.display_name || connection.procore_company_name || getConnectorName()}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 mb-2">{error}</p>
              {error.includes('expired') && (
                <button
                  onClick={handleRefreshToken}
                  className="text-sm text-red-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Token
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Loading {getConnectorName()} projects...</p>
          </div>
        </div>
      )}

      {/* Projects List */}
      {!loading && !error && projects.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                selectedProject?.id === project.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <Building2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  selectedProject?.id === project.id ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">
                    {project.name}
                  </div>
                  {project.project_number && (
                    <div className="text-sm text-gray-500">
                      #{project.project_number}
                    </div>
                  )}
                  {project.address && (
                    <div className="text-sm text-gray-600 mt-1">
                      {project.address}
                      {project.city && `, ${project.city}`}
                      {project.state_code && `, ${project.state_code}`}
                    </div>
                  )}
                  {(project.start_date || project.completion_date) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {project.start_date && `Start: ${new Date(project.start_date).toLocaleDateString()}`}
                      {project.start_date && project.completion_date && ' • '}
                      {project.completion_date && `End: ${new Date(project.completion_date).toLocaleDateString()}`}
                    </div>
                  )}
                </div>
                {!project.active && (
                  <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                    Inactive
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && projects.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No projects found in this {getConnectorName()} account.</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleSelectProject}
          disabled={!selectedProject}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Next
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ProcoreProjectSelector;
