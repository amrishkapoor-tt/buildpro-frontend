import React, { useState, useEffect } from 'react';
import { Building2, Plus, X, Search, Mail, Phone, MapPin } from 'lucide-react';
import { usePermissions } from '../contexts/PermissionContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

const Companies = ({ projectId, token }) => {
  const { can } = usePermissions();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(null);

  useEffect(() => {
    if (projectId) loadOrganizations();
  }, [projectId]);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(
        `${API_URL}/projects/${projectId}/organizations?${params}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      setOrganizations(data.organizations || []);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrgDetails = async (orgId) => {
    try {
      const response = await fetch(
        `${API_URL}/organizations/${orgId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      setSelectedOrg(data.organization);
    } catch (error) {
      console.error('Failed to load organization details:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (projectId) loadOrganizations();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
          <p className="text-sm text-gray-600 mt-1">
            Organizations and contractors on this project
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Organizations List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : organizations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No companies found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map(org => (
            <div
              key={org.id}
              onClick={() => loadOrgDetails(org.id)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{org.name}</h3>
                  {org.type && (
                    <p className="text-sm text-gray-600">{org.type}</p>
                  )}
                </div>
              </div>

              {org.contact_count > 0 && (
                <div className="text-sm text-gray-600 mb-2">
                  {org.contact_count} contact{org.contact_count !== 1 ? 's' : ''}
                </div>
              )}

              {org.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{org.email}</span>
                </div>
              )}

              {org.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  {org.phone}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Organization Details Modal */}
      {selectedOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">{selectedOrg.name}</h3>
                <button
                  onClick={() => setSelectedOrg(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedOrg.type && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Type</label>
                    <p className="text-gray-900">{selectedOrg.type}</p>
                  </div>
                )}

                {selectedOrg.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedOrg.email}</p>
                  </div>
                )}

                {selectedOrg.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{selectedOrg.phone}</p>
                  </div>
                )}

                {(selectedOrg.address || selectedOrg.city || selectedOrg.state) && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <p className="text-gray-900">
                      {selectedOrg.address && <>{selectedOrg.address}<br /></>}
                      {[selectedOrg.city, selectedOrg.state, selectedOrg.zip].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                {selectedOrg.contacts && selectedOrg.contacts.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Contacts ({selectedOrg.contacts.length})
                    </label>
                    <div className="space-y-2">
                      {selectedOrg.contacts.map(contact => (
                        <div key={contact.id} className="bg-gray-50 rounded p-3">
                          <div className="font-medium text-gray-900">
                            {contact.full_name || `${contact.first_name} ${contact.last_name}`}
                          </div>
                          {contact.job_title && (
                            <div className="text-sm text-gray-600">{contact.job_title}</div>
                          )}
                          {contact.email && (
                            <div className="text-sm text-gray-600">{contact.email}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedOrg(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
