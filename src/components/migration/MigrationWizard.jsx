import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Upload, Database } from 'lucide-react';
import CSVUploadModal from './CSVUploadModal';
import ProcoreConnectionModal from './ProcoreConnectionModal';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

/**
 * MigrationWizard
 *
 * Multi-step wizard for importing data from Procore or CSV/Excel files.
 */
const MigrationWizard = ({ projectId, token, onClose, onComplete }) => {
  const [step, setStep] = useState(1); // 1: Choose source, 2: CSV upload or Procore connection
  const [sourceType, setSourceType] = useState(null); // 'csv' or 'procore_api'
  const [sessionId, setSessionId] = useState(null);
  const [procoreConnection, setProcoreConnection] = useState(null);

  const handleSourceSelect = (type) => {
    setSourceType(type);
    setStep(2);
  };

  const handleProcoreConnected = (connection) => {
    setProcoreConnection(connection);
    // TODO: Move to next step (project selection)
    setStep(3);
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
            <h2 className="text-2xl font-bold text-gray-900">Import Data</h2>
            <p className="text-sm text-gray-600 mt-1">
              Import data from Procore or CSV/Excel files
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
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
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Procore Project Selection
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Connected to: {procoreConnection.procore_company_name}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Procore project selection and data type selection will be implemented in Phase 2.
                  For now, you can test the connection flow.
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Back to Source Selection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MigrationWizard;
