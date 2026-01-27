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
    setConnecting(stageId);
  };

  const handleEndConnect = (toStageId) => {
    if (!connecting) return;

    // Can't connect to self
    if (connecting === toStageId) {
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

    // Create the transition and open editor
    const newTransition = {
      id: generateId(),
      from_stage_id: connecting,
      to_stage_id: toStageId,
      transition_action: 'approve',
      transition_name: 'Approve',
      is_automatic: false
    };

    setTransitions([...transitions, newTransition]);
    setEditingTransition(newTransition);
    setConnecting(null);
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
    setTransitions(transitions.map(t =>
      t.id === transitionId ? { ...t, ...updates } : t
    ));
  };

  const handleDeleteTransition = (transitionId) => {
    setTransitions(transitions.filter(t => t.id !== transitionId));
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
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div
            ref={canvasRef}
            className="relative bg-white rounded-lg border-2 border-gray-300 min-h-[800px] min-w-[1200px]"
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

            {/* Render transitions (arrows) */}
            <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                </marker>
                <marker
                  id="arrowhead-connecting"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
                </marker>
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
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    fill="none"
                    markerEnd="url(#arrowhead-connecting)"
                  />
                </g>
              )}

              {/* Existing transitions */}
              {transitions.map(t => {
                const from = stages.find(s => s.id === t.from_stage_id);
                const to = stages.find(s => s.id === t.to_stage_id);
                if (!from || !to) return null;

                const fromX = from.x + (from.type === 'start' || from.type === 'end' ? 50 : 90);
                const fromY = from.y + (from.type === 'start' || from.type === 'end' ? 20 : 40);
                const toX = to.x + (to.type === 'start' || to.type === 'end' ? 50 : 90);
                const toY = to.y + (to.type === 'start' || to.type === 'end' ? 20 : 40);

                const midX = (fromX + toX) / 2;
                const midY = (fromY + toY) / 2;

                return (
                  <g key={t.id} className="cursor-pointer" style={{ pointerEvents: 'auto' }}>
                    <path
                      d={`M ${fromX} ${fromY} L ${toX} ${toY}`}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      fill="none"
                      markerEnd="url(#arrowhead)"
                    />
                    <text
                      x={midX}
                      y={midY - 5}
                      textAnchor="middle"
                      className="text-xs fill-blue-700 font-medium cursor-pointer"
                      onClick={() => setEditingTransition(t)}
                    >
                      {t.transition_name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Render stages */}
            <div className="relative" style={{ zIndex: 2 }}>
              {stages.map(stage => (
                <StageNode
                  key={stage.id}
                  stage={stage}
                  selected={selectedStage?.id === stage.id}
                  onSelect={(s) => {
                    if (connecting) {
                      // Complete connection if in connecting mode
                      handleEndConnect(stage.id);
                    } else {
                      setSelectedStage(s);
                    }
                  }}
                  onMove={handleStageMove}
                  onDelete={stage.type !== 'start' && stage.type !== 'end' ? handleStageDelete : null}
                  onStartConnect={handleStartConnect}
                />
              ))}
            </div>

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Transition</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transition Name
                </label>
                <input
                  type="text"
                  value={editingTransition.transition_name}
                  onChange={(e) => {
                    const updated = { ...editingTransition, transition_name: e.target.value };
                    setEditingTransition(updated);
                    handleUpdateTransition(editingTransition.id, { transition_name: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Approve, Reject, Request Changes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Type
                </label>
                <select
                  value={editingTransition.transition_action}
                  onChange={(e) => {
                    const updated = { ...editingTransition, transition_action: e.target.value };
                    setEditingTransition(updated);
                    handleUpdateTransition(editingTransition.id, { transition_action: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="revise">Request Changes</option>
                  <option value="forward">Forward</option>
                  <option value="return">Return</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-transition"
                  checked={editingTransition.is_automatic}
                  onChange={(e) => {
                    const updated = { ...editingTransition, is_automatic: e.target.checked };
                    setEditingTransition(updated);
                    handleUpdateTransition(editingTransition.id, { is_automatic: e.target.checked });
                  }}
                  className="rounded"
                />
                <label htmlFor="auto-transition" className="text-sm text-gray-700">
                  Automatic transition (no user action required)
                </label>
              </div>

              <div className="pt-2 text-xs text-gray-500">
                <p className="mb-1">
                  <strong>From:</strong> {stages.find(s => s.id === editingTransition.from_stage_id)?.name || 'Unknown'}
                </p>
                <p>
                  <strong>To:</strong> {stages.find(s => s.id === editingTransition.to_stage_id)?.name || 'Unknown'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingTransition(null)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Delete this transition?')) {
                    handleDeleteTransition(editingTransition.id);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
