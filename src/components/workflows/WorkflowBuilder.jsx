import React, { useState, useRef } from 'react';
import { Save, X, Eye, Play } from 'lucide-react';
import StageNode from './components/StageNode';
import StageToolbox from './components/StageToolbox';
import StageProperties from './components/StageProperties';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const WorkflowBuilder = ({ templateId, projectId, token, onSave, onClose }) => {
  const canvasRef = useRef(null);
  const [templateName, setTemplateName] = useState('');
  const [entityType, setEntityType] = useState('submittal');
  const [description, setDescription] = useState('');

  const [stages, setStages] = useState([
    { id: 'start', type: 'start', x: 100, y: 50, name: 'Start' },
    { id: 'end', type: 'end', x: 700, y: 400, name: 'End' }
  ]);

  const [transitions, setTransitions] = useState([]);
  const [selectedStage, setSelectedStage] = useState(null);
  const [connecting, setConnecting] = useState(null); // For drawing connections
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [editingTransition, setEditingTransition] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const generateId = () => {
    return `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAddStage = (stageType) => {
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const x = canvasRect ? 200 : 300;
    const y = canvasRect ? 150 : 200;

    const newStage = {
      id: generateId(),
      type: stageType,
      x,
      y,
      name: `${stageType.charAt(0).toUpperCase() + stageType.slice(1)} Stage`,
      sla_hours: 48,
      assignment_rules: { type: 'role', role: '' },
      actions: ['approve', 'reject']
    };

    setStages([...stages, newStage]);
    setSelectedStage(newStage);
  };

  const handleStageMove = (stageId, newX, newY) => {
    setStages(stages.map(s =>
      s.id === stageId ? { ...s, x: newX, y: newY } : s
    ));
  };

  const handleStageUpdate = (stageId, updatedStage) => {
    setStages(stages.map(s =>
      s.id === stageId ? updatedStage : s
    ));
  };

  const handleStageDelete = (stageId) => {
    if (stageId === 'start' || stageId === 'end') return;

    // Remove stage
    setStages(stages.filter(s => s.id !== stageId));

    // Remove associated transitions
    setTransitions(transitions.filter(t =>
      t.from_stage_id !== stageId && t.to_stage_id !== stageId
    ));

    if (selectedStage?.id === stageId) {
      setSelectedStage(null);
    }
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const stageType = e.dataTransfer.getData('stageType');
    if (!stageType) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - 90;
    const y = e.clientY - canvasRect.top - 40;

    const newStage = {
      id: generateId(),
      type: stageType,
      x,
      y,
      name: `${stageType.charAt(0).toUpperCase() + stageType.slice(1)} Stage`,
      sla_hours: 48,
      assignment_rules: { type: 'role', role: '' },
      actions: ['approve', 'reject']
    };

    setStages([...stages, newStage]);
    setSelectedStage(newStage);
  };

  const handleCanvasDragOver = (e) => {
    e.preventDefault();
  };

  const handleStartConnect = (stageId) => {
    console.log('Starting connection from stage:', stageId);
    setConnecting(stageId);
    setSelectedStage(null); // Deselect any selected stage
  };

  const handleEndConnect = (toStageId) => {
    console.log('Ending connection at stage:', toStageId, 'from:', connecting);

    if (!connecting) {
      console.log('No connection in progress');
      return;
    }

    // Can't connect to self
    if (connecting === toStageId) {
      console.log('Cannot connect stage to itself');
      setConnecting(null);
      return;
    }

    // Check if transition already exists
    const exists = transitions.some(t =>
      t.from_stage_id === connecting && t.to_stage_id === toStageId
    );

    if (exists) {
      alert('Transition already exists between these stages');
      setConnecting(null);
      return;
    }

    // Create the transition
    const newTransition = {
      id: generateId(),
      from_stage_id: connecting,
      to_stage_id: toStageId,
      transition_action: 'approve',
      transition_name: 'Approve',
      is_automatic: false
    };

    console.log('Creating new transition:', newTransition);
    console.log('Current transitions before:', transitions);

    // Update transitions immediately
    const updatedTransitions = [...transitions, newTransition];
    setTransitions(updatedTransitions);

    console.log('Updated transitions:', updatedTransitions);

    // Clear connecting state
    setConnecting(null);

    // Open editor after a brief delay to ensure state is updated
    setTimeout(() => {
      setEditingTransition(newTransition);
    }, 100);
  };

  const handleConnectStages = (fromStageId, toStageId) => {
    handleEndConnect(toStageId);
  };

  const handleMouseMove = (e) => {
    if (connecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleUpdateTransition = (transitionId, updates) => {
    console.log('Updating transition:', transitionId, updates);
    setTransitions(prevTransitions =>
      prevTransitions.map(t =>
        t.id === transitionId ? { ...t, ...updates } : t
      )
    );
  };

  const handleDeleteTransition = (transitionId) => {
    console.log('Deleting transition:', transitionId);
    setTransitions(prevTransitions =>
      prevTransitions.filter(t => t.id !== transitionId)
    );
    setEditingTransition(null);
  };

  const handleCloseEditor = () => {
    console.log('Closing editor. Current transitions:', transitions);
    setEditingTransition(null);
  };

  const handleCanvasClick = (e) => {
    // Deselect if clicking on canvas background
    if (e.target === canvasRef.current) {
      setSelectedStage(null);
      setConnecting(null);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    if (!entityType) {
      setError('Entity type is required');
      return;
    }

    const workflowStages = stages.filter(s => s.type !== 'start' && s.type !== 'end');
    if (workflowStages.length === 0) {
      setError('At least one workflow stage is required');
      return;
    }

    // Check if all non-start/end stages have names
    const invalidStages = workflowStages.filter(s => !s.name?.trim());
    if (invalidStages.length > 0) {
      setError('All stages must have a name');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const template = {
        name: templateName,
        entity_type: entityType,
        description: description,
        is_active: true,
        stages: workflowStages.map((s, i) => ({
          stage_number: i + 1,
          stage_name: s.name,
          stage_type: s.type,
          sla_hours: s.sla_hours || 48,
          assignment_rules: s.assignment_rules || { type: 'role', role: '' },
          actions: s.actions || ['approve', 'reject'],
          description: s.description
        })),
        transitions: transitions.map(t => {
          const fromStage = stages.find(s => s.id === t.from_stage_id);
          const toStage = stages.find(s => s.id === t.to_stage_id);

          return {
            from_stage_id: t.from_stage_id,
            to_stage_id: t.to_stage_id,
            transition_action: t.transition_action,
            transition_name: t.transition_name,
            is_automatic: t.is_automatic || false
          };
        })
      };

      const response = await fetch(
        `${API_URL}/workflows/templates${templateId ? `/${templateId}` : ''}`,
        {
          method: templateId ? 'PUT' : 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(template)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save template');
      }

      const data = await response.json();

      if (onSave) {
        onSave(data.template);
      }

      alert('Workflow template saved successfully!');
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Workflow Template Name"
              className="text-xl font-semibold text-gray-900 border-0 focus:outline-none focus:ring-0 px-0"
            />
            <div className="flex items-center gap-4 mt-2">
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="submittal">Submittal</option>
                <option value="rfi">RFI</option>
                <option value="change_order">Change Order</option>
              </select>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description..."
                className="text-sm text-gray-600 border-0 focus:outline-none focus:ring-0 px-0 flex-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Template'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Toolbox */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          <StageToolbox onAddStage={handleAddStage} />

          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <p className="font-semibold mb-1">How to use:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Drag stages onto canvas</li>
              <li>Click stage to edit properties</li>
              <li>Click blue dot to connect stages</li>
              <li>Click connecting stage to finish</li>
              <li>Click transition text to edit</li>
              <li>Drag stages to reposition</li>
              <li>Delete with × button</li>
            </ul>
          </div>

          {connecting && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
              <p className="font-semibold mb-1">Connecting Mode Active</p>
              <p>Click on another stage to create a transition</p>
              <button
                onClick={() => setConnecting(null)}
                className="mt-2 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Transitions List */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Transitions ({transitions.length})
            </h3>
            {transitions.length === 0 ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500 text-center">
                No transitions yet. Click the blue dot on a stage to start connecting.
              </div>
            ) : (
              <div className="space-y-2">
                {transitions.map(t => {
                  const from = stages.find(s => s.id === t.from_stage_id);
                  const to = stages.find(s => s.id === t.to_stage_id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => setEditingTransition(t)}
                      className="p-2 bg-white border border-gray-200 rounded cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="text-xs font-semibold text-blue-700 mb-1">
                        {t.transition_name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {from?.name || 'Unknown'} → {to?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Action: {t.transition_action}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Debug Info */}
          <div className="mt-6 p-3 bg-gray-800 text-white rounded text-xs font-mono">
            <div className="font-bold mb-1">Debug Info:</div>
            <div>Stages: {stages.length}</div>
            <div>Transitions: {transitions.length}</div>
            <div>Connecting: {connecting || 'none'}</div>
            <div>Selected: {selectedStage?.name || 'none'}</div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div
            ref={canvasRef}
            className="relative bg-white border-2 border-gray-300 min-h-[800px] min-w-[1200px]"
            style={{ overflow: 'visible' }}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
          >
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle, #999 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            />

            {/* Render stages - lower z-index so arrows appear on top */}
            <div className="relative" style={{ zIndex: 1 }}>
              {stages.map(stage => (
                <StageNode
                  key={stage.id}
                  stage={stage}
                  selected={selectedStage?.id === stage.id}
                  connecting={connecting}
                  onSelect={(s, event) => {
                    console.log('Stage onClick fired:', s.id, 'connecting:', connecting);
                    // If we're in connecting mode, complete the connection
                    if (connecting && connecting !== s.id) {
                      console.log('Completing connection from', connecting, 'to', s.id);
                      handleEndConnect(s.id);
                    } else if (!connecting) {
                      setSelectedStage(s);
                    }
                  }}
                  onMove={handleStageMove}
                  onDelete={stage.type !== 'start' && stage.type !== 'end' ? handleStageDelete : null}
                  onStartConnect={handleStartConnect}
                />
              ))}
            </div>

            {/* Render transitions (arrows) */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 100, overflow: 'visible' }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="15"
                  markerHeight="12"
                  refX="14"
                  refY="6"
                  orient="auto"
                >
                  <polygon points="0 0, 15 6, 0 12" fill="#dc2626" />
                </marker>
                <marker
                  id="arrowhead-connecting"
                  markerWidth="15"
                  markerHeight="12"
                  refX="14"
                  refY="6"
                  orient="auto"
                >
                  <polygon points="0 0, 15 6, 0 12" fill="#9ca3af" />
                </marker>
                <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                  <feOffset dx="0" dy="1" result="offsetblur"/>
                  <feFlood floodColor="#000000" floodOpacity="0.2"/>
                  <feComposite in2="offsetblur" operator="in"/>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Connection in progress */}
              {connecting && (
                <g>
                  <path
                    d={`M ${(() => {
                      const from = stages.find(s => s.id === connecting);
                      if (!from) return '0 0 L 0 0';
                      const fromX = from.x + (from.type === 'start' || from.type === 'end' ? 100 : 180);
                      const fromY = from.y + (from.type === 'start' || from.type === 'end' ? 20 : 40);
                      return `${fromX} ${fromY} L ${mousePos.x} ${mousePos.y}`;
                    })()}`}
                    stroke="#9ca3af"
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    fill="none"
                    markerEnd="url(#arrowhead-connecting)"
                  />
                </g>
              )}

              {/* Existing transitions */}
              {transitions.map((t, index) => {
                console.log(`Rendering transition ${index}:`, t);
                const from = stages.find(s => s.id === t.from_stage_id);
                const to = stages.find(s => s.id === t.to_stage_id);

                if (!from) {
                  console.warn(`From stage not found for transition:`, t.from_stage_id);
                  return null;
                }
                if (!to) {
                  console.warn(`To stage not found for transition:`, t.to_stage_id);
                  return null;
                }

                const fromX = from.x + (from.type === 'start' || from.type === 'end' ? 100 : 180);
                const fromY = from.y + (from.type === 'start' || from.type === 'end' ? 20 : 40);
                const toX = to.x + (to.type === 'start' || to.type === 'end' ? 0 : 0);
                const toY = to.y + (to.type === 'start' || to.type === 'end' ? 20 : 40);

                const midX = (fromX + toX) / 2;
                const midY = (fromY + toY) / 2;

                console.log(`Drawing transition from (${fromX}, ${fromY}) to (${toX}, ${toY})`);

                return (
                  <g
                    key={t.id}
                    className="transition-group cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Clicked transition:', t);
                      setEditingTransition(t);
                    }}
                  >
                    {/* Invisible wider path for easier clicking */}
                    <path
                      d={`M ${fromX} ${fromY} L ${toX} ${toY}`}
                      stroke="transparent"
                      strokeWidth="30"
                      fill="none"
                      style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    />

                    {/* Visible arrow path - ALWAYS VISIBLE */}
                    <path
                      d={`M ${fromX} ${fromY} L ${toX} ${toY}`}
                      stroke="#dc2626"
                      strokeWidth="4"
                      fill="none"
                      markerEnd="url(#arrowhead)"
                      style={{ pointerEvents: 'none' }}
                    />

                    {/* Label background */}
                    <rect
                      x={midX - 70}
                      y={midY - 18}
                      width="140"
                      height="32"
                      rx="6"
                      fill="#fef2f2"
                      stroke="#dc2626"
                      strokeWidth="2"
                      filter="url(#drop-shadow)"
                      style={{ pointerEvents: 'auto' }}
                    />

                    {/* Label text */}
                    <text
                      x={midX}
                      y={midY + 5}
                      textAnchor="middle"
                      className="font-bold pointer-events-none select-none"
                      style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontSize: '14px',
                        fill: '#991b1b'
                      }}
                    >
                      {t.transition_name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Helper text */}
            {stages.length === 2 && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-gray-400">
                <p className="text-lg font-semibold mb-2">Drag stages from the left to get started</p>
                <p className="text-sm">or click on a stage type to add it to the canvas</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
          <StageProperties
            stage={selectedStage}
            onUpdate={handleStageUpdate}
            onClose={() => setSelectedStage(null)}
          />
        </div>
      </div>

      {/* Transition Editor Modal */}
      {editingTransition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Edit Transition</h3>
              <button
                onClick={handleCloseEditor}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-5">
              {/* Visual flow indicator */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-center gap-3 text-sm">
                  <div className="px-3 py-2 bg-white border border-blue-300 rounded font-medium text-gray-900">
                    {stages.find(s => s.id === editingTransition.from_stage_id)?.name || 'Unknown'}
                  </div>
                  <div className="text-blue-600 font-bold text-lg">→</div>
                  <div className="px-3 py-2 bg-white border border-blue-300 rounded font-medium text-gray-900">
                    {stages.find(s => s.id === editingTransition.to_stage_id)?.name || 'Unknown'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transition Label (shown on arrow)
                </label>
                <input
                  type="text"
                  value={editingTransition.transition_name}
                  onChange={(e) => {
                    const updated = { ...editingTransition, transition_name: e.target.value };
                    setEditingTransition(updated);
                    handleUpdateTransition(editingTransition.id, { transition_name: e.target.value });
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-base"
                  placeholder="e.g., Approve, Reject, Request Changes"
                />
                <p className="text-xs text-gray-500 mt-1">This text will appear on the workflow diagram</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Type
                </label>
                <select
                  value={editingTransition.transition_action}
                  onChange={(e) => {
                    const updated = { ...editingTransition, transition_action: e.target.value };
                    setEditingTransition(updated);
                    handleUpdateTransition(editingTransition.id, { transition_action: e.target.value });
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-base"
                >
                  <option value="approve">✓ Approve - Move forward positively</option>
                  <option value="reject">✗ Reject - Deny and stop workflow</option>
                  <option value="revise">↻ Request Changes - Send back for revisions</option>
                  <option value="forward">→ Forward - Pass to next stage</option>
                  <option value="return">← Return - Go back to previous stage</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {editingTransition.transition_action === 'approve' && 'User approves and workflow moves forward'}
                  {editingTransition.transition_action === 'reject' && 'User rejects and workflow stops'}
                  {editingTransition.transition_action === 'revise' && 'User requests changes, workflow goes back'}
                  {editingTransition.transition_action === 'forward' && 'Workflow continues to next stage'}
                  {editingTransition.transition_action === 'return' && 'Workflow returns to previous stage'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="auto-transition"
                    checked={editingTransition.is_automatic}
                    onChange={(e) => {
                      const updated = { ...editingTransition, is_automatic: e.target.checked };
                      setEditingTransition(updated);
                      handleUpdateTransition(editingTransition.id, { is_automatic: e.target.checked });
                    }}
                    className="mt-1 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor="auto-transition" className="text-sm font-medium text-gray-900 cursor-pointer">
                      Automatic Transition
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      When enabled, this transition happens automatically without requiring user action
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleCloseEditor}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-base"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Delete this transition? This cannot be undone.')) {
                    handleDeleteTransition(editingTransition.id);
                  }
                }}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-base"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilder;
