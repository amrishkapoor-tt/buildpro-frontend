import React, { useState, useEffect } from 'react';
import { Users, Plus, X } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const Team = ({ projectId, token }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    if (projectId) loadMembers();
  }, [projectId]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Team Members</h2>
        <button
          onClick={() => setShowAddMember(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Member
        </button>
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
              {members.map(member => (
                <div key={member.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {member.first_name?.[0]}{member.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.first_name} {member.last_name}</p>
                      <p className="text-sm text-gray-600 capitalize">{member.role?.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Add Team Member</h3>
              <button onClick={() => setShowAddMember(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Team member management will be fully functional once user lookup is implemented.
              For now, team members are added automatically when they join projects.
            </p>
            <button
              onClick={() => setShowAddMember(false)}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
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