import React, { useState, useEffect, useRef } from 'react';
import { Square, Circle, ArrowRight, Type, ZoomIn, ZoomOut, Trash2, X } from 'lucide-react';
import './DrawingMarkup.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const DrawingMarkup = ({ documentId, documentUrl, token, onClose }) => {
  const [markups, setMarkups] = useState([]);
  const [markupMode, setMarkupMode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentMarkup, setCurrentMarkup] = useState(null);

  const pdfCanvasRef = useRef(null);
  const markupCanvasRef = useRef(null);
  const pdfDocRef = useRef(null);

  // Load PDF.js from CDN and then load the PDF
  useEffect(() => {
    let cancelled = false;

    const loadPdfJs = async () => {
      if (window.pdfjsLib) return;

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve();
        };
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const init = async () => {
      try {
        await loadPdfJs();

        if (cancelled) return;

        console.log('Loading PDF from:', documentUrl);

        const loadingTask = window.pdfjsLib.getDocument(documentUrl);
        const pdf = await loadingTask.promise;

        if (cancelled) return;

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setPdfLoading(false);
        renderPage(1, pdf);
      } catch (err) {
        console.error('PDF load error:', err);
        if (!cancelled) {
          setPdfError(`Failed to load PDF: ${err.message}`);
          setPdfLoading(false);
        }
      }
    };

    init();
    loadMarkups();

    return () => { cancelled = true; };
  }, [documentUrl]);

  const renderPage = async (num, pdf = pdfDocRef.current) => {
    if (!pdf) return;

    // Wait for canvas to be available
    const waitForCanvas = () => {
      return new Promise((resolve) => {
        if (pdfCanvasRef.current) {
          resolve();
        } else {
          setTimeout(() => waitForCanvas().then(resolve), 50);
        }
      });
    };

    await waitForCanvas();

    try {
      const page = await pdf.getPage(num);
      const canvas = pdfCanvasRef.current;
      const ctx = canvas.getContext('2d');

      const scale = zoom * 1.5;
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (markupCanvasRef.current) {
        markupCanvasRef.current.width = viewport.width;
        markupCanvasRef.current.height = viewport.height;
      }

      await page.render({ canvasContext: ctx, viewport }).promise;
      setPageNum(num);
    } catch (err) {
      console.error('Page render error:', err);
    }
  };

  // Re-render when zoom changes
  useEffect(() => {
    if (pdfDocRef.current && !pdfLoading && pdfCanvasRef.current) {
      renderPage(pageNum).then(() => {
        drawMarkups();
      });
    }
  }, [zoom]);

  const loadMarkups = async () => {
    if (!documentId || !token) {
      console.error('Cannot load markups: missing documentId or token');
      return;
    }

    try {
      console.log('Loading markups for document:', documentId);

      const response = await fetch(`${API_URL}/drawings/${documentId}/markups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Load markups response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('No markups found (404) - this is normal for new drawings');
          setMarkups([]);
          return;
        }
        console.error('Failed to load markups:', response.status);
        return;
      }

      const data = await response.json();
      console.log('Loaded markups:', data);

      const loadedMarkups = (data.markups || []).map(m => ({
        ...m,
        markup_data: typeof m.markup_data === 'string' ? JSON.parse(m.markup_data) : m.markup_data
      }));

      console.log('Processed markups:', loadedMarkups);
      setMarkups(loadedMarkups);
    } catch (err) {
      console.error('Failed to load markups:', err);
    }
  };

  const drawMarkups = () => {
    const canvas = markupCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = zoom * 1.5;

    // Draw saved markups
    markups.forEach(markup => {
      const d = markup.markup_data;
      ctx.strokeStyle = d.color || '#ef4444';
      ctx.fillStyle = d.color || '#ef4444';
      ctx.lineWidth = 2;
      ctx.font = '14px Arial';

      if (d.type === 'rectangle') {
        ctx.strokeRect(d.x * scale, d.y * scale, d.width * scale, d.height * scale);
      } else if (d.type === 'circle') {
        ctx.beginPath();
        const centerX = (d.x + d.width / 2) * scale;
        const centerY = (d.y + d.height / 2) * scale;
        const radius = (Math.abs(d.width) / 2) * scale;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (d.type === 'arrow') {
        const headlen = 10;
        const endX = (d.x + d.width) * scale;
        const endY = (d.y + d.height) * scale;
        const angle = Math.atan2(d.height * scale, d.width * scale);

        ctx.beginPath();
        ctx.moveTo(d.x * scale, d.y * scale);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (d.type === 'text') {
        ctx.fillText(d.text, d.x * scale, d.y * scale);
      }
    });

    // Draw current markup being created
    if (currentMarkup && isDrawing) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      const c = currentMarkup;

      if (c.type === 'rectangle') {
        ctx.strokeRect(c.startX * scale, c.startY * scale, (c.endX - c.startX) * scale, (c.endY - c.startY) * scale);
      } else if (c.type === 'circle') {
        const radius = Math.sqrt(Math.pow(c.endX - c.startX, 2) + Math.pow(c.endY - c.startY, 2)) / 2;
        ctx.beginPath();
        ctx.arc(((c.startX + c.endX) / 2) * scale, ((c.startY + c.endY) / 2) * scale, radius * scale, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (c.type === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(c.startX * scale, c.startY * scale);
        ctx.lineTo(c.endX * scale, c.endY * scale);
        ctx.stroke();
      }
    }
  };

  useEffect(() => {
    if (!pdfLoading && markupCanvasRef.current) {
      drawMarkups();
    }
  }, [markups, currentMarkup, isDrawing, pdfLoading, pageNum]);

  const getCanvasCoords = (e) => {
    const canvas = markupCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = zoom * 1.5;
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  };

  const handleMouseDown = (e) => {
    if (!markupMode) return;
    const pos = getCanvasCoords(e);

    if (markupMode === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        saveMarkup({ type: 'text', x: pos.x, y: pos.y, text, color: '#3b82f6' });
      }
      setMarkupMode(null);
      return;
    }

    setIsDrawing(true);
    setStartPos(pos);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPos) return;
    const pos = getCanvasCoords(e);
    setCurrentMarkup({
      type: markupMode,
      startX: startPos.x,
      startY: startPos.y,
      endX: pos.x,
      endY: pos.y
    });
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || !startPos) return;
    const pos = getCanvasCoords(e);

    saveMarkup({
      type: markupMode,
      x: startPos.x,
      y: startPos.y,
      width: pos.x - startPos.x,
      height: pos.y - startPos.y,
      color: '#ef4444'
    });

    setIsDrawing(false);
    setCurrentMarkup(null);
    setStartPos(null);
    setMarkupMode(null);
  };

  const saveMarkup = async (markupData) => {
    try {
      console.log('Saving markup:', { documentId, markupData });

      const response = await fetch(`${API_URL}/drawings/${documentId}/markups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markup_data: markupData,
          markup_type: 'annotation',
          position_x: markupData.x,
          position_y: markupData.y,
          color: markupData.color || '#ef4444',
          comment: markupData.text || ''
        })
      });

      console.log('Save response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Save failed:', errorData);
        throw new Error(errorData.error || errorData.message || `Save failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Markup saved successfully:', data);

      if (data && data.markup) {
        setMarkups([...markups, { ...data.markup, markup_data: markupData }]);
        alert('Markup saved successfully');
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Failed to save markup:', err);
      alert('Failed to save markup: ' + err.message);
    }
  };

  const deleteMarkup = async (markupId) => {
    if (!window.confirm('Delete this markup?')) return;

    try {
      await fetch(`${API_URL}/drawing-markups/${markupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMarkups(markups.filter(m => m.id !== markupId));
    } catch (err) {
      console.error('Failed to delete markup:', err);
      alert('Failed to delete markup');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
              <X className="w-6 h-6" />
            </button>
            <h3 className="font-semibold text-gray-900">Drawing Markup</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Markup Tools */}
            <button
              onClick={() => setMarkupMode('rectangle')}
              className={`p-2 rounded ${markupMode === 'rectangle' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Rectangle"
            >
              <Square className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMarkupMode('circle')}
              className={`p-2 rounded ${markupMode === 'circle' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Circle"
            >
              <Circle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMarkupMode('arrow')}
              className={`p-2 rounded ${markupMode === 'arrow' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Arrow"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMarkupMode('text')}
              className={`p-2 rounded ${markupMode === 'text' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Text"
            >
              <Type className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            {/* Zoom Controls */}
            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-2 text-gray-600 hover:bg-gray-100 rounded">
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600 min-w-16 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="p-2 text-gray-600 hover:bg-gray-100 rounded">
              <ZoomIn className="w-5 h-5" />
            </button>

            {/* Page Navigation */}
            {numPages > 1 && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-2" />
                <button
                  onClick={() => pageNum > 1 && renderPage(pageNum - 1)}
                  disabled={pageNum <= 1}
                  className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-sm text-gray-600">{pageNum} / {numPages}</span>
                <button
                  onClick={() => pageNum < numPages && renderPage(pageNum + 1)}
                  disabled={pageNum >= numPages}
                  className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer Area */}
        <div className="flex-1 overflow-auto bg-gray-800 p-8 flex items-start justify-center">
          {pdfLoading ? (
            <div className="text-white text-center">
              <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
              <p>Loading PDF...</p>
            </div>
          ) : pdfError ? (
            <div className="text-center text-white">
              <p className="text-red-400 mb-2">{pdfError}</p>
              <p className="text-sm text-gray-400">Document URL: {documentUrl}</p>
            </div>
          ) : (
            <div className="relative shadow-2xl">
              {/* PDF Canvas */}
              <canvas ref={pdfCanvasRef} className="block bg-white" />
              {/* Markup Canvas (overlaid on top) */}
              <canvas
                ref={markupCanvasRef}
                className="absolute top-0 left-0"
                style={{ cursor: markupMode ? 'crosshair' : 'default' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              />
            </div>
          )}
        </div>

        {/* Markups Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h4 className="font-semibold text-gray-900 mb-4">Markups ({markups.length})</h4>
          {markups.length === 0 ? (
            <p className="text-sm text-gray-500">No markups yet. Select a tool above and draw on the PDF.</p>
          ) : (
            <div className="space-y-3">
              {markups.map(markup => (
                <div key={markup.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {markup.markup_data.type === 'rectangle' && <Square className="w-4 h-4" style={{ color: markup.markup_data.color }} />}
                        {markup.markup_data.type === 'circle' && <Circle className="w-4 h-4" style={{ color: markup.markup_data.color }} />}
                        {markup.markup_data.type === 'arrow' && <ArrowRight className="w-4 h-4" style={{ color: markup.markup_data.color }} />}
                        {markup.markup_data.type === 'text' && <Type className="w-4 h-4" style={{ color: markup.markup_data.color }} />}
                        <span className="text-sm font-medium text-gray-900 capitalize">{markup.markup_data.type}</span>
                      </div>
                      {markup.markup_data.text && (
                        <p className="text-sm text-gray-700 mb-1">{markup.markup_data.text}</p>
                      )}
                      {markup.comment && (
                        <p className="text-sm text-gray-700 mb-1">{markup.comment}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {markup.created_by_name || 'You'} • {new Date(markup.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteMarkup(markup.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrawingMarkup;
