import React, { useState, useEffect } from 'react';
import { FileText, Download, X, Upload, Paperclip } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const LinkedDocuments = ({ entityType, entityId, token, projectId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLinkedDocuments();
  }, [entityId]);

  const loadLinkedDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/${entityType}s/${entityId}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load linked documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDocuments = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableDocs(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleAttachExisting = async (documentId) => {
    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_type: entityType,
          target_id: entityId,
          relationship: 'attachment'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to attach');
      }

      setShowAttachModal(false);
      loadLinkedDocuments();
    } catch (error) {
      alert('Failed to attach: ' + error.message);
    }
  };

  const handleUnlink = async (linkId) => {
    if (!window.confirm('Remove this document link?')) return;

    try {
      const response = await fetch(`${API_URL}/document-links/${linkId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to unlink');

      loadLinkedDocuments();
    } catch (error) {
      alert('Failed to unlink: ' + error.message);
    }
  };

  const handleDownload = (doc) => {
    const fileUrl = doc.file_url || `${API_URL.replace('/api/v1', '')}/${doc.file_path}`;
    window.open(fileUrl, '_blank');
  };

  const filteredAvailableDocs = availableDocs.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !documents.some(linked => linked.id === doc.id)
  );

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Paperclip className="w-5 h-5" />
          Attached Documents ({documents.length})
        </h3>
        <button
          onClick={() => {
            loadAvailableDocuments();
            setShowAttachModal(true);
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Paperclip className="w-4 h-4" />
          Attach Document
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : documents.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">No documents attached yet</p>
          <button
            onClick={() => {
              loadAvailableDocuments();
              setShowAttachModal(true);
            }}
            className="mt-3 text-blue-600 text-sm hover:underline"
          >
            Attach a document
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    {doc.first_name} {doc.last_name} • {new Date(doc.uploaded_at).toLocaleDateString()}
                    {doc.file_size && ` • ${(doc.file_size / 1024).toFixed(1)} KB`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(doc)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleUnlink(doc.link_id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attach Modal */}
      {showAttachModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Attach Document</h3>
              <button
                onClick={() => setShowAttachModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {filteredAvailableDocs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No documents match your search' : 'No documents available'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableDocs.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {doc.category && `${doc.category} • `}
                            {(doc.file_size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAttachExisting(doc.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Attach
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAttachModal(false)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedDocuments;
