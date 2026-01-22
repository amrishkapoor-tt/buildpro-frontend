import React, { useState, useEffect } from 'react';
import DrawingMarkup from './DrawingMarkup';
import './DrawingViewer.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const DrawingViewer = ({ document, token, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [workflowState, setWorkflowState] = useState(null);
  const [workflowHistory, setWorkflowHistory] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [markups, setMarkups] = useState([]);
  const [showMarkupCanvas, setShowMarkupCanvas] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newWorkflowState, setNewWorkflowState] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (document && document.id && token) {
      loadDrawingData();
      loadUsers();
    }
  }, [document?.id, token]);

  const loadDrawingData = async () => {
    if (!document || !document.id || !token) {
      console.error('Missing document ID or authentication token');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load workflow state (allow 404 for new drawings)
      try {
        const workflowRes = await fetch(`${API_URL}/drawings/${document.id}/workflow`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (workflowRes.ok) {
          const workflowData = await workflowRes.json();
          setWorkflowState(workflowData.workflow_state || null);
        } else if (workflowRes.status !== 404) {
          console.error('Failed to load workflow state:', workflowRes.status);
        }
      } catch (workflowError) {
        console.error('Error loading workflow state:', workflowError);
      }

      // Load workflow history
      try {
        const historyRes = await fetch(`${API_URL}/drawings/${document.id}/workflow-history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setWorkflowHistory(historyData.history || []);
        }
      } catch (historyError) {
        console.error('Error loading workflow history:', historyError);
        setWorkflowHistory([]);
      }

      // Load distributions
      try {
        const distRes = await fetch(`${API_URL}/drawings/${document.id}/distributions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (distRes.ok) {
          const distData = await distRes.json();
          setDistributions(distData.distributions || []);
        }
      } catch (distError) {
        console.error('Error loading distributions:', distError);
        setDistributions([]);
      }

      // Load reviews
      try {
        const reviewsRes = await fetch(`${API_URL}/drawings/${document.id}/reviews`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.reviews || []);
        }
      } catch (reviewsError) {
        console.error('Error loading reviews:', reviewsError);
        setReviews([]);
      }

      // Load markups
      try {
        const markupsRes = await fetch(`${API_URL}/drawings/${document.id}/markups`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (markupsRes.ok) {
          const markupsData = await markupsRes.json();
          setMarkups(markupsData.markups || []);
        }
      } catch (markupsError) {
        console.error('Error loading markups:', markupsError);
        setMarkups([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load drawing data:', error);
      // Don't show alert - individual errors are already logged
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleUpdateWorkflow = async (e) => {
    e.preventDefault();

    if (!newWorkflowState) {
      alert('Please select a workflow state');
      return;
    }

    if (!token || !document || !document.id) {
      alert('Authentication error. Please refresh and try again.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/drawings/${document.id}/workflow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow_state: newWorkflowState,
          assigned_to: assignedTo || null,
          due_date: dueDate || null,
          notes: notes || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Update failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data && data.workflow_state) {
        setWorkflowState(data.workflow_state);
      }
      setNewWorkflowState('');
      setAssignedTo('');
      setDueDate('');
      setNotes('');
      loadDrawingData();
      if (onUpdate) onUpdate();
      alert('Workflow updated successfully');
    } catch (error) {
      console.error('Failed to update workflow:', error);
      alert('Failed to update workflow: ' + error.message);
    }
  };

  const handleDistribute = async () => {
    if (!token || !document || !document.id) {
      alert('Authentication error. Please refresh and try again.');
      return;
    }

    const userId = prompt('Enter user ID to distribute to (or leave empty for role-based):');
    const role = !userId ? prompt('Enter role to distribute to:') : null;

    if (!userId && !role) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/drawings/${document.id}/distribute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          distributed_to_user_id: userId || null,
          distributed_to_role: role || null,
          distribution_method: 'manual'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Distribution failed with status ${response.status}`);
      }

      loadDrawingData();
      alert('Drawing distributed successfully');
    } catch (error) {
      console.error('Failed to distribute:', error);
      alert('Failed to distribute: ' + error.message);
    }
  };

  const handleRequestReview = async () => {
    if (!token || !document || !document.id) {
      alert('Authentication error. Please refresh and try again.');
      return;
    }

    const reviewerId = prompt('Enter reviewer user ID:');
    if (!reviewerId) return;

    const discipline = prompt('Enter discipline (optional):');

    try {
      const response = await fetch(`${API_URL}/drawings/${document.id}/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reviewer_id: reviewerId,
          discipline: discipline || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Review request failed with status ${response.status}`);
      }

      loadDrawingData();
      alert('Review requested successfully');
    } catch (error) {
      console.error('Failed to request review:', error);
      alert('Failed to request review: ' + error.message);
    }
  };

  if (showMarkupCanvas) {
    return (
      <DrawingMarkup
        documentId={document.id}
        documentUrl={`${API_URL}/documents/${document.id}/preview?token=${token}`}
        token={token}
        onClose={() => {
          setShowMarkupCanvas(false);
          loadDrawingData();
        }}
      />
    );
  }

  const workflowStates = [
    { value: 'received', label: 'Received' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'markup_in_progress', label: 'Markup In Progress' },
    { value: 'asi_pending', label: 'ASI Pending' },
    { value: 'distributed', label: 'Distributed' },
    { value: 'superseded', label: 'Superseded' },
    { value: 'archived', label: 'Archived' }
  ];

  return (
    <div className="drawing-viewer-overlay">
      <div className="drawing-viewer">
        <div className="drawing-viewer-header">
          <h2>{document.name}</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        <div className="drawing-viewer-tabs">
          <button
            className={activeTab === 'info' ? 'active' : ''}
            onClick={() => setActiveTab('info')}>
            Info
          </button>
          <button
            className={activeTab === 'workflow' ? 'active' : ''}
            onClick={() => setActiveTab('workflow')}>
            Workflow
          </button>
          <button
            className={activeTab === 'markups' ? 'active' : ''}
            onClick={() => setActiveTab('markups')}>
            Markups ({markups.length})
          </button>
          <button
            className={activeTab === 'reviews' ? 'active' : ''}
            onClick={() => setActiveTab('reviews')}>
            Reviews ({reviews.length})
          </button>
          <button
            className={activeTab === 'distribution' ? 'active' : ''}
            onClick={() => setActiveTab('distribution')}>
            Distribution
          </button>
        </div>

        <div className="drawing-viewer-content">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              {activeTab === 'info' && (
                <div className="tab-content">
                  <h3>Drawing Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Drawing Number:</label>
                      <span>{document.drawing_number || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Discipline:</label>
                      <span>{document.discipline || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Sheet Title:</label>
                      <span>{document.sheet_title || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Revision:</label>
                      <span>{document.revision_number || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Issue Date:</label>
                      <span>{document.issue_date ? new Date(document.issue_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Scale:</label>
                      <span>{document.drawing_scale || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Sheet Size:</label>
                      <span>{document.sheet_size || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Current Revision:</label>
                      <span>{document.is_current_revision ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  <div className="info-actions">
                    <button onClick={() => setShowMarkupCanvas(true)} className="primary-button">
                      Open Markup Canvas
                    </button>
                    <a
                      href={`${API_URL}/documents/${document.id}/download?token=${token}`}
                      download
                      className="button">
                      Download
                    </a>
                  </div>
                </div>
              )}

              {activeTab === 'workflow' && (
                <div className="tab-content">
                  <h3>Current Workflow State</h3>
                  {workflowState ? (
                    <div className="workflow-state-card">
                      <div className="state-badge">{workflowState.workflow_state}</div>
                      {workflowState.assigned_to_name && (
                        <div>Assigned to: {workflowState.assigned_to_name}</div>
                      )}
                      {workflowState.due_date && (
                        <div>Due: {new Date(workflowState.due_date).toLocaleDateString()}</div>
                      )}
                      {workflowState.notes && <div>Notes: {workflowState.notes}</div>}
                      <div className="state-date">
                        Updated: {new Date(workflowState.created_at).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <p>No workflow state set</p>
                  )}

                  <h3>Update Workflow</h3>
                  <form onSubmit={handleUpdateWorkflow} className="workflow-form">
                    <div className="form-group">
                      <label>New State:</label>
                      <select
                        value={newWorkflowState}
                        onChange={(e) => setNewWorkflowState(e.target.value)}
                        required>
                        <option value="">Select state...</option>
                        {workflowStates.map(state => (
                          <option key={state.value} value={state.value}>{state.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Assign To:</label>
                      <select
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}>
                        <option value="">Unassigned</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Due Date:</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Notes:</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows="3"
                      />
                    </div>
                    <button type="submit" className="primary-button">Update Workflow</button>
                  </form>

                  <h3>Workflow History</h3>
                  <div className="history-list">
                    {workflowHistory.map(item => (
                      <div key={item.id} className="history-item">
                        <div className="history-header">
                          <span className="state-transition">
                            {item.from_state || 'none'} → {item.to_state}
                          </span>
                          <span className="history-date">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div>Changed by: {item.changed_by_name}</div>
                        {item.change_reason && <div>Reason: {item.change_reason}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'markups' && (
                <div className="tab-content">
                  <h3>Drawing Markups</h3>
                  <button onClick={() => setShowMarkupCanvas(true)} className="primary-button">
                    Open Markup Canvas
                  </button>
                  <div className="markups-list">
                    {markups.map(markup => (
                      <div key={markup.id} className={`markup-card ${markup.status}`}>
                        <div className="markup-header">
                          <span className="markup-author">{markup.created_by_name}</span>
                          <span className="markup-status">{markup.status}</span>
                        </div>
                        {markup.comment && <p>{markup.comment}</p>}
                        <div className="markup-date">
                          {new Date(markup.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="tab-content">
                  <h3>Coordination Reviews</h3>
                  <button onClick={handleRequestReview} className="primary-button">
                    Request Review
                  </button>
                  <div className="reviews-list">
                    {reviews.map(review => (
                      <div key={review.id} className="review-card">
                        <div className="review-header">
                          <span>Reviewer: {review.reviewer_name}</span>
                          <span className={`review-status ${review.review_status}`}>
                            {review.review_status}
                          </span>
                        </div>
                        {review.discipline && <div>Discipline: {review.discipline}</div>}
                        {review.review_notes && <p>{review.review_notes}</p>}
                        {review.clash_detected && (
                          <div className="clash-warning">
                            ⚠️ Clash Detected: {review.clash_description}
                          </div>
                        )}
                        <div className="review-date">
                          Requested: {new Date(review.requested_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'distribution' && (
                <div className="tab-content">
                  <h3>Distribution History</h3>
                  <button onClick={handleDistribute} className="primary-button">
                    Distribute Drawing
                  </button>
                  <div className="distribution-list">
                    {distributions.map(dist => (
                      <div key={dist.id} className="distribution-card">
                        <div className="dist-header">
                          <span>
                            To: {dist.distributed_to_name || dist.distributed_to_role}
                          </span>
                          <span className={dist.acknowledged ? 'acknowledged' : 'pending'}>
                            {dist.acknowledged ? '✓ Acknowledged' : 'Pending'}
                          </span>
                        </div>
                        <div>By: {dist.distributed_by_name}</div>
                        <div>Method: {dist.distribution_method}</div>
                        {dist.distribution_notes && <p>{dist.distribution_notes}</p>}
                        <div className="dist-date">
                          {new Date(dist.distributed_at).toLocaleString()}
                        </div>
                        {dist.acknowledged_at && (
                          <div className="ack-date">
                            Acknowledged: {new Date(dist.acknowledged_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrawingViewer;
