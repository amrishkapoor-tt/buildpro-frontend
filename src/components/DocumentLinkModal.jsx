import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Search, ExternalLink } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const ENTITY_TYPES = [
  { value: 'rfi', label: 'RFI', icon: '❓' },
  { value: 'submittal', label: 'Submittal', icon: '📋' },
  { value: 'punch_item', label: 'Punch Item', icon: '🔨' },
  { value: 'task', label: 'Task', icon: '✓' },
  { value: 'issue', label: 'Issue', icon: '⚠️' },
  { value: 'observation', label: 'Observation', icon: '👁️' },
  { value: 'daily_log', label: 'Daily Log', icon: '📅' }
];

const DocumentLinkModal = ({ document, token, projectId, onClose, onLinked }) => {
  const [selectedType, setSelectedType] = useState('rfi');
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [existingLinks, setExistingLinks] = useState([]);

  useEffect(() => {
    loadExistingLinks();
  }, []);

  useEffect(() => {
    if (selectedType) {
      loadEntities();
    }
  }, [selectedType]);

  const loadExistingLinks = async () => {
    try {
      const response = await fetch(`${API_URL}/documents/${document.id}/links`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExistingLinks(data.links || []);
      }
    } catch (error) {
      console.error('Failed to load links:', error);
    }
  };

  const loadEntities = async () => {
    setLoading(true);
    try {
      let url;
      switch (selectedType) {
        case 'rfi':
          url = `${API_URL}/projects/${projectId}/rfis`;
          break;
        case 'submittal':
          url = `${API_URL}/projects/${projectId}/submittals`;
          break;
        case 'punch_item':
          url = `${API_URL}/projects/${projectId}/punch-items`;
          break;
        case 'task':
          url = `${API_URL}/projects/${projectId}/tasks`;
          break;
        case 'issue':
          url = `${API_URL}/projects/${projectId}/issues`;
          break;
        case 'observation':
          url = `${API_URL}/projects/${projectId}/observations`;
          break;
        case 'daily_log':
          url = `${API_URL}/projects/${projectId}/daily-logs`;
          break;
        default:
          return;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Extract the array from different response formats
        const items = data.rfis || data.submittals || data.punch_items ||
                     data.tasks || data.issues || data.observations ||
                     data.daily_logs || [];
        setEntities(items);
      }
    } catch (error) {
      console.error('Failed to load entities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (entityId) => {
    try {
      const response = await fetch(`${API_URL}/documents/${document.id}/link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_type: selectedType,
          target_id: entityId,
          relationship: 'attachment'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to link');
      }

      alert('Document linked successfully!');
      loadExistingLinks();
      if (onLinked) onLinked();
    } catch (error) {
      alert('Failed to link: ' + error.message);
    }
  };

  const handleUnlink = async (linkId) => {
    if (!window.confirm('Remove this link?')) return;

    try {
      const response = await fetch(`${API_URL}/document-links/${linkId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to unlink');

      loadExistingLinks();
      if (onLinked) onLinked();
    } catch (error) {
      alert('Failed to unlink: ' + error.message);
    }
  };

  const getEntityDisplay = (entity, type) => {
    switch (type) {
      case 'rfi':
        return `${entity.rfi_number || ''} - ${entity.title}`;
      case 'submittal':
        return `${entity.submittal_number || ''} - ${entity.title}`;
      case 'punch_item':
        return `${entity.item_number || ''} - ${entity.description}`;
      case 'task':
        return entity.title;
      case 'issue':
        return `${entity.issue_number || ''} - ${entity.title}`;
      case 'observation':
        return `${entity.observation_number || ''} - ${entity.title}`;
      case 'daily_log':
        return `Daily Log - ${new Date(entity.log_date).toLocaleDateString()}`;
      default:
        return 'Unknown';
    }
  };

  const filteredEntities = entities.filter(entity => {
    const display = getEntityDisplay(entity, selectedType).toLowerCase();
    return display.includes(searchQuery.toLowerCase());
  });

  const isLinked = (entityId) => {
    return existingLinks.some(link =>
      link.target_type === selectedType && link.target_id === entityId
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Link Document</h3>
            <p className="text-sm text-gray-600 mt-1">{document.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Existing Links */}
          {existingLinks.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Links</h4>
              <div className="space-y-2">
                {existingLinks.map(link => (
                  <div key={link.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {ENTITY_TYPES.find(t => t.value === link.target_type)?.label || link.target_type}
                      </span>
                      <span className="text-sm text-gray-600">ID: {link.target_id.substring(0, 8)}...</span>
                    </div>
                    <button
                      onClick={() => handleUnlink(link.id)}
                      className="text-red-600 hover:bg-red-50 rounded p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Entity Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Link To</label>
            <div className="grid grid-cols-4 gap-2">
              {ENTITY_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`p-3 rounded-lg border-2 text-center transition-colors ${
                    selectedType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-xs font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Entity List */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : filteredEntities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No {ENTITY_TYPES.find(t => t.value === selectedType)?.label}s found
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntities.map(entity => {
                const linked = isLinked(entity.id);
                return (
                  <div
                    key={entity.id}
                    className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                      linked ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {getEntityDisplay(entity, selectedType)}
                        </p>
                        {entity.status && (
                          <span className="text-xs text-gray-500 mt-1 inline-block">
                            Status: {entity.status}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleLink(entity.id)}
                        disabled={linked}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          linked
                            ? 'bg-green-100 text-green-800 cursor-default'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {linked ? '✓ Linked' : 'Link'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentLinkModal;
