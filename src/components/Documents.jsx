import React, { useState, useEffect } from 'react';
import {
  Upload, FileText, Trash2, Download, Star, Edit2, Tag, Clock,
  Search, Filter, MoreVertical, ChevronRight, X, Eye, FolderTree as FolderIcon,
  CheckSquare, Square, Link as LinkIcon
} from 'lucide-react';
import FolderTree from './FolderTree';
import EnhancedUploadModal from './EnhancedUploadModal';
import VersionHistory from './VersionHistory';
import DocumentPreview from './DocumentPreview';
import DocumentLinkModal from './DocumentLinkModal';
import { usePermissions } from '../contexts/PermissionContext';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const CATEGORIES = [
  'Contracts', 'Specifications', 'Drawings', 'Submittals', 'Correspondence',
  'Reports', 'Photos', 'Financials', 'Permits', 'Safety Documents', 'Other'
];

const Documents = ({ projectId, token }) => {
  const { can } = usePermissions();
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'recent', 'favorites'
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    tags: '',
    date_from: '',
    date_to: ''
  });
  const [selectedDocs, setSelectedDocs] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [docMenuOpen, setDocMenuOpen] = useState(null);
  const [versionHistoryDoc, setVersionHistoryDoc] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [linkDoc, setLinkDoc] = useState(null);
  const [showFolderTree, setShowFolderTree] = useState(true);
  const [documentLinks, setDocumentLinks] = useState({}); // Map of documentId -> links array

  useEffect(() => {
    if (projectId) {
      loadFolders();
      loadDocuments();
    }
  }, [projectId, currentFolderId, viewMode]);

  const loadFolders = async () => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/folders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load folders');
      const data = await response.json();
      setFolders(data.folders || []);
      updateBreadcrumbs(currentFolderId, data.folders || []);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      let url;
      if (viewMode === 'recent') {
        url = `${API_URL}/projects/${projectId}/documents/recent`;
      } else if (viewMode === 'favorites') {
        url = `${API_URL}/projects/${projectId}/documents/favorites`;
      } else if (searchQuery || Object.values(filters).some(f => f)) {
        const params = new URLSearchParams({ q: searchQuery, ...filters });
        url = `${API_URL}/projects/${projectId}/documents/search?${params}`;
      } else {
        const params = new URLSearchParams();
        if (currentFolderId) params.append('folder_id', currentFolderId);
        url = `${API_URL}/projects/${projectId}/documents?${params}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load documents');
      const data = await response.json();
      const docs = data.documents || [];
      setDocuments(docs);

      // Load links for all documents
      loadDocumentLinks(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentLinks = async (docs) => {
    const linksMap = {};

    // Load links for all documents in parallel
    await Promise.all(
      docs.map(async (doc) => {
        try {
          const response = await fetch(`${API_URL}/documents/${doc.id}/links`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            linksMap[doc.id] = data.links || [];
          }
        } catch (error) {
          console.error(`Failed to load links for ${doc.id}:`, error);
          linksMap[doc.id] = [];
        }
      })
    );

    setDocumentLinks(linksMap);
  };

  const updateBreadcrumbs = (folderId, folderList) => {
    if (!folderId) {
      setBreadcrumbs([]);
      return;
    }

    const crumbs = [];
    let current = folderList.find(f => f.id === folderId);
    while (current) {
      crumbs.unshift(current);
      current = folderList.find(f => f.id === current.parent_folder_id);
    }
    setBreadcrumbs(crumbs);
  };

  const handleCreateFolder = async (name, parentId) => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/folders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, parent_folder_id: parentId })
      });
      if (!response.ok) throw new Error('Failed to create folder');
      loadFolders();
    } catch (error) {
      alert('Failed to create folder: ' + error.message);
    }
  };

  const handleRenameFolder = async (folderId, newName) => {
    try {
      const response = await fetch(`${API_URL}/folders/${folderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
      });
      if (!response.ok) throw new Error('Failed to rename folder');
      loadFolders();
    } catch (error) {
      alert('Failed to rename folder: ' + error.message);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      const response = await fetch(`${API_URL}/folders/${folderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete folder');
      loadFolders();
      loadDocuments();
    } catch (error) {
      alert('Failed to delete folder: ' + error.message);
    }
  };

  const handleToggleFavorite = async (docId) => {
    try {
      const response = await fetch(`${API_URL}/documents/${docId}/favorite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to toggle favorite');
      loadDocuments();
    } catch (error) {
      alert('Failed to update favorite: ' + error.message);
    }
  };

  const handleUpdateDocument = async (docId, updates) => {
    try {
      const response = await fetch(`${API_URL}/documents/${docId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update document');
      setEditingDoc(null);
      loadDocuments();
    } catch (error) {
      alert('Failed to update document: ' + error.message);
    }
  };

  const handleDeleteDocument = async (docId, docName) => {
    if (!window.confirm(`Delete "${docName}"?`)) return;

    try {
      const response = await fetch(`${API_URL}/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete');
      loadDocuments();
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedDocs.size} document(s)?`)) return;

    try {
      const response = await fetch(`${API_URL}/documents/bulk-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ document_ids: Array.from(selectedDocs) })
      });
      if (!response.ok) throw new Error('Failed to delete documents');
      setSelectedDocs(new Set());
      setShowBulkActions(false);
      loadDocuments();
    } catch (error) {
      alert('Failed to delete documents: ' + error.message);
    }
  };

  const handleBulkMove = async (targetFolderId) => {
    try {
      const response = await fetch(`${API_URL}/documents/bulk-move`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_ids: Array.from(selectedDocs),
          folder_id: targetFolderId
        })
      });
      if (!response.ok) throw new Error('Failed to move documents');
      setSelectedDocs(new Set());
      setShowBulkActions(false);
      loadDocuments();
    } catch (error) {
      alert('Failed to move documents: ' + error.message);
    }
  };

  const handleBulkCategorize = async (category) => {
    try {
      const response = await fetch(`${API_URL}/documents/bulk-categorize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_ids: Array.from(selectedDocs),
          category
        })
      });
      if (!response.ok) throw new Error('Failed to categorize documents');
      setSelectedDocs(new Set());
      setShowBulkActions(false);
      loadDocuments();
    } catch (error) {
      alert('Failed to categorize documents: ' + error.message);
    }
  };

  const toggleSelectDoc = (docId) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  const selectAllDocs = () => {
    if (selectedDocs.size === documents.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(documents.map(d => d.id)));
    }
  };

  const handleDownload = (doc) => {
    const fileUrl = doc.file_url || `${API_URL.replace('/api/v1', '')}/${doc.file_path}`;
    window.open(fileUrl, '_blank');
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Contracts': 'bg-purple-100 text-purple-800',
      'Specifications': 'bg-blue-100 text-blue-800',
      'Drawings': 'bg-green-100 text-green-800',
      'Submittals': 'bg-yellow-100 text-yellow-800',
      'Correspondence': 'bg-pink-100 text-pink-800',
      'Reports': 'bg-indigo-100 text-indigo-800',
      'Photos': 'bg-red-100 text-red-800',
      'Financials': 'bg-orange-100 text-orange-800',
      'Permits': 'bg-teal-100 text-teal-800',
      'Safety Documents': 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatLinkDisplay = (link) => {
    const typeMap = {
      'rfi': 'RFI',
      'submittal': 'Submittal',
      'punch_item': 'Punch Item',
      'task': 'Task',
      'issue': 'Issue',
      'observation': 'Observation',
      'daily_log': 'Daily Log'
    };
    const typeName = typeMap[link.target_type] || link.target_type;
    const shortId = link.target_id.substring(0, 8);
    return `${typeName} (${shortId})`;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-gray-900">Documents</h2>
            <button
              onClick={() => setShowFolderTree(!showFolderTree)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <FolderIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {can('upload_document') && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-5 h-5" />
                Upload
              </button>
            )}
          </div>
        </div>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <button
              onClick={() => setCurrentFolderId(null)}
              className="hover:text-blue-600"
            >
              Home
            </button>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight className="w-4 h-4" />
                <button
                  onClick={() => setCurrentFolderId(crumb.id)}
                  className={idx === breadcrumbs.length - 1 ? 'font-medium text-gray-900' : 'hover:text-blue-600'}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadDocuments()}
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${
              showFilters ? 'bg-blue-50 border-blue-500' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
          <div className="flex items-center gap-1 border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-2 text-sm ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'} rounded-l-lg`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('recent')}
              className={`px-3 py-2 text-sm ${viewMode === 'recent' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}
            >
              Recent
            </button>
            <button
              onClick={() => setViewMode('favorites')}
              className={`px-3 py-2 text-sm ${viewMode === 'favorites' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'} rounded-r-lg`}
            >
              Favorites
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={filters.tags}
                  onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
                  placeholder="Comma-separated"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={loadDocuments}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <button
                onClick={() => {
                  setFilters({ category: '', tags: '', date_from: '', date_to: '' });
                  setSearchQuery('');
                }}
                className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedDocs.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedDocs.size} document(s) selected
            </span>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) handleBulkMove(e.target.value);
                  e.target.value = '';
                }}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="">Move to folder...</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <select
                onChange={(e) => {
                  if (e.target.value) handleBulkCategorize(e.target.value);
                  e.target.value = '';
                }}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="">Set category...</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              {can('delete_document') && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setSelectedDocs(new Set())}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Folder Tree Sidebar */}
        {showFolderTree && (
          <div className="w-64 flex-shrink-0">
            <FolderTree
              folders={folders}
              currentFolderId={currentFolderId}
              onFolderSelect={setCurrentFolderId}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
            />
          </div>
        )}

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center m-4">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No documents found</p>
            </div>
          ) : (
            <div className="p-4">
              {/* Select All */}
              <div className="bg-white rounded-lg border border-gray-200 mb-2 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDocs.size === documents.length}
                    onChange={selectAllDocs}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Select All</span>
                </label>
              </div>

              {/* Document Cards */}
              <div className="space-y-2">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${
                      selectedDocs.has(doc.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedDocs.has(doc.id)}
                        onChange={() => toggleSelectDoc(doc.id)}
                        className="mt-1 w-4 h-4"
                      />
                      <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {editingDoc === doc.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              defaultValue={doc.name}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                              onBlur={(e) => handleUpdateDocument(doc.id, { name: e.target.value })}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900">{doc.name}</h3>
                                <p className="text-sm text-gray-500">
                                  {doc.first_name} {doc.last_name} • {new Date(doc.uploaded_at).toLocaleDateString()}
                                  {doc.file_size && ` • ${(doc.file_size / 1024).toFixed(1)} KB`}
                                </p>
                                {doc.description && (
                                  <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  onClick={() => handleToggleFavorite(doc.id)}
                                  className={`p-2 rounded ${doc.is_favorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                                  title="Favorite"
                                >
                                  <Star className="w-5 h-5" fill={doc.is_favorite ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                  onClick={() => setPreviewDoc(doc)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Preview"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDownload(doc)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Download"
                                >
                                  <Download className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => setVersionHistoryDoc(doc)}
                                  className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                                  title="Version History"
                                >
                                  <Clock className="w-5 h-5" />
                                </button>
                                {can('edit_document') && (
                                  <button
                                    onClick={() => setEditingDoc(doc.id)}
                                    className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-5 h-5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => setLinkDoc(doc)}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                                  title="Link to RFI/Submittal/Task"
                                >
                                  <LinkIcon className="w-5 h-5" />
                                </button>
                                {can('delete_document') && (
                                  <button
                                    onClick={() => handleDeleteDocument(doc.id, doc.name)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {doc.category && (
                                <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(doc.category)}`}>
                                  {doc.category}
                                </span>
                              )}
                              {doc.tags && doc.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                            {documentLinks[doc.id] && documentLinks[doc.id].length > 0 && (
                              <div className="mt-2 text-xs text-gray-600">
                                <span className="font-medium">Links: </span>
                                {documentLinks[doc.id].map((link, idx) => (
                                  <span key={link.id}>
                                    {idx > 0 && ', '}
                                    <span className="text-indigo-600">{formatLinkDisplay(link)}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUploadModal && (
        <EnhancedUploadModal
          projectId={projectId}
          folderId={currentFolderId}
          token={token}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={loadDocuments}
        />
      )}

      {versionHistoryDoc && (
        <VersionHistory
          documentId={versionHistoryDoc.id}
          token={token}
          onClose={() => setVersionHistoryDoc(null)}
        />
      )}

      {previewDoc && (
        <DocumentPreview
          document={previewDoc}
          token={token}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {linkDoc && (
        <DocumentLinkModal
          document={linkDoc}
          token={token}
          projectId={projectId}
          onClose={() => setLinkDoc(null)}
          onLinked={loadDocuments}
        />
      )}
    </div>
  );
};

export default Documents;
