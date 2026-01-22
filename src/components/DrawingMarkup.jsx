import React, { useState, useEffect, useRef } from 'react';
import './DrawingMarkup.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const DrawingMarkup = ({ documentId, documentUrl, onClose }) => {
  const [markups, setMarkups] = useState([]);
  const [workflowState, setWorkflowState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tool, setTool] = useState('pan'); // pan, pen, rectangle, circle, text, arrow
  const [color, setColor] = useState('#ff0000');
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedMarkup, setSelectedMarkup] = useState(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);

  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const currentPathRef = useRef([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const token = localStorage.getItem('freecore_token');

  useEffect(() => {
    if (documentId && token) {
      loadDrawingData();
    }
  }, [documentId, token]);

  useEffect(() => {
    if (imageLoaded) {
      redrawCanvas();
    }
  }, [markups, scale, offset, imageLoaded]);

  const loadDrawingData = async () => {
    if (!documentId || !token) {
      console.error('Missing document ID or authentication token');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load workflow state (allow 404 for new drawings)
      try {
        const workflowRes = await fetch(`${API_URL}/drawings/${documentId}/workflow`, {
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

      // Load markups
      try {
        const markupsRes = await fetch(`${API_URL}/drawings/${documentId}/markups`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (markupsRes.ok) {
          const markupsData = await markupsRes.json();
          setMarkups(markupsData.markups || []);
        } else {
          console.error('Failed to load markups:', markupsRes.status);
          setMarkups([]);
        }
      } catch (markupsError) {
        console.error('Error loading markups:', markupsError);
        setMarkups([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load drawing data:', error);
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const container = containerRef.current;

    if (canvas && image && container) {
      // Set canvas size to match image
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      // Calculate initial scale to fit container
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight - 100; // Account for toolbar
      const scaleX = containerWidth / image.naturalWidth;
      const scaleY = containerHeight / image.naturalHeight;
      const initialScale = Math.min(scaleX, scaleY, 1);

      setScale(initialScale);
      setImageLoaded(true);
      redrawCanvas();
    }
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas 2D context');
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw markups
    markups.forEach(markup => {
      if (markup.markup_data) {
        try {
          const data = typeof markup.markup_data === 'string'
            ? JSON.parse(markup.markup_data)
            : markup.markup_data;

          if (data) {
            drawMarkup(ctx, data, markup);
          }
        } catch (parseError) {
          console.error('Failed to parse markup data:', parseError, markup);
        }
      }
    });
  };

  const drawMarkup = (ctx, data, markup) => {
    ctx.strokeStyle = markup.color || '#ff0000';
    ctx.lineWidth = data.lineWidth || 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (data.type === 'path' && data.points && data.points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(data.points[0].x, data.points[0].y);
      for (let i = 1; i < data.points.length; i++) {
        ctx.lineTo(data.points[i].x, data.points[i].y);
      }
      ctx.stroke();
    } else if (data.type === 'rectangle') {
      ctx.strokeRect(data.x, data.y, data.width, data.height);
    } else if (data.type === 'circle') {
      ctx.beginPath();
      ctx.arc(data.x, data.y, data.radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (data.type === 'arrow') {
      drawArrow(ctx, data.x1, data.y1, data.x2, data.y2);
    } else if (data.type === 'text') {
      ctx.font = `${data.fontSize || 16}px Arial`;
      ctx.fillStyle = markup.color || '#ff0000';
      ctx.fillText(data.text, data.x, data.y);
    }

    // Draw position marker if exists
    if (markup.position_x !== null && markup.position_y !== null) {
      ctx.fillStyle = markup.color || '#ff0000';
      ctx.beginPath();
      ctx.arc(markup.position_x, markup.position_y, 8, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const drawArrow = (ctx, x1, y1, x2, y2) => {
    const headLength = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale
    };
  };

  const handleMouseDown = (e) => {
    const coords = getCanvasCoordinates(e);

    if (tool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      return;
    }

    setIsDrawing(true);
    currentPathRef.current = [coords];
  };

  const handleMouseMove = (e) => {
    if (tool === 'pan' && isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (!isDrawing || tool === 'pan') return;

    const coords = getCanvasCoordinates(e);
    currentPathRef.current.push(coords);

    // Draw preview
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    redrawCanvas();

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      if (currentPathRef.current.length > 1) {
        ctx.beginPath();
        ctx.moveTo(currentPathRef.current[0].x, currentPathRef.current[0].y);
        for (let i = 1; i < currentPathRef.current.length; i++) {
          ctx.lineTo(currentPathRef.current[i].x, currentPathRef.current[i].y);
        }
        ctx.stroke();
      }
    } else if (tool === 'rectangle' && currentPathRef.current.length > 0) {
      const start = currentPathRef.current[0];
      const width = coords.x - start.x;
      const height = coords.y - start.y;
      ctx.strokeRect(start.x, start.y, width, height);
    } else if (tool === 'circle' && currentPathRef.current.length > 0) {
      const start = currentPathRef.current[0];
      const radius = Math.sqrt(Math.pow(coords.x - start.x, 2) + Math.pow(coords.y - start.y, 2));
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === 'arrow' && currentPathRef.current.length > 0) {
      const start = currentPathRef.current[0];
      drawArrow(ctx, start.x, start.y, coords.x, coords.y);
    }
  };

  const handleMouseUp = async (e) => {
    if (tool === 'pan') {
      setIsPanning(false);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPathRef.current.length === 0) return;

    const coords = getCanvasCoordinates(e);
    let markupData = { lineWidth, color };

    if (tool === 'pen') {
      markupData.type = 'path';
      markupData.points = currentPathRef.current;
    } else if (tool === 'rectangle') {
      const start = currentPathRef.current[0];
      markupData.type = 'rectangle';
      markupData.x = start.x;
      markupData.y = start.y;
      markupData.width = coords.x - start.x;
      markupData.height = coords.y - start.y;
    } else if (tool === 'circle') {
      const start = currentPathRef.current[0];
      markupData.type = 'circle';
      markupData.x = start.x;
      markupData.y = start.y;
      markupData.radius = Math.sqrt(Math.pow(coords.x - start.x, 2) + Math.pow(coords.y - start.y, 2));
    } else if (tool === 'arrow') {
      const start = currentPathRef.current[0];
      markupData.type = 'arrow';
      markupData.x1 = start.x;
      markupData.y1 = start.y;
      markupData.x2 = coords.x;
      markupData.y2 = coords.y;
    } else if (tool === 'text') {
      const text = prompt('Enter text:');
      if (!text) {
        currentPathRef.current = [];
        return;
      }
      markupData.type = 'text';
      markupData.text = text;
      markupData.x = currentPathRef.current[0].x;
      markupData.y = currentPathRef.current[0].y;
      markupData.fontSize = 16;
    }

    // Show comment dialog
    setSelectedMarkup({ markup_data: markupData, position_x: currentPathRef.current[0].x, position_y: currentPathRef.current[0].y });
    setShowCommentDialog(true);
    currentPathRef.current = [];
  };

  const saveMarkup = async () => {
    if (!selectedMarkup) return;

    if (!token || !documentId) {
      alert('Authentication error. Please refresh and try again.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/drawings/${documentId}/markups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markup_data: selectedMarkup.markup_data,
          markup_type: 'annotation',
          position_x: selectedMarkup.position_x,
          position_y: selectedMarkup.position_y,
          comment: comment,
          color: color
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Save failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data && data.markup) {
        setMarkups([...markups, data.markup]);
      }
      setComment('');
      setShowCommentDialog(false);
      setSelectedMarkup(null);
    } catch (error) {
      console.error('Failed to save markup:', error);
      alert('Failed to save markup: ' + error.message);
    }
  };

  const handleZoom = (delta) => {
    const newScale = Math.max(0.1, Math.min(5, scale + delta));
    setScale(newScale);
  };

  const handleDeleteMarkup = async (markupId) => {
    if (!window.confirm('Delete this markup?')) return;

    if (!token || !markupId) {
      alert('Authentication error. Please refresh and try again.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/drawing-markups/${markupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Delete failed with status ${response.status}`);
      }

      setMarkups(markups.filter(m => m.id !== markupId));
    } catch (error) {
      console.error('Failed to delete markup:', error);
      alert('Failed to delete markup: ' + error.message);
    }
  };

  const handleResolveMarkup = async (markupId) => {
    if (!token || !markupId) {
      alert('Authentication error. Please refresh and try again.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/drawing-markups/${markupId}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Resolve failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data && data.markup) {
        setMarkups(markups.map(m => m.id === markupId ? data.markup : m));
      }
    } catch (error) {
      console.error('Failed to resolve markup:', error);
      alert('Failed to resolve markup: ' + error.message);
    }
  };

  if (loading) {
    return <div className="drawing-markup-loading">Loading drawing...</div>;
  }

  return (
    <div className="drawing-markup-container" ref={containerRef}>
      <div className="drawing-markup-header">
        <h2>Drawing Markup</h2>
        <button onClick={onClose} className="close-button">✕</button>
      </div>

      <div className="drawing-toolbar">
        <div className="tool-group">
          <button
            className={tool === 'pan' ? 'active' : ''}
            onClick={() => setTool('pan')}
            title="Pan (move drawing)">
            ✋
          </button>
          <button
            className={tool === 'pen' ? 'active' : ''}
            onClick={() => setTool('pen')}
            title="Pen">
            ✏️
          </button>
          <button
            className={tool === 'rectangle' ? 'active' : ''}
            onClick={() => setTool('rectangle')}
            title="Rectangle">
            ▭
          </button>
          <button
            className={tool === 'circle' ? 'active' : ''}
            onClick={() => setTool('circle')}
            title="Circle">
            ⭕
          </button>
          <button
            className={tool === 'arrow' ? 'active' : ''}
            onClick={() => setTool('arrow')}
            title="Arrow">
            ➤
          </button>
          <button
            className={tool === 'text' ? 'active' : ''}
            onClick={() => setTool('text')}
            title="Text">
            T
          </button>
        </div>

        <div className="tool-group">
          <label>Color:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <label>Width:</label>
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
          />
          <span>{lineWidth}px</span>
        </div>

        <div className="tool-group">
          <button onClick={() => handleZoom(0.1)}>+</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => handleZoom(-0.1)}>−</button>
          <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}>Reset</button>
        </div>
      </div>

      <div className="drawing-canvas-wrapper">
        <div
          className="drawing-canvas-container"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            cursor: tool === 'pan' ? 'grab' : 'crosshair'
          }}
        >
          <img
            ref={imageRef}
            src={documentUrl}
            alt="Drawing"
            onLoad={handleImageLoad}
            style={{ display: 'block' }}
          />
          <canvas
            ref={canvasRef}
            className="drawing-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
        </div>
      </div>

      <div className="markups-sidebar">
        <h3>Markups ({markups.length})</h3>
        <div className="markups-list">
          {markups.map(markup => (
            <div key={markup.id} className={`markup-item ${markup.status}`}>
              <div className="markup-header">
                <span className="markup-author">{markup.created_by_name}</span>
                <span className="markup-status">{markup.status}</span>
              </div>
              {markup.comment && <p className="markup-comment">{markup.comment}</p>}
              <div className="markup-actions">
                {markup.status === 'open' && (
                  <button onClick={() => handleResolveMarkup(markup.id)}>Resolve</button>
                )}
                <button onClick={() => handleDeleteMarkup(markup.id)}>Delete</button>
              </div>
              <div className="markup-date">
                {new Date(markup.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCommentDialog && (
        <div className="comment-dialog-overlay">
          <div className="comment-dialog">
            <h3>Add Comment (Optional)</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter a comment about this markup..."
              rows="4"
            />
            <div className="comment-dialog-actions">
              <button onClick={saveMarkup}>Save</button>
              <button onClick={() => {
                setShowCommentDialog(false);
                setComment('');
                setSelectedMarkup(null);
                redrawCanvas();
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingMarkup;
