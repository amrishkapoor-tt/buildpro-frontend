import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Star, Copy, Eye, Filter } from 'lucide-react';
import WorkflowBuilder from './WorkflowBuilder';
import { usePermissions } from '../../contexts/PermissionContext';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const WorkflowTemplates = ({ projectId, token }) => {
  const { can } = usePermissions();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterEntityType, setFilterEntityType] = useState('all');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      let endpoint = '/workflows/templates';
      if (filterEntityType !== 'all') {
        endpoint += `?entity_type=${filterEntityType}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    if (!can('create_workflow_template')) {
      alert('You do not have permission to create workflow templates');
      return;
    }
    setEditingTemplate(null);
    setShowBuilder(true);
  };

  const handleEdit = (template) => {
    if (!can('edit_workflow_template')) {
      alert('You do not have permission to edit workflow templates');
      return;
    }
    setEditingTemplate(template);
    setShowBuilder(true);
  };

  const handleDuplicate = async (template) => {
    if (!can('create_workflow_template')) {
      alert('You do not have permission to create workflow templates');
      return;
    }

    if (!confirm(`Duplicate template "${template.name}"?`)) return;

    try {
      const newTemplate = {
        ...template,
        name: `${template.name} (Copy)`,
        is_default: false
      };

      delete newTemplate.id;
      delete newTemplate.created_at;
      delete newTemplate.updated_at;

      const response = await fetch(`${API_URL}/workflows/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTemplate)
      });

      if (response.ok) {
        await loadTemplates();
        alert('Template duplicated successfully!');
      }
    } catch (error) {
      alert('Failed to duplicate template: ' + error.message);
    }
  };

  const handleDelete = async (template) => {
    if (!can('delete_workflow_template')) {
      alert('You do not have permission to delete workflow templates');
      return;
    }

    if (!confirm(`Delete template "${template.name}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`${API_URL}/workflows/templates/${template.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await loadTemplates();
        alert('Template deleted successfully');
      }
    } catch (error) {
      alert('Failed to delete template: ' + error.message);
    }
  };

  const handleSetDefault = async (template) => {
    if (!can('edit_workflow_template')) {
      alert('You do not have permission to set default templates');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/workflows/templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...template,
          is_default: true
        })
      });

      if (response.ok) {
        await loadTemplates();
        alert('Default template updated');
      }
    } catch (error) {
      alert('Failed to set default template: ' + error.message);
    }
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleSaveBuilder = (template) => {
    setShowBuilder(false);
    setEditingTemplate(null);
    loadTemplates();
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    const type = template.entity_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(template);
    return acc;
  }, {});

  const filteredGroups = filterEntityType === 'all'
    ? groupedTemplates
    : { [filterEntityType]: groupedTemplates[filterEntityType] || [] };

  const entityTypeLabels = {
    'submittal': 'Submittals',
    'rfi': 'RFIs',
    'change_order': 'Change Orders'
  };

  if (showBuilder) {
    return (
      <WorkflowBuilder
        templateId={editingTemplate?.id}
        projectId={projectId}
        token={token}
        onSave={handleSaveBuilder}
        onClose={() => {
          setShowBuilder(false);
          setEditingTemplate(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Templates</h1>
          <p className="text-gray-600 mt-1">Manage approval workflow templates for your project</p>
        </div>
        {can('create_workflow_template') && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            New Template
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by type:</span>
          <select
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="submittal">Submittals</option>
            <option value="rfi">RFIs</option>
            <option value="change_order">Change Orders</option>
          </select>
        </div>
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading templates...</div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Star className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-600 mb-6">Create your first workflow template to get started</p>
          {can('create_workflow_template') && (
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Create Template
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredGroups).map(([entityType, typeTemplates]) => (
            <div key={entityType}>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {entityTypeLabels[entityType] || entityType} ({typeTemplates.length})
              </h2>

              <div className="space-y-3">
                {typeTemplates.map(template => (
                  <div
                    key={template.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {template.name}
                          </h3>
                          {template.is_default && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                              <Star className="w-3 h-3" />
                              Default
                            </span>
                          )}
                          {!template.is_active && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                              Inactive
                            </span>
                          )}
                        </div>

                        {template.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {template.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{template.stages?.length || 0} stages</span>
                          <span>•</span>
                          <span>{template.transitions?.length || 0} transitions</span>
                          {template.created_at && (
                            <>
                              <span>•</span>
                              <span>
                                Created {new Date(template.created_at).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreview(template)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {can('edit_workflow_template') && (
                          <>
                            <button
                              onClick={() => handleEdit(template)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDuplicate(template)}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            {!template.is_default && (
                              <button
                                onClick={() => handleSetDefault(template)}
                                className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg"
                                title="Set as default"
                              >
                                <Star className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}

                        {can('delete_workflow_template') && (
                          <button
                            onClick={() => handleDelete(template)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {previewTemplate.name}
                  </h2>
                  {previewTemplate.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {previewTemplate.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Workflow Stages</h3>
              <div className="space-y-3">
                {previewTemplate.stages?.map((stage, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          Stage {stage.stage_number}: {stage.stage_name}
                        </span>
                        <span className="text-xs text-gray-600">
                          ({stage.stage_type})
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        SLA: {stage.sla_hours}h
                      </span>
                    </div>
                    {stage.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {stage.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowPreview(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowTemplates;
