import React from 'react';
import { CheckCircle, AlertCircle, Bell, GitBranch, Circle } from 'lucide-react';

const StageNode = ({ stage, selected, onSelect, onMove, onDelete, onStartConnect }) => {
  const getStageIcon = (type) => {
    switch (type) {
      case 'approval':
        return <CheckCircle className="w-4 h-4" />;
      case 'review':
        return <AlertCircle className="w-4 h-4" />;
      case 'notify':
        return <Bell className="w-4 h-4" />;
      case 'decision':
        return <GitBranch className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getStageColor = (type) => {
    switch (type) {
      case 'approval':
        return 'bg-green-100 border-green-300 text-green-700';
      case 'review':
        return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'notify':
        return 'bg-purple-100 border-purple-300 text-purple-700';
      case 'decision':
        return 'bg-yellow-100 border-yellow-300 text-yellow-700';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  if (stage.type === 'start' || stage.type === 'end') {
    return (
      <div
        className={`absolute cursor-pointer ${
          selected ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{ left: stage.x, top: stage.y, width: 100 }}
        onClick={(e) => onSelect(stage, e)}
      >
        <div className={`rounded-full p-3 text-center font-semibold ${
          stage.type === 'start'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          {stage.type === 'start' ? 'START' : 'END'}
        </div>

        {/* Connection handle for START node */}
        {stage.type === 'start' && onStartConnect && (
          <button
            className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-5 h-5 bg-blue-500 rounded-full border-2 border-white hover:bg-blue-600 hover:scale-125 transition-transform z-30 cursor-pointer"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onStartConnect(stage.id);
            }}
            onDragStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            draggable={false}
            title="Click to connect to another stage"
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`absolute cursor-move bg-white border-2 rounded-lg p-3 shadow-sm ${
        selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'
      }`}
      style={{ left: stage.x, top: stage.y, width: 180 }}
      draggable
      onDragEnd={(e) => {
        const rect = e.target.parentElement.getBoundingClientRect();
        const newX = e.clientX - rect.left - 90; // Center the node
        const newY = e.clientY - rect.top - 40;
        onMove(stage.id, newX, newY);
      }}
      onClick={() => onSelect(stage)}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 mb-2 p-2 rounded ${getStageColor(stage.type)}`}>
        {getStageIcon(stage.type)}
        <div className="text-xs font-semibold uppercase">
          {stage.type}
        </div>
      </div>

      {/* Stage Name */}
      <div className="text-sm font-semibold text-gray-900 mb-1 truncate">
        {stage.name}
      </div>

      {/* SLA */}
      {stage.sla_hours && (
        <div className="text-xs text-gray-600 mb-1">
          SLA: {stage.sla_hours}h
        </div>
      )}

      {/* Assignment */}
      {stage.assignment_rules?.role && (
        <div className="text-xs text-blue-600 truncate">
          {stage.assignment_rules.role}
        </div>
      )}

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(stage.id);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 text-xs font-bold z-20"
        >
          ×
        </button>
      )}

      {/* Connection handles - right side for outgoing */}
      {onStartConnect && (
        <button
          className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-5 h-5 bg-blue-500 rounded-full border-2 border-white hover:bg-blue-600 hover:scale-125 transition-transform z-30 cursor-pointer"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onStartConnect(stage.id);
          }}
          onDragStart={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          draggable={false}
          title="Click to connect to another stage"
        />
      )}
    </div>
  );
};

export default StageNode;
