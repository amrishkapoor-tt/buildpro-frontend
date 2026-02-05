import React, { useState } from 'react';
import { FileText, Send, Wrench, FolderOpen, Image, Calendar, DollarSign, FileCheck, ArrowRight, ArrowLeft, Check } from 'lucide-react';

/**
 * EntityTypeSelector
 *
 * Allows user to select which entity types to import from Procore.
 * Supports multiple selections with estimated counts.
 */
const EntityTypeSelector = ({ procoreProject, connectorType = 'procore_api', onBack, onNext }) => {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [options, setOptions] = useState({
    include_files: true,
    preserve_relationships: true,
    skip_duplicates: false
  });

  // Define entity types based on connector
  const getEntityTypes = () => {
    if (connectorType === 'trunk_tools') {
      return [
        {
          id: 'daily_logs',
          name: 'Daily Logs',
          description: 'Daily construction logs with weather, manpower, equipment, and notes',
          icon: Calendar,
          color: 'teal',
          available: true
        },
        {
          id: 'safety_violations',
          name: 'Safety Violations',
          description: 'Safety violations, OSHA recordables, and corrective actions',
          icon: FileText,
          color: 'orange',
          available: true
        },
        {
          id: 'companies',
          name: 'Companies',
          description: 'Subcontractors and vendors',
          icon: FolderOpen,
          color: 'purple',
          available: true
        },
        {
          id: 'contacts',
          name: 'Contacts',
          description: 'Contact information for project participants',
          icon: FileText,
          color: 'blue',
          available: true
        }
      ];
    }

    // Default Procore entity types
    return [
    {
      id: 'rfis',
      name: 'RFIs',
      description: 'Requests for Information with questions and responses',
      icon: FileText,
      color: 'blue',
      available: true
    },
    {
      id: 'submittals',
      name: 'Submittals',
      description: 'Submittal packages with review workflows',
      icon: Send,
      color: 'green',
      available: true
    },
    {
      id: 'punch_items',
      name: 'Punch Items',
      description: 'Punch list items and closeout tracking',
      icon: Wrench,
      color: 'orange',
      available: true
    },
    {
      id: 'documents',
      name: 'Documents',
      description: 'Project documents and files with folder structure',
      icon: FolderOpen,
      color: 'purple',
      available: true
    },
    {
      id: 'drawings',
      name: 'Drawings',
      description: 'Drawing sets and sheets with markups',
      icon: FileCheck,
      color: 'indigo',
      available: true
    },
    {
      id: 'photos',
      name: 'Photos',
      description: 'Project photos organized in albums',
      icon: Image,
      color: 'pink',
      available: true
    },
    {
      id: 'daily_logs',
      name: 'Daily Logs',
      description: 'Daily construction logs with weather and notes',
      icon: Calendar,
      color: 'teal',
      available: false // Phase 4+
    },
    {
      id: 'schedule',
      name: 'Schedule',
      description: 'Project schedule tasks and milestones',
      icon: Calendar,
      color: 'cyan',
      available: false // Phase 4+
    },
    {
      id: 'budget',
      name: 'Budget & Change Orders',
      description: 'Budget line items and change order tracking',
      icon: DollarSign,
      color: 'yellow',
      available: false // Phase 4+
    }
  ];
  };

  const entityTypes = getEntityTypes();

  const toggleType = (typeId) => {
    if (selectedTypes.includes(typeId)) {
      setSelectedTypes(selectedTypes.filter(id => id !== typeId));
    } else {
      setSelectedTypes([...selectedTypes, typeId]);
    }
  };

  const handleNext = () => {
    if (selectedTypes.length > 0 && onNext) {
      onNext(selectedTypes, options);
    }
  };

  const getColorClasses = (color, selected) => {
    const colors = {
      blue: selected ? 'bg-blue-50 border-blue-500' : 'bg-blue-50/50 border-gray-300 hover:border-blue-300',
      green: selected ? 'bg-green-50 border-green-500' : 'bg-green-50/50 border-gray-300 hover:border-green-300',
      orange: selected ? 'bg-orange-50 border-orange-500' : 'bg-orange-50/50 border-gray-300 hover:border-orange-300',
      purple: selected ? 'bg-purple-50 border-purple-500' : 'bg-purple-50/50 border-gray-300 hover:border-purple-300',
      indigo: selected ? 'bg-indigo-50 border-indigo-500' : 'bg-indigo-50/50 border-gray-300 hover:border-indigo-300',
      pink: selected ? 'bg-pink-50 border-pink-500' : 'bg-pink-50/50 border-gray-300 hover:border-pink-300',
      teal: selected ? 'bg-teal-50 border-teal-500' : 'bg-teal-50/50 border-gray-300 hover:border-teal-300',
      cyan: selected ? 'bg-cyan-50 border-cyan-500' : 'bg-cyan-50/50 border-gray-300 hover:border-cyan-300',
      yellow: selected ? 'bg-yellow-50 border-yellow-500' : 'bg-yellow-50/50 border-gray-300 hover:border-yellow-300',
    };
    return colors[color] || colors.blue;
  };

  const getIconColorClass = (color) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      orange: 'text-orange-600',
      purple: 'text-purple-600',
      indigo: 'text-indigo-600',
      pink: 'text-pink-600',
      teal: 'text-teal-600',
      cyan: 'text-cyan-600',
      yellow: 'text-yellow-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Select Data Types to Import
        </h3>
        <p className="text-sm text-gray-600">
          Choose which types of data to import from <strong>{procoreProject.name}</strong>
        </p>
      </div>

      {/* Selection Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          {selectedTypes.length === 0 ? (
            'Select at least one data type to continue'
          ) : (
            `${selectedTypes.length} data type${selectedTypes.length !== 1 ? 's' : ''} selected`
          )}
        </p>
      </div>

      {/* Entity Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        {entityTypes.map(type => {
          const Icon = type.icon;
          const isSelected = selectedTypes.includes(type.id);

          return (
            <button
              key={type.id}
              onClick={() => type.available && toggleType(type.id)}
              disabled={!type.available}
              className={`p-4 border-2 rounded-lg text-left transition-all relative ${
                type.available
                  ? getColorClasses(type.color, isSelected)
                  : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-6 h-6 flex-shrink-0 ${
                  type.available ? getIconColorClass(type.color) : 'text-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    {type.name}
                    {!type.available && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {type.description}
                  </p>
                </div>
                {isSelected && type.available && (
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Import Options */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Import Options</h4>
        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.include_files}
              onChange={(e) => setOptions({ ...options, include_files: e.target.checked })}
              className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">Include file attachments</div>
              <div className="text-xs text-gray-600">Download and import associated documents and photos</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.preserve_relationships}
              onChange={(e) => setOptions({ ...options, preserve_relationships: e.target.checked })}
              className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">Preserve relationships</div>
              <div className="text-xs text-gray-600">Link related entities (e.g., RFI responses to RFIs)</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.skip_duplicates}
              onChange={(e) => setOptions({ ...options, skip_duplicates: e.target.checked })}
              className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">Skip duplicates</div>
              <div className="text-xs text-gray-600">Don't import entities that already exist (matched by number)</div>
            </div>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={selectedTypes.length === 0}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Start Import
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default EntityTypeSelector;
