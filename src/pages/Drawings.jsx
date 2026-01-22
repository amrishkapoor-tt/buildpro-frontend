import React, { useState, useEffect } from 'react';
import { Upload, FileText, Search, Filter, Download, Edit2, Trash2, Eye } from 'lucide-react';
import DrawingMarkup from '../components/DrawingMarkup';
import DrawingViewer from '../components/DrawingViewer';
import ASIManager from '../components/ASIManager';
import { usePermissions } from '../contexts/PermissionContext';
import './Drawings.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const DISCIPLINES = ['A', 'S', 'M', 'E', 'P', 'C', 'L', 'FP'];
const WORKFLOW_STATES = [
  { value: 'received', label: 'Received' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'markup_in_progress', label: 'Markup In Progress' },
  { value: 'asi_pending', label: 'ASI Pending' },
  { value: 'distributed', label: 'Distributed' },
  { value: 'superseded', label: 'Superseded' },
  { value: 'archived', label: 'Archived' }
];

const Drawings = ({ projectId, token }) => {
  const { can } = usePermissions();
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewingDrawing, setViewingDrawing] = useState(null);
  const [showASIManager, setShowASIManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    discipline: '',
    workflow_state: '',
    revision: '',
    is_current: 'all'
  });

  // Upload form state
  const [uploadData, setUploadData] = useState({
    file: null,
    drawing_number: '',
    discipline: '',
    sheet_title: '',
    revision_number: '',
    drawing_scale: '',
    sheet_size: '',
    issue_date: ''
  });

  useEffect(() => {
    if (projectId) {
      loadDrawings();
    }
  }, [projectId, filters]);

  const loadDrawings = async () => {
    if (!token || !projectId) {
      console.error('Missing authentication or project ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('category', 'Drawings');
      if (searchQuery) params.append('q', searchQuery);
      if (filters.discipline) params.append('discipline', filters.discipline);

      const response = await fetch(`${API_URL}/projects/${projectId}/documents?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to load drawings (${response.status})`);
      }

      const data = await response.json();
      let docs = data.documents || [];

      // Apply additional filters
      if (filters.workflow_state) {
        // Would need to fetch workflow states for each drawing
        // For now, just return all
      }
      if (filters.is_current === 'current') {
        docs = docs.filter(d => d.is_current_revision !== false);
      } else if (filters.is_current === 'superseded') {
        docs = docs.filter(d => d.is_current_revision === false);
      }

      setDrawings(docs);
    } catch (error) {
      console.error('Failed to load drawings:', error);
      alert('Failed to load drawings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDrawing = async (e) => {
    e.preventDefault();

    if (!uploadData.file) {
      alert('Please select a file');
      return;
    }

    if (!uploadData.drawing_number) {
      alert('Drawing number is required');
      return;
    }

    if (!token || !projectId) {
      alert('Authentication error. Please log in again.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('document', uploadData.file);
      formData.append('name', uploadData.file.name);
      formData.append('category', 'Drawings');
      formData.append('drawing_number', uploadData.drawing_number);
      if (uploadData.discipline) formData.append('discipline', uploadData.discipline);
      if (uploadData.sheet_title) formData.append('sheet_title', uploadData.sheet_title);
      if (uploadData.revision_number) formData.append('revision_number', uploadData.revision_number);
      if (uploadData.drawing_scale) formData.append('drawing_scale', uploadData.drawing_scale);
      if (uploadData.sheet_size) formData.append('sheet_size', uploadData.sheet_size);
      if (uploadData.issue_date) formData.append('issue_date', uploadData.issue_date);
      formData.append('is_current_revision', 'true');

      const response = await fetch(`${API_URL}/projects/${projectId}/documents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();

      // Validate response structure
      if (!data || !data.document || !data.document.id) {
        throw new Error('Invalid server response: missing document ID');
      }

      // Create initial workflow state with error handling
      try {
        const workflowResponse = await fetch(`${API_URL}/drawings/${data.document.id}/workflow`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            workflow_state: 'received',
            notes: 'Drawing uploaded and received'
          })
        });

        if (!workflowResponse.ok) {
          console.error('Failed to create workflow state:', await workflowResponse.text().catch(() => 'Unknown error'));
          // Continue despite workflow failure - drawing is already uploaded
        }
      } catch (workflowError) {
        console.error('Failed to create workflow state:', workflowError);
        // Continue despite workflow failure - drawing is already uploaded
      }

      setShowUploadModal(false);
      setUploadData({
        file: null,
        drawing_number: '',
        discipline: '',
        sheet_title: '',
        revision_number: '',
        drawing_scale: '',
        sheet_size: '',
        issue_date: ''
      });
      loadDrawings();
      alert('Drawing uploaded successfully');
    } catch (error) {
      console.error('Failed to upload drawing:', error);
      alert('Failed to upload drawing: ' + error.message);
    }
  };

  const handleDeleteDrawing = async (drawingId, drawingNumber) => {
    if (!window.confirm(`Delete drawing ${drawingNumber}? This cannot be undone.`)) return;

    try {
      const response = await fetch(`${API_URL}/documents/${drawingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Delete failed with status ${response.status}`);
      }

      loadDrawings();
      alert('Drawing deleted successfully');
    } catch (error) {
      console.error('Failed to delete drawing:', error);
      alert('Failed to delete drawing: ' + error.message);
    }
  };

  const getWorkflowColor = (state) => {
    switch (state) {
      case 'received': return 'workflow-received';
      case 'under_review': return 'workflow-under-review';
      case 'markup_in_progress': return 'workflow-markup';
      case 'asi_pending': return 'workflow-asi';
      case 'distributed': return 'workflow-distributed';
      case 'superseded': return 'workflow-superseded';
      case 'archived': return 'workflow-archived';
      default: return '';
    }
  };

  return (
    <div className="drawings-page">
      <div className="drawings-header">
        <div className="header-left">
          <h1>Drawings</h1>
          <p className="subtitle">Drawing register and workflow management</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowASIManager(true)} className="btn-secondary">
            ASI Manager
          </button>
          {can('upload_document') && (
            <button onClick={() => setShowUploadModal(true)} className="btn-primary">
              <Upload className="icon" />
              Upload Drawing
            </button>
          )}
        </div>
      </div>

      <div className="drawings-toolbar">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadDrawings()}
            placeholder="Search by drawing number, title..."
            className="search-input"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-filter ${showFilters ? 'active' : ''}`}>
          <Filter className="icon" />
          Filters
        </button>

        <div className="drawing-stats">
          <span className="stat">Total: {drawings.length}</span>
          <span className="stat">Current: {drawings.filter(d => d.is_current_revision !== false).length}</span>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Discipline</label>
            <select
              value={filters.discipline}
              onChange={(e) => setFilters({ ...filters, discipline: e.target.value })}>
              <option value="">All</option>
              {DISCIPLINES.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.is_current}
              onChange={(e) => setFilters({ ...filters, is_current: e.target.value })}>
              <option value="all">All</option>
              <option value="current">Current Only</option>
              <option value="superseded">Superseded</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Workflow State</label>
            <select
              value={filters.workflow_state}
              onChange={(e) => setFilters({ ...filters, workflow_state: e.target.value })}>
              <option value="">All</option>
              {WORKFLOW_STATES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <button onClick={() => setFilters({ discipline: '', workflow_state: '', revision: '', is_current: 'all' })}>
            Clear Filters
          </button>
        </div>
      )}

      <div className="drawings-content">
        {loading ? (
          <div className="loading">Loading drawings...</div>
        ) : drawings.length === 0 ? (
          <div className="empty-state">
            <FileText className="empty-icon" />
            <h3>No Drawings</h3>
            <p>Upload your first drawing to get started</p>
            {can('upload_document') && (
              <button onClick={() => setShowUploadModal(true)} className="btn-primary">
                Upload Drawing
              </button>
            )}
          </div>
        ) : (
          <div className="drawings-table">
            <table>
              <thead>
                <tr>
                  <th>Drawing Number</th>
                  <th>Discipline</th>
                  <th>Sheet Title</th>
                  <th>Revision</th>
                  <th>Issue Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drawings.map(drawing => (
                  <tr key={drawing.id} className={drawing.is_current_revision === false ? 'superseded' : ''}>
                    <td className="drawing-number">{drawing.drawing_number || 'N/A'}</td>
                    <td>
                      {drawing.discipline && (
                        <span className={`discipline-badge discipline-${drawing.discipline}`}>
                          {drawing.discipline}
                        </span>
                      )}
                    </td>
                    <td className="sheet-title">{drawing.sheet_title || drawing.name}</td>
                    <td className="revision">{drawing.revision_number || '-'}</td>
                    <td>{drawing.issue_date ? new Date(drawing.issue_date).toLocaleDateString() : '-'}</td>
                    <td>
                      {drawing.is_current_revision === false ? (
                        <span className="status-badge superseded">Superseded</span>
                      ) : (
                        <span className="status-badge current">Current</span>
                      )}
                    </td>
                    <td className="actions">
                      <button
                        onClick={() => setViewingDrawing(drawing)}
                        className="action-btn primary"
                        title="Open Drawing Viewer">
                        <Eye className="icon" />
                      </button>
                      <a
                        href={`${API_URL}/documents/${drawing.id}/download?token=${token}`}
                        download
                        className="action-btn"
                        title="Download">
                        <Download className="icon" />
                      </a>
                      {can('delete_document') && (
                        <button
                          onClick={() => handleDeleteDrawing(drawing.id, drawing.drawing_number)}
                          className="action-btn danger"
                          title="Delete">
                          <Trash2 className="icon" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal upload-modal">
            <div className="modal-header">
              <h2>Upload Drawing</h2>
              <button onClick={() => setShowUploadModal(false)} className="close-btn">✕</button>
            </div>
            <form onSubmit={handleUploadDrawing} className="modal-body">
              <div className="form-group">
                <label>Drawing File *</label>
                <input
                  type="file"
                  accept=".pdf,.dwg,.dxf"
                  onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                  required
                />
                <small>Accepted formats: PDF, DWG, DXF</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Drawing Number *</label>
                  <input
                    type="text"
                    value={uploadData.drawing_number}
                    onChange={(e) => setUploadData({ ...uploadData, drawing_number: e.target.value })}
                    placeholder="e.g., A-101"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Discipline</label>
                  <select
                    value={uploadData.discipline}
                    onChange={(e) => setUploadData({ ...uploadData, discipline: e.target.value })}>
                    <option value="">Select...</option>
                    {DISCIPLINES.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Sheet Title</label>
                <input
                  type="text"
                  value={uploadData.sheet_title}
                  onChange={(e) => setUploadData({ ...uploadData, sheet_title: e.target.value })}
                  placeholder="e.g., First Floor Plan"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Revision</label>
                  <input
                    type="text"
                    value={uploadData.revision_number}
                    onChange={(e) => setUploadData({ ...uploadData, revision_number: e.target.value })}
                    placeholder="e.g., A, B, 1, 2"
                  />
                </div>
                <div className="form-group">
                  <label>Issue Date</label>
                  <input
                    type="date"
                    value={uploadData.issue_date}
                    onChange={(e) => setUploadData({ ...uploadData, issue_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Scale</label>
                  <input
                    type="text"
                    value={uploadData.drawing_scale}
                    onChange={(e) => setUploadData({ ...uploadData, drawing_scale: e.target.value })}
                    placeholder="e.g., 1/4 inch = 1 foot"
                  />
                </div>
                <div className="form-group">
                  <label>Sheet Size</label>
                  <select
                    value={uploadData.sheet_size}
                    onChange={(e) => setUploadData({ ...uploadData, sheet_size: e.target.value })}>
                    <option value="">Select...</option>
                    <option value="ARCH A">ARCH A (9x12)</option>
                    <option value="ARCH B">ARCH B (12x18)</option>
                    <option value="ARCH C">ARCH C (18x24)</option>
                    <option value="ARCH D">ARCH D (24x36)</option>
                    <option value="ARCH E">ARCH E (36x48)</option>
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="A2">A2</option>
                    <option value="A1">A1</option>
                    <option value="A0">A0</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Upload Drawing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawing Viewer */}
      {viewingDrawing && (
        <DrawingViewer
          document={viewingDrawing}
          onClose={() => setViewingDrawing(null)}
          onUpdate={loadDrawings}
        />
      )}

      {/* ASI Manager */}
      {showASIManager && (
        <ASIManager
          projectId={projectId}
          onClose={() => setShowASIManager(false)}
        />
      )}
    </div>
  );
};

export default Drawings;
