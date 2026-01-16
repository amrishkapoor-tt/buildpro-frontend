import React, { useState, useEffect } from 'react';
import { Clock, Download, RotateCcw, Trash2, CheckCircle, Upload } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const VersionHistory = ({ documentId, token, onClose }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newVersionFile, setNewVersionFile] = useState(null);
  const [versionName, setVersionName] = useState('');
  const [changeDescription, setChangeDescription] = useState('');

  useEffect(() => {
    loadVersions();
  }, [documentId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/versions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load versions');
      const data = await response.json();
      setVersions(data.versions || []);
    } catch (error) {
      console.error('Failed to load versions:', error);
      alert('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNewVersion = async (e) => {
    e.preventDefault();
    if (!newVersionFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', newVersionFile);
    if (versionName) formData.append('version_name', versionName);
    if (changeDescription) formData.append('change_description', changeDescription);

    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/versions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!response.ok) throw new Error('Upload failed');

      setNewVersionFile(null);
      setVersionName('');
      setChangeDescription('');
      loadVersions();
      alert('New version uploaded successfully');
    } catch (error) {
      console.error('Version upload failed:', error);
      alert('Failed to upload new version');
    } finally {
      setUploading(false);
    }
  };

  const handleRevertToVersion = async (versionId) => {
    if (!window.confirm('Revert to this version? This will make it the current version.')) return;

    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/versions/${versionId}/set-current`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Revert failed');
      loadVersions();
      alert('Reverted to selected version');
    } catch (error) {
      console.error('Revert failed:', error);
      alert('Failed to revert to version');
    }
  };

  const handleDeleteVersion = async (versionId) => {
    if (!window.confirm('Delete this version?')) return;

    try {
      const response = await fetch(`${API_URL}/document-versions/${versionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }
      loadVersions();
    } catch (error) {
      console.error('Delete failed:', error);
      alert(error.message);
    }
  };

  const handleDownloadVersion = (versionId) => {
    window.open(`${API_URL}/document-versions/${versionId}?token=${token}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Version History</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload New Version Form */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload New Version
            </h4>
            <form onSubmit={handleUploadNewVersion} className="space-y-3">
              <div>
                <input
                  type="file"
                  onChange={(e) => setNewVersionFile(e.target.files[0])}
                  className="w-full text-sm"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder="Version name (e.g., Rev A, Final, As-Built)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <textarea
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  placeholder="Describe what changed in this version..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows="2"
                />
              </div>
              <button
                type="submit"
                disabled={!newVersionFile || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 text-sm"
              >
                {uploading ? 'Uploading...' : 'Upload New Version'}
              </button>
            </form>
          </div>

          {/* Version List */}
          {loading ? (
            <div className="text-center py-8">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No version history available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-4 border rounded-lg ${
                    version.is_current ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          Version {version.version_number}
                        </span>
                        {version.version_name && (
                          <span className="text-sm text-gray-600">({version.version_name})</span>
                        )}
                        {version.is_current && (
                          <span className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Uploaded by {version.first_name} {version.last_name} on{' '}
                        {new Date(version.uploaded_at).toLocaleString()}
                      </p>
                      {version.file_size && (
                        <p className="text-xs text-gray-500 mt-1">
                          Size: {(version.file_size / 1024).toFixed(1)} KB
                        </p>
                      )}
                      {version.change_description && (
                        <p className="text-sm text-gray-700 mt-2 p-2 bg-white rounded border border-gray-200">
                          {version.change_description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleDownloadVersion(version.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {!version.is_current && (
                        <>
                          <button
                            onClick={() => handleRevertToVersion(version.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Revert to this version"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVersion(version.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Delete version"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;
