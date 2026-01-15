import React, { useState, useEffect, useRef } from 'react';
import { Layers, FileText, Plus, X, Square, Circle, ArrowRight, Type, ZoomIn, ZoomOut, Save, Trash2, Eye, Upload } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const Drawings = ({ projectId, token }) => {
  const [drawingSets, setDrawingSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [showNewSet, setShowNewSet] = useState(false);
  const [showNewSheet, setShowNewSheet] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [setForm, setSetForm] = useState({
    name: '',
    discipline: 'Architectural',
    set_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    revision: '0'
  });
  
  const [sheetForm, setSheetForm] = useState({
    sheet_number: '',
    title: '',
    discipline: 'Architectural',
    page_number: 1
  });
  
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    if (projectId) loadDrawingSets();
  }, [projectId]);

  const apiCall = async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
        ...options.headers
      }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  };

  const loadDrawingSets = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/projects/${projectId}/drawing-sets`);
      setDrawingSets(data.drawing_sets || []);
      if (data.drawing_sets && data.drawing_sets.length > 0) {
        loadSetDetails(data.drawing_sets[0].id);
      }
    } catch (error) {
      console.error('Failed to load drawing sets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSetDetails = async (setId) => {
    try {
      const data = await apiCall(`/drawing-sets/${setId}`);
      setSelectedSet(data.drawing_set);
    } catch (error) {
      console.error('Failed to load set details:', error);
    }
  };

  const handleCreateSet = async (e) => {
    e.preventDefault();
    try {
      const data = await apiCall(`/projects/${projectId}/drawing-sets`, {
        method: 'POST',
        body: JSON.stringify(setForm)
      });
      setDrawingSets([data.drawing_set, ...drawingSets]);
      setSelectedSet(data.drawing_set);
      setShowNewSet(false);
      setSetForm({ name: '', discipline: 'Architectural', set_number: '', issue_date: new Date().toISOString().split('T')[0], revision: '0' });
    } catch (error) {
      alert('Failed to create drawing set: ' + error.message);
    }
  };

  const handleCreateSheet = async (e) => {
    e.preventDefault();
    if (!selectedSet) return;

    try {
      const formData = new FormData();
      formData.append('sheet_number', sheetForm.sheet_number);
      formData.append('title', sheetForm.title);
      formData.append('discipline', sheetForm.discipline);
      formData.append('page_number', sheetForm.page_number);
      if (uploadFile) {
        formData.append('file', uploadFile);
      }

      const data = await apiCall(`/drawing-sets/${selectedSet.id}/sheets`, {
        method: 'POST',
        body: formData
      });

      loadSetDetails(selectedSet.id);
      setShowNewSheet(false);
      setSheetForm({ sheet_number: '', title: '', discipline: 'Architectural', page_number: 1 });
      setUploadFile(null);
    } catch (error) {
      alert('Failed to create sheet: ' + error.message);
    }
  };

  const handleDeleteSheet = async (sheetId) => {
    try {
      await apiCall(`/drawing-sheets/${sheetId}`, { method: 'DELETE' });
      loadSetDetails(selectedSet.id);
    } catch (error) {
    alert('Failed to delete sheet: ' + error.message);
   }
  };

  const openPDFViewer = async (sheet) => {
    try {
      const data = await apiCall(`/drawing-sheets/${sheet.id}`);
      setSelectedSheet(data.sheet);
      setShowPDFViewer(true);
    } catch (error) {
      alert('Failed to load sheet: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Drawings</h2>
        <button
          onClick={() => setShowNewSet(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Drawing Set
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : drawingSets.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No drawing sets yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {drawingSets.map(set => (
            <div
              key={set.id}
              onClick={() => loadSetDetails(set.id)}
              className={`bg-white p-6 rounded-lg border-2 cursor-pointer transition-all ${
                selectedSet?.id === set.id ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <Layers className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-gray-500">{set.set_number}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{set.name}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Discipline: {set.discipline}</p>
                <p>Revision: {set.revision}</p>
                <p>Sheets: {set.sheet_count || 0}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSet && selectedSet.sheets && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedSet.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedSet.set_number} • Rev. {selectedSet.revision}
                </p>
              </div>
              <button
                onClick={() => setShowNewSheet(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add Sheet
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {selectedSet.sheets.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No sheets in this set</p>
              </div>
            ) : (
              selectedSet.sheets.map(sheet => (
  <div key={sheet.id} className="p-4 hover:bg-gray-50">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <FileText className="w-8 h-8 text-blue-600" />
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{sheet.sheet_number}</p>
            {sheet.document_version_id && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                PDF
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{sheet.title}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {sheet.document_version_id && (
          <button
            onClick={() => openPDFViewer(sheet)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Eye className="w-4 h-4" />
            View & Markup
          </button>
        )}
        <button
          onClick={() => {
            if (window.confirm('Delete this sheet?')) {
              handleDeleteSheet(sheet.id);
            }
          }}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
))
            )}
          </div>
        </div>
      )}

      {/* New Drawing Set Modal */}
      {showNewSet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Create Drawing Set</h3>
              <button onClick={() => setShowNewSet(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Set Name</label>
                <input
                  value={setForm.name}
                  onChange={(e) => setSetForm({ ...setForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Architectural Plans - Main Building"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
                  <select
                    value={setForm.discipline}
                    onChange={(e) => setSetForm({ ...setForm, discipline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Architectural">Architectural</option>
                    <option value="Structural">Structural</option>
                    <option value="MEP">MEP</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Set Number</label>
                  <input
                    value={setForm.set_number}
                    onChange={(e) => setSetForm({ ...setForm, set_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="A-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={setForm.issue_date}
                    onChange={(e) => setSetForm({ ...setForm, issue_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Revision</label>
                  <input
                    value={setForm.revision}
                    onChange={(e) => setSetForm({ ...setForm, revision: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateSet}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Set
                </button>
                <button
                  onClick={() => setShowNewSet(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Sheet Modal */}
      {showNewSheet && selectedSet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Add Drawing Sheet</h3>
              <button onClick={() => setShowNewSheet(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sheet Number</label>
                <input
                  value={sheetForm.sheet_number}
                  onChange={(e) => setSheetForm({ ...sheetForm, sheet_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="A-101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={sheetForm.title}
                  onChange={(e) => setSheetForm({ ...sheetForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ground Floor Plan"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
                  <select
                    value={sheetForm.discipline}
                    onChange={(e) => setSheetForm({ ...sheetForm, discipline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Architectural">Architectural</option>
                    <option value="Structural">Structural</option>
                    <option value="MEP">MEP</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page Number</label>
                  <input
                    type="number"
                    value={sheetForm.page_number}
                    onChange={(e) => setSheetForm({ ...sheetForm, page_number: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload PDF</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateSheet}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Sheet
                </button>
                <button
                  onClick={() => setShowNewSheet(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer with Markup Tools */}
      {showPDFViewer && selectedSheet && (
        <PDFViewerWithMarkup
          sheet={selectedSheet}
          token={token}
          onClose={() => setShowPDFViewer(false)}
        />
      )}
    </div>
  );
};

// PDF Viewer Component with Markup Tools

// Replace the PDFViewerWithMarkup component in Drawings.jsx with this:

const PDFViewerWithMarkup = ({ sheet, token, onClose }) => {
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

      let pdfUrl = sheet.file_url;
      if (!pdfUrl && sheet.file_path) {
        const path = sheet.file_path.startsWith('uploads/') ? sheet.file_path : `uploads/${sheet.file_path}`;
        pdfUrl = `${API_URL.replace('/api/v1', '')}/${path}`;
      }
      
      if (!pdfUrl) {
        setPdfError('No PDF file associated with this sheet');
        setPdfLoading(false);
        return;
      }

      console.log('Loading PDF from:', pdfUrl);
      
      const loadingTask = window.pdfjsLib.getDocument(pdfUrl);
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
}, [sheet]);

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
    try {
      const response = await fetch(`${API_URL}/drawing-sheets/${sheet.id}/markups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      setMarkups((data.markups || []).map(m => ({
        ...m,
        markup_data: typeof m.markup_data === 'string' ? JSON.parse(m.markup_data) : m.markup_data
      })));
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
      const response = await fetch(`${API_URL}/drawing-sheets/${sheet.id}/markups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ markup_data: markupData })
      });
      const data = await response.json();
      setMarkups([...markups, { ...data.markup, markup_data: markupData }]);
    } catch (err) {
      console.error('Failed to save markup:', err);
      alert('Failed to save markup');
    }
  };

  const deleteMarkup = async (markupId) => {
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
            <div>
              <h3 className="font-semibold text-gray-900">{sheet.sheet_number}</h3>
              <p className="text-sm text-gray-600">{sheet.title}</p>
            </div>
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
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-red-400 mb-2">{pdfError}</p>
              <p className="text-sm text-gray-400">
                File path: {sheet.file_path || 'None'}
              </p>
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
                      <p className="text-xs text-gray-500">By: {markup.created_by_name || 'You'}</p>
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


export default Drawings;