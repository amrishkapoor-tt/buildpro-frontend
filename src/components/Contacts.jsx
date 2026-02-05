import React, { useState, useEffect } from 'react';
import { User, Plus, X, Search, Mail, Phone, Building2, MapPin, Edit2, Trash2 } from 'lucide-react';
import { usePermissions } from '../contexts/PermissionContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

const Contacts = ({ projectId, token }) => {
  const { can } = usePermissions();

  const [contacts, setContacts] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [error, setError] = useState(null);

  const [contactForm, setContactForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile_phone: '',
    job_title: '',
    organization_id: '',
    street_1: '',
    street_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: ''
  });

  useEffect(() => {
    if (projectId) {
      loadContacts();
      loadOrganizations();
    }
  }, [projectId]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedOrg) params.append('organization_id', selectedOrg);

      const response = await fetch(
        `${API_URL}/projects/${projectId}/contacts?${params}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await fetch(
        `${API_URL}/projects/${projectId}/organizations`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      setOrganizations(data.organizations || []);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  };

  const handleSaveContact = async () => {
    try {
      const url = editingContact
        ? `${API_URL}/contacts/${editingContact.id}`
        : `${API_URL}/projects/${projectId}/contacts`;

      const response = await fetch(url, {
        method: editingContact ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save contact');
      }

      setShowAddContact(false);
      setEditingContact(null);
      resetForm();
      loadContacts();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;

    try {
      const response = await fetch(`${API_URL}/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete contact');

      loadContacts();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setContactForm({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      mobile_phone: contact.mobile_phone || '',
      job_title: contact.job_title || '',
      organization_id: contact.organization_id || '',
      street_1: contact.street_1 || '',
      street_2: contact.street_2 || '',
      city: contact.city || '',
      state: contact.state || '',
      postal_code: contact.postal_code || '',
      country: contact.country || ''
    });
    setShowAddContact(true);
  };

  const resetForm = () => {
    setContactForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      mobile_phone: '',
      job_title: '',
      organization_id: '',
      street_1: '',
      street_2: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (projectId) loadContacts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedOrg]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contacts</h2>
          <p className="text-sm text-gray-600 mt-1">
            Project contacts and external stakeholders
          </p>
        </div>
        {can('engineer') && (
          <button
            onClick={() => { resetForm(); setShowAddContact(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Organizations</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contacts List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No contacts found</p>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery || selectedOrg
              ? 'Try adjusting your filters'
              : 'Add contacts to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map(contact => (
            <div
              key={contact.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {contact.full_name || `${contact.first_name} ${contact.last_name}`}
                    </h3>
                    <p className="text-sm text-gray-600">{contact.job_title}</p>
                  </div>
                </div>
                {can('engineer') && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditContact(contact)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {can('project_manager') && (
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {contact.organization_name && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Building2 className="w-4 h-4" />
                  {contact.organization_name}
                </div>
              )}

              {contact.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                    {contact.email}
                  </a>
                </div>
              )}

              {(contact.phone || contact.mobile_phone) && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${contact.phone || contact.mobile_phone}`} className="hover:text-blue-600">
                    {contact.phone || contact.mobile_phone}
                  </a>
                </div>
              )}

              {(contact.city || contact.state) && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {[contact.city, contact.state].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingContact ? 'Edit Contact' : 'Add New Contact'}
                </h3>
                <button
                  onClick={() => { setShowAddContact(false); setEditingContact(null); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={contactForm.first_name}
                      onChange={(e) => setContactForm({ ...contactForm, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={contactForm.last_name}
                      onChange={(e) => setContactForm({ ...contactForm, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={contactForm.job_title}
                    onChange={(e) => setContactForm({ ...contactForm, job_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <select
                    value={contactForm.organization_id}
                    onChange={(e) => setContactForm({ ...contactForm, organization_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Organization</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    value={contactForm.mobile_phone}
                    onChange={(e) => setContactForm({ ...contactForm, mobile_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={contactForm.street_1}
                    onChange={(e) => setContactForm({ ...contactForm, street_1: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
                    placeholder="Street address"
                  />
                  <input
                    type="text"
                    value={contactForm.street_2}
                    onChange={(e) => setContactForm({ ...contactForm, street_2: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Apt, Suite, etc (optional)"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={contactForm.city}
                      onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={contactForm.state}
                      onChange={(e) => setContactForm({ ...contactForm, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      value={contactForm.postal_code}
                      onChange={(e) => setContactForm({ ...contactForm, postal_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowAddContact(false); setEditingContact(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveContact}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
