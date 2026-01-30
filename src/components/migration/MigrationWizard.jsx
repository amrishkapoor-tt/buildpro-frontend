import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Upload, Database, History } from 'lucide-react';
import CSVUploadModal from './CSVUploadModal';
import ProcoreConnectionModal from './ProcoreConnectionModal';
import ProcoreProjectSelector from './ProcoreProjectSelector';
import EntityTypeSelector from './EntityTypeSelector';
import MigrationProgress from './MigrationProgress';
import MigrationHistory from './MigrationHistory';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

/**
 * MigrationWizard
 *
 * Multi-step wizard for importing data from Procore or CSV/Excel files.
 *
 * Steps:
 * 1. Choose source (CSV or Procore)
 * 2a. CSV: Upload and map
 * 2b. Procore: Connect account
 * 3. Procore: Select project
 * 4. Procore: Select entity types
 * 5. Execute migration
 */
const MigrationWizard = ({ projectId, token, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState(null); // 'csv' or 'procore_api'
  const [sessionId, setSessionId] = useState(null);
  const [procoreConnection, setProcoreConnection] = useState(null);
  const [procoreProject, setProcoreProject] = useState(null);
  const [selectedEntityTypes, setSelectedEntityTypes] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleSourceSelect = (type) => {
    setSourceType(type);
    setStep(2);
  };

  const handleProcoreConnected = (connection) => {
    setProcoreConnection(connection);
    setStep(3); // Move to project selection
  };

  const handleProjectSelected = (project) => {
    setProcoreProject(project);
    setStep(4); // Move to entity type selection
  };

  const handleEntityTypesSelected = async (entityTypes, options) => {
    setSelectedEntityTypes(entityTypes);

    try {
      // Start migration
      const response = await fetch(`${API_URL}/migration/procore/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          procore_connection_id: procoreConnection.id,
          procore_project_id: procoreProject.id,
          entity_types: entityTypes,
          options: options
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start migration');
      }

      const data = await response.json();
      setSessionId(data.session.id);
      setStep(5); // Show progress
    } catch (error) {
      window.alert(`Failed to start migration: ${error.message}`);
    }
  };

  const handleMigrationComplete = (session) => {
    if (onComplete) {
      onComplete(session);
    }
  };

  const handleCSVComplete = (session) => {
    setSessionId(session.id);
    if (onComplete) {
      onComplete(session);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {showHistory ? 'Migration History' : 'Import Data'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {showHistory ? 'View past migrations' : 'Import data from Procore or CSV/Excel files'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!showHistory && step === 1 && (
              <button
                onClick={() => setShowHistory(true)}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                title="View Migration History"
              >
                <History className="w-5 h-5" />
                <span className="text-sm">History</span>
              </button>
            )}
            {showHistory && (
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm">Back to Import</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Migration History View */}
          {showHistory && (
            <MigrationHistory
              projectId={projectId}
              token={token}
              onViewDetails={(id) => {
                setSessionId(id);
                setStep(5);
                setShowHistory(false);
              }}
            />
          )}

          {!showHistory && step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Choose Data Source
              </h3>

              {/* CSV/Excel Option */}
              <button
                onClick={() => handleSourceSelect('csv')}
                className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Upload className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">
                      Upload CSV/Excel File
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Import data from CSV or Excel spreadsheets. Best for bulk imports of RFIs, submittals, punch items, and more.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Supports CSV and XLSX formats</li>
                      <li>• Auto-detects headers and suggests field mappings</li>
                      <li>• Validates data before import</li>
                      <li>• Download templates for each entity type</li>
                    </ul>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 mt-6" />
                </div>
              </button>

              {/* Procore Option */}
              <button
                onClick={() => handleSourceSelect('procore_api')}
                className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">
                      Connect to Procore
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Direct integration with Procore API. Automatically pull projects, RFIs, submittals, documents, and more.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• One-time OAuth connection</li>
                      <li>• Select specific data types to migrate</li>
                      <li>• Preserves relationships and file attachments</li>
                      <li>• Preview data before importing</li>
                    </ul>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 mt-6" />
                </div>
              </button>
            </div>
          )}

          {step === 2 && sourceType === 'csv' && (
            <CSVUploadModal
              projectId={projectId}
              token={token}
              onClose={() => setStep(1)}
              onComplete={handleCSVComplete}
            />
          )}

          {step === 2 && sourceType === 'procore_api' && (
            <ProcoreConnectionModal
              token={token}
              onClose={() => setStep(1)}
              onConnected={handleProcoreConnected}
            />
          )}

          {step === 3 && sourceType === 'procore_api' && procoreConnection && (
            <ProcoreProjectSelector
              token={token}
              connection={procoreConnection}
              onBack={() => setStep(2)}
              onSelectProject={handleProjectSelected}
            />
          )}

          {step === 4 && sourceType === 'procore_api' && procoreProject && (
            <EntityTypeSelector
              procoreProject={procoreProject}
              onBack={() => setStep(3)}
              onNext={handleEntityTypesSelected}
            />
          )}

          {step === 5 && sessionId && (
            <MigrationProgress
              sessionId={sessionId}
              token={token}
              onComplete={handleMigrationComplete}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MigrationWizard;
