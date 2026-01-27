import React from 'react';
import { CheckCircle, AlertCircle, Bell, GitBranch } from 'lucide-react';

const StageToolbox = ({ onAddStage }) => {
  const stageTypes = [
    {
      type: 'approval',
      label: 'Approval',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-700 border-green-300',
      description: 'Requires approval from user'
    },
    {
      type: 'review',
      label: 'Review',
      icon: AlertCircle,
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      description: 'Review and provide feedback'
    },
    {
      type: 'notify',
      label: 'Notify',
      icon: Bell,
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      description: 'Send notification only'
    },
    {
      type: 'decision',
      label: 'Decision',
      icon: GitBranch,
      color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      description: 'Conditional branching'
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Stage Types</h3>
      <p className="text-xs text-gray-600 mb-4">
        Drag stages onto the canvas or click to add
      </p>

      <div className="space-y-2">
        {stageTypes.map(({ type, label, icon: Icon, color, description }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('stageType', type);
            }}
            onClick={() => onAddStage(type)}
            className={`p-3 border-2 rounded-lg cursor-move hover:shadow-md transition-shadow ${color}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4" />
              <span className="text-sm font-semibold">{label}</span>
            </div>
            <p className="text-xs opacity-75">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StageToolbox;
