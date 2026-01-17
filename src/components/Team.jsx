import React, { useState, useEffect } from 'react';
import { Users, Plus, X, Search, Info, Trash2, Shield } from 'lucide-react';
import { usePermissions } from '../contexts/PermissionContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

const Team = ({ projectId, token }) => {
  const { can, userRole, getRoleDisplayName } = usePermissions();

  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showRoleInfo, setShowRoleInfo] = useState(false);

  // Add member form state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('engineer');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('buildpro_user'));

  useEffect(() => {
    if (projectId) {
      loadMembers();
      loadRoles();
    }
  }, [projectId]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMembers(data.members);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setRoles(data.roles);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const searchUsers = async () => {
    setSearching(true);
    try {
      const response = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      // Filter out users already in the project
      const existingUserIds = members.map(m => m.user_id);
      const filtered = data.users.filter(u => !existingUserIds.includes(u.id));
      setSearchResults(filtered);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;

    setError(null);
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          role: selectedRole
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add member');
      }

      await loadMembers();
      setShowAddMember(false);
      setSearchQuery('');
      setSelectedUser(null);
      setSelectedRole('engineer');
      setSearchResults([]);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      const response = await fetch(`${API_URL}/project-members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }

      await loadMembers();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from the project?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/project-members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }

      await loadMembers();
    } catch (error) {
      alert(error.message);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'viewer': 'bg-gray-100 text-gray-800',
      'subcontractor': 'bg-blue-100 text-blue-800',
      'engineer': 'bg-green-100 text-green-800',
      'superintendent': 'bg-orange-100 text-orange-800',
      'project_manager': 'bg-purple-100 text-purple-800',
      'admin': 'bg-red-100 text-red-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Team Members</h2>
          {userRole && (
            <p className="text-sm text-gray-600 mt-1">
              Your role: <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(userRole)}`}>
                {getRoleDisplayName(userRole)}
              </span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRoleInfo(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Info className="w-5 h-5" />
            Role Info
          </button>
          {can('add_member') && (
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Member
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          {members.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No team members yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {members.map(member => {
                const isCurrentUser = member.user_id === currentUser?.id;
                return (
                  <div key={member.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold relative">
                          {member.first_name?.[0]}{member.last_name?.[0]}
                          {isCurrentUser && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                            {isCurrentUser && (
                              <span className="ml-2 text-sm text-gray-500">(You)</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {can('change_role') ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                            disabled={isCurrentUser}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getRoleBadgeColor(member.role)} border-0 ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {roles.map(role => (
                              <option key={role.name} value={role.name}>
                                {role.display_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getRoleBadgeColor(member.role)}`}>
                            {getRoleDisplayName(member.role)}
                          </span>
                        )}

                        {can('remove_member') && !isCurrentUser && (
                          <button
                            onClick={() => handleRemoveMember(member.id, `${member.first_name} ${member.last_name}`)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Remove member"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Add Team Member</h3>
              <button onClick={() => {
                setShowAddMember(false);
                setSearchQuery('');
                setSelectedUser(null);
                setSearchResults([]);
                setError(null);
              }}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search for user
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </button>
                    ))}
                  </div>
                )}

                {searching && (
                  <p className="mt-2 text-sm text-gray-500">Searching...</p>
                )}
              </div>

              {selectedUser && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Selected:</p>
                  <p className="text-sm text-gray-600">{selectedUser.first_name} {selectedUser.last_name}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map(role => (
                    <option key={role.name} value={role.name}>
                      {role.display_name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddMember(false);
                    setSearchQuery('');
                    setSelectedUser(null);
                    setSearchResults([]);
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedUser}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Information Modal */}
      {showRoleInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Role Hierarchy & Permissions
              </h3>
              <button onClick={() => setShowRoleInfo(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {roles.map(role => (
                <div key={role.name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getRoleBadgeColor(role.name)}`}>
                      {role.display_name} (Level {role.level})
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{role.description}</p>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Typical users:</span> {role.typical_users}
                  </p>
                </div>
              ))}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">How it works:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Higher level roles have all permissions of lower level roles</li>
                  <li>Only Project Managers and Admins can manage team members</li>
                  <li>You cannot remove yourself from the project</li>
                  <li>Role changes take effect immediately</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowRoleInfo(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
