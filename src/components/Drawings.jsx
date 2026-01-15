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
                    {sheet.document_version_id && (
                      <button
                        onClick={() => openPDFViewer(sheet)}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                        View & Markup
                      </button>
                    )}
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
const PDFViewerWithMarkup = ({ sheet, token, onClose }) => {
  const [markups, setMarkups] = useState([]);
  const [markupMode, setMarkupMode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentMarkup, setCurrentMarkup] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadMarkups();
  }, []);

  useEffect(() => {
    drawCanvas();
  }, [markups, currentMarkup, zoom]);

  const loadMarkups = async () => {
    try {
      const response = await fetch(`${API_URL}/drawing-sheets/${sheet.id}/markups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMarkups(data.markups.map(m => ({ ...m, markup_data: typeof m.markup_data === 'string' ? JSON.parse(m.markup_data) : m.markup_data })));
    } catch (error) {
      console.error('Failed to load markups:', error);
    }
  };

  const drawCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    markups.forEach(markup => {
      const data = markup.markup_data;
      ctx.strokeStyle = data.color || '#ef4444';
      ctx.lineWidth = 2;
      ctx.fillStyle = data.color || '#ef4444';
      ctx.font = '14px Arial';
      
      if (data.type === 'rectangle') {
        ctx.strokeRect(data.x * zoom, data.y * zoom, data.width * zoom, data.height * zoom);
      } else if (data.type === 'circle') {
        ctx.beginPath();
        ctx.arc((data.x + data.width / 2) * zoom, (data.y + data.height / 2) * zoom, (Math.abs(data.width) / 2) * zoom, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (data.type === 'arrow') {
        const headlen = 10;
        const angle = Math.atan2(data.height * zoom, data.width * zoom);
        ctx.beginPath();
        ctx.moveTo(data.x * zoom, data.y * zoom);
        ctx.lineTo((data.x + data.width) * zoom, (data.y + data.height) * zoom);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo((data.x + data.width) * zoom, (data.y + data.height) * zoom);
        ctx.lineTo((data.x + data.width) * zoom - headlen * Math.cos(angle - Math.PI / 6), (data.y + data.height) * zoom - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo((data.x + data.width) * zoom, (data.y + data.height) * zoom);
        ctx.lineTo((data.x + data.width) * zoom - headlen * Math.cos(angle + Math.PI / 6), (data.y + data.height) * zoom - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (data.type === 'text') {
        ctx.fillText(data.text, data.x * zoom, data.y * zoom);
      }
    });
    
    if (currentMarkup && isDrawing) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      
      if (currentMarkup.type === 'rectangle') {
        ctx.strokeRect(currentMarkup.startX * zoom, currentMarkup.startY * zoom, (currentMarkup.endX - currentMarkup.startX) * zoom, (currentMarkup.endY - currentMarkup.startY) * zoom);
      } else if (currentMarkup.type === 'circle') {
        const radius = Math.sqrt(Math.pow(currentMarkup.endX - currentMarkup.startX, 2) + Math.pow(currentMarkup.endY - currentMarkup.startY, 2)) / 2;
        ctx.beginPath();
        ctx.arc(((currentMarkup.startX + currentMarkup.endX) / 2) * zoom, ((currentMarkup.startY + currentMarkup.endY) / 2) * zoom, radius * zoom, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (currentMarkup.type === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(currentMarkup.startX * zoom, currentMarkup.startY * zoom);
        ctx.lineTo(currentMarkup.endX * zoom, currentMarkup.endY * zoom);
        ctx.stroke();
      }
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (!markupMode) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    setIsDrawing(true);
    setStartPos({ x, y });
    
    if (markupMode === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        saveMarkup({ type: 'text', x, y, text, color: '#3b82f6' });
      }
      setMarkupMode(null);
      setIsDrawing(false);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || !startPos || markupMode === 'text') return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setCurrentMarkup({ type: markupMode, startX: startPos.x, startY: startPos.y, endX: x, endY: y });
  };

  const handleCanvasMouseUp = (e) => {
    if (!isDrawing || !startPos || markupMode === 'text') return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    saveMarkup({
      type: markupMode,
      x: startPos.x,
      y: startPos.y,
      width: x - startPos.x,
      height: y - startPos.y,
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
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save markup:', error);
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
    } catch (error) {
      console.error('Failed to delete markup:', error);
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
            
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            
            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-2 text-gray-600 hover:bg-gray-100 rounded">
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600 min-w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} className="p-2 text-gray-600 hover:bg-gray-100 rounded">
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Viewer Area */}
      <div className="flex-1 flex overflow-auto bg-gray-900">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
            <div className="w-[800px] h-[1000px] bg-white border-2 border-gray-300 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <FileText className="w-24 h-24 mx-auto mb-4" />
                  <p className="text-lg font-medium">PDF: {sheet.sheet_number}</p>
                  <p className="text-sm">{sheet.title}</p>
                  <p className="text-xs mt-4">Use markup tools above to annotate</p>
                </div>
              </div>
              
              <canvas
                ref={canvasRef}
                width={800 * zoom}
                height={1000 * zoom}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className="absolute inset-0 cursor-crosshair"
                style={{ width: '800px', height: '1000px' }}
              />
            </div>
          </div>
        </div>

        {/* Markups Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h4 className="font-semibold text-gray-900 mb-4">Markups ({markups.length})</h4>
          {markups.length === 0 ? (
            <p className="text-sm text-gray-500">No markups yet. Use tools above to annotate.</p>
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