import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, Search, Hash } from 'lucide-react';
import { usePermissions } from '../contexts/PermissionContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

const SpecificationSections = ({ projectId, token }) => {
  const { can } = usePermissions();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');

  useEffect(() => {
    if (projectId) loadSections();
  }, [projectId]);

  const loadSections = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDivision) params.append('division', selectedDivision);

      const response = await fetch(
        `${API_URL}/projects/${projectId}/specification-sections?${params}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      setSections(data.specification_sections || []);
    } catch (error) {
      console.error('Failed to load specifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSections = sections.filter(section =>
    searchQuery === '' ||
    section.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const divisions = [...new Set(sections.map(s => s.division).filter(Boolean))].sort();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Specification Sections</h2>
          <p className="text-sm text-gray-600 mt-1">CSI MasterFormat specification sections</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedDivision}
            onChange={(e) => { setSelectedDivision(e.target.value); loadSections(); }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Divisions</option>
            {divisions.map(div => (
              <option key={div} value={div}>Division {div}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sections List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No specification sections found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSections.map(section => (
            <div
              key={section.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                      {section.number}
                    </span>
                    {section.division && (
                      <span className="text-sm text-gray-500">Division {section.division}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{section.name}</h3>
                  {section.description && (
                    <p className="text-sm text-gray-600">{section.description}</p>
                  )}
                  {section.revision && (
                    <span className="text-xs text-gray-500 mt-2 inline-block">
                      Revision: {section.revision}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpecificationSections;
