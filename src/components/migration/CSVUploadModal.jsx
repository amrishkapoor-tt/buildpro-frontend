import React, { useState } from 'react';
import { Upload, FileText, Download, Check, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import MigrationProgress from './MigrationProgress';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

/**
 * CSVUploadModal
 *
 * Handles CSV/Excel file upload, field mapping, validation, and import.
 * Multi-step workflow: Upload → Map → Validate → Import
 */
const CSVUploadModal = ({ projectId, token, onClose, onComplete }) => {
  const [step, setStep] = useState(1); // 1: Entity type, 2: Upload, 3: Map, 4: Validate, 5: Import
  const [entityType, setEntityType] = useState('');
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [fieldMappings, setFieldMappings] = useState({});
  const [validation, setValidation] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(false);

  const entityTypes = [
    { value: 'rfi', label: 'RFIs', description: 'Requests for Information' },
    { value: 'submittal', label: 'Submittals', description: 'Submittal packages and items' },
    { value: 'punch_item', label: 'Punch Items', description: 'Punch list items' }
  ];

  const handleEntityTypeSelect = (type) => {
    setEntityType(type);
    setStep(2);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      window.alert('Please select a file');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entity_type', entityType);
      formData.append('project_id', projectId);

      const response = await fetch(`${API_URL}/migration/csv/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Upload failed');
      }

      const data = await response.json();

      setParsedData(data);
      setFileId(data.file_id);
      setFieldMappings(data.suggested_mappings || {});
      setStep(3);
    } catch (error) {
      window.alert(`Upload failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/migration/csv/${fileId}/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          field_mappings: fieldMappings,
          project_id: projectId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Validation failed');
      }

      const data = await response.json();
      setValidation(data.validation);
      setStep(4);
    } catch (error) {
      window.alert(`Validation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${API_URL}/migration/csv/template/${entityType}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Template download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityType}_template.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      window.alert(`Template download failed: ${error.message}`);
    }
  };

  const updateFieldMapping = (csvHeader, buildProField) => {
    setFieldMappings(prev => ({
      ...prev,
      [csvHeader]: buildProField
    }));
  };

  const handleImport = async () => {
    setImporting(true);

    try {
      const response = await fetch(`${API_URL}/migration/csv/${fileId}/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          field_mappings: fieldMappings,
          project_id: projectId,
          options: {
            skip_duplicates: false
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Import failed');
      }

      const data = await response.json();
      setSessionId(data.session.id);
      setStep(5); // Show progress
    } catch (error) {
      window.alert(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Choose Entity Type */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Select Data Type
          </h3>

          <div className="space-y-3">
            {entityTypes.map(type => (
              <button
                key={type.value}
                onClick={() => handleEntityTypeSelect(type.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-gray-900">{type.label}</div>
                  <div className="text-sm text-gray-600">{type.description}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Upload File */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Upload {entityTypes.find(t => t.value === entityType)?.label} File
            </h3>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
            >
              Choose File
            </label>
            {file && (
              <div className="mt-4 text-sm text-gray-600">
                Selected: {file.name}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Supports CSV and Excel files (up to 10MB)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Back
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Uploading...' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Map Fields */}
      {step === 3 && parsedData && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Map Fields
          </h3>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <Check className="w-4 h-4 inline mr-1" />
              Found {parsedData.row_count} rows with {parsedData.headers.length} columns
            </p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {parsedData.headers.map((header, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-medium">
                  {header}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <select
                  value={fieldMappings[header] || ''}
                  onChange={(e) => updateFieldMapping(header, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Skip this field</option>
                  {entityType === 'rfi' && (
                    <>
                      <option value="rfi_number">RFI Number</option>
                      <option value="title">Title</option>
                      <option value="question">Question</option>
                      <option value="status">Status</option>
                      <option value="priority">Priority</option>
                      <option value="due_date">Due Date</option>
                      <option value="created_at">Created Date</option>
                      <option value="created_by_email">Created By (Email)</option>
                      <option value="assigned_to_email">Assigned To (Email)</option>
                    </>
                  )}
                  {entityType === 'submittal' && (
                    <>
                      <option value="submittal_number">Submittal Number</option>
                      <option value="title">Title</option>
                      <option value="spec_section">Spec Section</option>
                      <option value="type">Type</option>
                      <option value="status">Status</option>
                      <option value="submitted_at">Submitted Date</option>
                      <option value="due_date">Due Date</option>
                    </>
                  )}
                  {entityType === 'punch_item' && (
                    <>
                      <option value="item_number">Item Number</option>
                      <option value="description">Description</option>
                      <option value="location">Location</option>
                      <option value="trade">Trade</option>
                      <option value="status">Status</option>
                      <option value="priority">Priority</option>
                      <option value="assigned_to_email">Assigned To (Email)</option>
                      <option value="due_date">Due Date</option>
                    </>
                  )}
                </select>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Back
            </button>
            <button
              onClick={handleValidate}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {loading ? 'Validating...' : 'Validate & Import'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Validation Results */}
      {step === 4 && validation && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Validation Results
          </h3>

          {validation.valid_rows > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <Check className="w-5 h-5" />
                <span className="font-semibold">{validation.valid_rows} rows ready to import</span>
              </div>
            </div>
          )}

          {validation.invalid_rows > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">{validation.invalid_rows} rows have errors</span>
              </div>
              <div className="space-y-2 mt-3 max-h-60 overflow-y-auto">
                {validation.errors.slice(0, 10).map((error, index) => (
                  <div key={index} className="text-sm text-red-700 pl-4">
                    <span className="font-medium">Row {error.row}:</span> {error.errors.map(e => e.error).join(', ')}
                  </div>
                ))}
                {validation.errors.length > 10 && (
                  <p className="text-sm text-red-600 pl-4">
                    ...and {validation.errors.length - 10} more errors
                  </p>
                )}
              </div>
            </div>
          )}

          {validation.warnings && validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-800">
                <span className="font-semibold">{validation.warnings.length} warnings</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(3)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Back to Mapping
            </button>
            {validation.valid_rows > 0 && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {importing ? 'Starting Import...' : `Import ${validation.valid_rows} Row${validation.valid_rows !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 5: Import Progress */}
      {step === 5 && sessionId && (
        <MigrationProgress
          sessionId={sessionId}
          token={token}
          onComplete={(session) => {
            if (onComplete) {
              onComplete(session);
            }
          }}
          onClose={onClose}
        />
      )}
    </div>
  );
};

export default CSVUploadModal;
