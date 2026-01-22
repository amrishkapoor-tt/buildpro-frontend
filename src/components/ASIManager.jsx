import React, { useState, useEffect } from 'react';
import './ASIManager.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const ASIManager = ({ projectId, onClose }) => {
  const [asis, setAsis] = useState([]);
  const [selectedASI, setSelectedASI] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    asi_number: '',
    title: '',
    description: '',
    issued_by: '',
    issue_date: '',
    received_date: '',
    affects_cost: false,
    affects_schedule: false,
    estimated_cost_impact: '',
    estimated_schedule_impact_days: ''
  });

  const token = localStorage.getItem('freecore_token');

  useEffect(() => {
    loadASIs();
  }, [projectId, filterStatus]);

  const loadASIs = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const response = await fetch(`${API_URL}/projects/${projectId}/asis${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        // Silently handle all HTTP errors - just show empty state
        console.log('ASI endpoint returned:', response.status);
        setAsis([]);
      } else {
        const data = await response.json();
        setAsis(data.asis || []);
      }
      setLoading(false);
    } catch (error) {
      // Silently handle network errors - just show empty state
      console.error('Error loading ASIs:', error);
      setAsis([]);
      setLoading(false);
    }
  };

  const loadASIDetails = async (asiId) => {
    try {
      const response = await fetch(`${API_URL}/asis/${asiId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load ASI details');
      }

      const data = await response.json();
      setSelectedASI(data.asi);
    } catch (error) {
      console.error('Error loading ASI details:', error);
      alert('Unable to load ASI details: ' + error.message);
    }
  };

  const handleCreateASI = async (e) => {
    e.preventDefault();

    if (!formData.asi_number || !formData.title) {
      alert('ASI number and title are required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/asis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          estimated_cost_impact: formData.estimated_cost_impact ? parseFloat(formData.estimated_cost_impact) : null,
          estimated_schedule_impact_days: formData.estimated_schedule_impact_days ? parseInt(formData.estimated_schedule_impact_days) : null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create ASI');
      }

      const data = await response.json();
      setAsis([data.asi, ...asis]);
      setShowCreateForm(false);
      setFormData({
        asi_number: '',
        title: '',
        description: '',
        issued_by: '',
        issue_date: '',
        received_date: '',
        affects_cost: false,
        affects_schedule: false,
        estimated_cost_impact: '',
        estimated_schedule_impact_days: ''
      });
      alert('ASI created successfully');
    } catch (error) {
      console.error('Failed to create ASI:', error);
      alert('Failed to create ASI: ' + error.message);
    }
  };

  const handleUpdateASI = async (asiId, updates) => {
    try {
      const response = await fetch(`${API_URL}/asis/${asiId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update ASI');

      const data = await response.json();
      setAsis(asis.map(a => a.id === asiId ? data.asi : a));
      if (selectedASI && selectedASI.id === asiId) {
        loadASIDetails(asiId);
      }
      alert('ASI updated successfully');
    } catch (error) {
      console.error('Failed to update ASI:', error);
      alert('Failed to update ASI: ' + error.message);
    }
  };

  const handleLinkDrawing = async (asiId) => {
    const documentId = prompt('Enter drawing document ID to link:');
    if (!documentId) return;

    const impactDescription = prompt('Describe the impact (optional):');
    const requiresRevision = window.confirm('Does this require a drawing revision?');

    try {
      const response = await fetch(`${API_URL}/asis/${asiId}/drawings/${documentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          impact_description: impactDescription || null,
          requires_revision: requiresRevision
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to link drawing');
      }

      loadASIDetails(asiId);
      alert('Drawing linked successfully');
    } catch (error) {
      console.error('Failed to link drawing:', error);
      alert('Failed to link drawing: ' + error.message);
    }
  };

  const handleMarkRevisionComplete = async (asiDrawingId) => {
    try {
      const response = await fetch(`${API_URL}/asi-drawings/${asiDrawingId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to mark revision complete');

      if (selectedASI) {
        loadASIDetails(selectedASI.id);
      }
      alert('Revision marked as complete');
    } catch (error) {
      console.error('Failed to mark revision complete:', error);
      alert('Failed to mark revision complete: ' + error.message);
    }
  };

  const handleDeleteASI = async (asiId, asiNumber) => {
    if (!window.confirm(`Delete ASI ${asiNumber}? This cannot be undone.`)) return;

    try {
      const response = await fetch(`${API_URL}/asis/${asiId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete ASI');

      setAsis(asis.filter(a => a.id !== asiId));
      if (selectedASI && selectedASI.id === asiId) {
        setSelectedASI(null);
      }
      alert('ASI deleted successfully');
    } catch (error) {
      console.error('Failed to delete ASI:', error);
      alert('Failed to delete ASI: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'received': return 'status-received';
      case 'under_review': return 'status-under-review';
      case 'incorporated': return 'status-incorporated';
      case 'superseded': return 'status-superseded';
      default: return '';
    }
  };

  return (
    <div className="asi-manager-overlay">
      <div className="asi-manager">
        <div className="asi-manager-header">
          <h2>ASI Management</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        <div className="asi-manager-toolbar">
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="primary-button">
            {showCreateForm ? 'Cancel' : '+ New ASI'}
          </button>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter">
            <option value="">All Statuses</option>
            <option value="received">Received</option>
            <option value="under_review">Under Review</option>
            <option value="incorporated">Incorporated</option>
            <option value="superseded">Superseded</option>
          </select>
        </div>

        <div className="asi-manager-content">
          {showCreateForm && (
            <div className="asi-create-form">
              <h3>Create New ASI</h3>
              <form onSubmit={handleCreateASI}>
                <div className="form-row">
                  <div className="form-group">
                    <label>ASI Number *</label>
                    <input
                      type="text"
                      value={formData.asi_number}
                      onChange={(e) => setFormData({ ...formData, asi_number: e.target.value })}
                      required
                      placeholder="e.g., ASI-001"
                    />
                  </div>
                  <div className="form-group">
                    <label>Issued By</label>
                    <input
                      type="text"
                      value={formData.issued_by}
                      onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })}
                      placeholder="Architect/Engineer firm"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Brief title of the ASI"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    placeholder="Detailed description of the supplemental instruction"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Issue Date</label>
                    <input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Received Date</label>
                    <input
                      type="date"
                      value={formData.received_date}
                      onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group-checkbox">
                    <input
                      type="checkbox"
                      id="affects_cost"
                      checked={formData.affects_cost}
                      onChange={(e) => setFormData({ ...formData, affects_cost: e.target.checked })}
                    />
                    <label htmlFor="affects_cost">Affects Cost</label>
                  </div>
                  <div className="form-group-checkbox">
                    <input
                      type="checkbox"
                      id="affects_schedule"
                      checked={formData.affects_schedule}
                      onChange={(e) => setFormData({ ...formData, affects_schedule: e.target.checked })}
                    />
                    <label htmlFor="affects_schedule">Affects Schedule</label>
                  </div>
                </div>

                {formData.affects_cost && (
                  <div className="form-group">
                    <label>Estimated Cost Impact ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.estimated_cost_impact}
                      onChange={(e) => setFormData({ ...formData, estimated_cost_impact: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                )}

                {formData.affects_schedule && (
                  <div className="form-group">
                    <label>Estimated Schedule Impact (days)</label>
                    <input
                      type="number"
                      value={formData.estimated_schedule_impact_days}
                      onChange={(e) => setFormData({ ...formData, estimated_schedule_impact_days: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="primary-button">Create ASI</button>
                  <button type="button" onClick={() => setShowCreateForm(false)} className="secondary-button">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="asi-list-container">
            {loading ? (
              <div className="loading">Loading ASIs...</div>
            ) : asis.length === 0 ? (
              <div className="no-data">No ASIs found</div>
            ) : (
              <div className="asi-grid">
                <div className="asi-list">
                  <h3>ASI List ({asis.length})</h3>
                  {asis.map(asi => (
                    <div
                      key={asi.id}
                      className={`asi-item ${selectedASI && selectedASI.id === asi.id ? 'selected' : ''}`}
                      onClick={() => loadASIDetails(asi.id)}
                    >
                      <div className="asi-item-header">
                        <span className="asi-number">{asi.asi_number}</span>
                        <span className={`asi-status ${getStatusColor(asi.status)}`}>
                          {asi.status}
                        </span>
                      </div>
                      <h4>{asi.title}</h4>
                      <div className="asi-item-meta">
                        <span>Issued by: {asi.issued_by || 'N/A'}</span>
                        {asi.issue_date && (
                          <span>Date: {new Date(asi.issue_date).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="asi-item-impact">
                        {asi.affects_cost && <span className="impact-badge cost">💰 Cost Impact</span>}
                        {asi.affects_schedule && <span className="impact-badge schedule">📅 Schedule Impact</span>}
                      </div>
                      <div className="asi-item-footer">
                        Affects {asi.affected_drawings_count} drawing(s)
                      </div>
                    </div>
                  ))}
                </div>

                {selectedASI && (
                  <div className="asi-details">
                    <h3>ASI Details</h3>
                    <div className="asi-details-content">
                      <div className="detail-group">
                        <label>ASI Number:</label>
                        <span>{selectedASI.asi_number}</span>
                      </div>
                      <div className="detail-group">
                        <label>Status:</label>
                        <select
                          value={selectedASI.status}
                          onChange={(e) => handleUpdateASI(selectedASI.id, { status: e.target.value })}
                          className="status-select"
                        >
                          <option value="received">Received</option>
                          <option value="under_review">Under Review</option>
                          <option value="incorporated">Incorporated</option>
                          <option value="superseded">Superseded</option>
                        </select>
                      </div>
                      <div className="detail-group">
                        <label>Title:</label>
                        <span>{selectedASI.title}</span>
                      </div>
                      {selectedASI.description && (
                        <div className="detail-group">
                          <label>Description:</label>
                          <p>{selectedASI.description}</p>
                        </div>
                      )}
                      <div className="detail-group">
                        <label>Issued By:</label>
                        <span>{selectedASI.issued_by || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <div className="detail-group">
                          <label>Issue Date:</label>
                          <span>{selectedASI.issue_date ? new Date(selectedASI.issue_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="detail-group">
                          <label>Received Date:</label>
                          <span>{selectedASI.received_date ? new Date(selectedASI.received_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>

                      {(selectedASI.affects_cost || selectedASI.affects_schedule) && (
                        <div className="impact-section">
                          <h4>Impact Assessment</h4>
                          {selectedASI.affects_cost && (
                            <div className="detail-group">
                              <label>Cost Impact:</label>
                              <span>
                                {selectedASI.estimated_cost_impact
                                  ? `$${parseFloat(selectedASI.estimated_cost_impact).toLocaleString()}`
                                  : 'TBD'}
                              </span>
                            </div>
                          )}
                          {selectedASI.affects_schedule && (
                            <div className="detail-group">
                              <label>Schedule Impact:</label>
                              <span>
                                {selectedASI.estimated_schedule_impact_days
                                  ? `${selectedASI.estimated_schedule_impact_days} days`
                                  : 'TBD'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="affected-drawings-section">
                        <div className="section-header">
                          <h4>Affected Drawings ({selectedASI.affected_drawings?.length || 0})</h4>
                          <button onClick={() => handleLinkDrawing(selectedASI.id)} className="link-button">
                            + Link Drawing
                          </button>
                        </div>
                        <div className="drawings-list">
                          {selectedASI.affected_drawings && selectedASI.affected_drawings.length > 0 ? (
                            selectedASI.affected_drawings.map(drawing => (
                              <div key={drawing.id} className="drawing-item">
                                <div className="drawing-info">
                                  <span className="drawing-number">{drawing.drawing_number || 'N/A'}</span>
                                  <span className="drawing-name">{drawing.drawing_name}</span>
                                  {drawing.discipline && (
                                    <span className="drawing-discipline">{drawing.discipline}</span>
                                  )}
                                </div>
                                {drawing.impact_description && (
                                  <p className="impact-description">{drawing.impact_description}</p>
                                )}
                                <div className="drawing-status">
                                  {drawing.requires_revision && (
                                    drawing.revision_completed ? (
                                      <span className="revision-complete">✓ Revision Complete</span>
                                    ) : (
                                      <button
                                        onClick={() => handleMarkRevisionComplete(drawing.id)}
                                        className="mark-complete-button"
                                      >
                                        Mark Revision Complete
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="no-drawings">No drawings linked to this ASI</p>
                          )}
                        </div>
                      </div>

                      <div className="asi-actions">
                        <button
                          onClick={() => handleDeleteASI(selectedASI.id, selectedASI.asi_number)}
                          className="delete-button"
                        >
                          Delete ASI
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ASIManager;
