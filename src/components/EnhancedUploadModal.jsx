import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const CATEGORIES = [
  'Contracts',
  'Specifications',
  'Drawings',
  'Submittals',
  'Correspondence',
  'Reports',
  'Photos',
  'Financials',
  'Permits',
  'Safety Documents',
  'Other'
];

const EnhancedUploadModal = ({ projectId, folderId, token, onClose, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const filesWithMetadata = newFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      description: '',
      tags: [],
      category: '',
      progress: 0
    }));
    setFiles(prev => [...prev, ...filesWithMetadata]);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateFileMetadata = (fileId, field, value) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, [field]: value } : f
    ));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();

    files.forEach(fileData => {
      formData.append('files', fileData.file);
    });

    const metadata = files.map(f => ({
      name: f.name,
      description: f.description,
      tags: f.tags,
      category: f.category,
      folder_id: folderId
    }));
    formData.append('metadata', JSON.stringify(metadata));

    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/documents/bulk-upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setUploadResults(data);

      if (data.failed.length === 0) {
        setTimeout(() => {
          onUploadComplete();
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleTagInput = (fileId, value) => {
    if (value.endsWith(',') || value.endsWith(' ')) {
      const tag = value.trim().replace(',', '');
      if (tag) {
        const fileData = files.find(f => f.id === fileId);
        if (!fileData.tags.includes(tag)) {
          updateFileMetadata(fileId, 'tags', [...fileData.tags, tag]);
        }
      }
      // Clear input handled by component
    }
  };

  const removeTag = (fileId, tagToRemove) => {
    const fileData = files.find(f => f.id === fileId);
    updateFileMetadata(fileId, 'tags', fileData.tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Upload Documents</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!uploadResults ? (
            <>
              {/* Drag and Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors mb-6 ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drag and drop files here
                </p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-4">
                  Maximum file size: 50MB per file
                </p>
              </div>

              {/* File List with Metadata */}
              {files.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    Files to Upload ({files.length})
                  </h4>
                  {files.map(fileData => (
                    <div key={fileData.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <FileText className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={fileData.name}
                              onChange={(e) => updateFileMetadata(fileData.id, 'name', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm font-medium"
                              placeholder="File name"
                            />
                            <button
                              onClick={() => removeFile(fileData.id)}
                              className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="text-xs text-gray-500">
                            {(fileData.file.size / 1024).toFixed(1)} KB
                          </div>

                          <textarea
                            value={fileData.description}
                            onChange={(e) => updateFileMetadata(fileData.id, 'description', e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            rows="2"
                          />

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Category
                            </label>
                            <select
                              value={fileData.category}
                              onChange={(e) => updateFileMetadata(fileData.id, 'category', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Select category...</option>
                              {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Tags (press comma or space to add)
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {fileData.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                >
                                  {tag}
                                  <button
                                    onClick={() => removeTag(fileData.id, tag)}
                                    className="hover:text-blue-900"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <input
                              type="text"
                              onKeyDown={(e) => {
                                if (e.key === ',' || e.key === ' ' || e.key === 'Enter') {
                                  e.preventDefault();
                                  const tag = e.target.value.trim();
                                  if (tag && !fileData.tags.includes(tag)) {
                                    updateFileMetadata(fileData.id, 'tags', [...fileData.tags, tag]);
                                  }
                                  e.target.value = '';
                                }
                              }}
                              placeholder="Type and press comma or space..."
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Upload Results */
            <div className="space-y-4">
              <div className="text-center py-8">
                {uploadResults.failed.length === 0 ? (
                  <>
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Upload Successful!
                    </h3>
                    <p className="text-gray-600">
                      {uploadResults.uploaded.length} file(s) uploaded successfully
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Upload Complete with Errors
                    </h3>
                    <p className="text-gray-600">
                      {uploadResults.uploaded.length} succeeded, {uploadResults.failed.length} failed
                    </p>
                  </>
                )}
              </div>

              {uploadResults.failed.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Failed Uploads:</h4>
                  <ul className="space-y-1">
                    {uploadResults.failed.map((fail, idx) => (
                      <li key={idx} className="text-sm text-red-800">
                        {fail.file}: {fail.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          {!uploadResults ? (
            <>
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {uploading ? 'Uploading...' : `Upload ${files.length} File(s)`}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedUploadModal;
