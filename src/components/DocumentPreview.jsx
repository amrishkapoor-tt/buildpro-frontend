import React from 'react';
import { X, Download, Maximize2 } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const DocumentPreview = ({ document, token, onClose }) => {
  const handleDownload = () => {
    const fileUrl = document.file_url || `${API_URL.replace('/api/v1', '')}/${document.file_path}`;
    window.open(fileUrl, '_blank');
  };

  const renderPreview = () => {
    const mimeType = document.mime_type || '';
    const previewUrl = `${API_URL}/documents/${document.id}/preview?token=${token}`;

    // Image preview
    if (mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <img
            src={previewUrl}
            alt={document.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    // PDF preview
    if (mimeType === 'application/pdf') {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-full"
          title={document.name}
        />
      );
    }

    // Text preview
    if (mimeType.startsWith('text/')) {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-full bg-white"
          title={document.name}
        />
      );
    }

    // Default: not previewable
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="mb-4">Preview not available for this file type</p>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="w-5 h-5" />
          Download to View
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-80 text-white">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{document.name}</h3>
          <p className="text-sm text-gray-300">
            {document.file_size && `${(document.file_size / 1024).toFixed(1)} KB`}
            {document.category && ` • ${document.category}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-700 rounded"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              const previewUrl = `${API_URL}/documents/${document.id}/preview?token=${token}`;
              window.open(previewUrl, '_blank');
            }}
            className="p-2 hover:bg-gray-700 rounded"
            title="Open in new tab"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden">
        {renderPreview()}
      </div>

      {/* Footer with metadata */}
      {(document.description || document.tags) && (
        <div className="p-4 bg-black bg-opacity-80 text-white border-t border-gray-700">
          {document.description && (
            <p className="text-sm mb-2">{document.description}</p>
          )}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {document.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-700 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentPreview;
