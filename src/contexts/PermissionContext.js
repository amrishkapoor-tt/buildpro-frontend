import React, { createContext, useContext, useState, useEffect } from 'react';

const PermissionContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || 'https://buildpro-api.onrender.com/api/v1';

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
};

export const PermissionProvider = ({ children, projectId, token }) => {
  const [userRole, setUserRole] = useState(null);
  const [roleLevel, setRoleLevel] = useState(0);
  const [loading, setLoading] = useState(true);

  const roleHierarchy = {
    'viewer': 1,
    'subcontractor': 2,
    'engineer': 3,
    'superintendent': 4,
    'project_manager': 5,
    'admin': 6
  };

  useEffect(() => {
    if (projectId && token) {
      fetchUserRole();
    } else {
      setLoading(false);
    }
  }, [projectId, token]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch(
        `${API_URL}/projects/${projectId}/members`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const currentUser = JSON.parse(localStorage.getItem('buildpro_user'));
        const member = data.members.find(m => m.user_id === currentUser.id);

        if (member) {
          setUserRole(member.role);
          setRoleLevel(roleHierarchy[member.role] || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (requiredRole) => {
    if (!userRole) return false;
    return roleLevel >= roleHierarchy[requiredRole];
  };

  const can = (action) => {
    const permissions = {
      // Documents
      'upload_document': hasPermission('subcontractor'),
      'create_folder': hasPermission('engineer'),
      'edit_document': hasPermission('engineer'),
      'delete_document': hasPermission('superintendent'),
      // RFIs
      'create_rfi': hasPermission('subcontractor'),
      'respond_to_rfi': hasPermission('subcontractor'),
      'change_rfi_status': hasPermission('engineer'),
      // Schedule
      'create_task': hasPermission('engineer'),
      'edit_task': hasPermission('engineer'),
      'create_baseline': hasPermission('project_manager'),
      // Drawings
      'upload_drawing': hasPermission('engineer'),
      'create_markup': hasPermission('subcontractor'),
      'delete_drawing': hasPermission('superintendent'),
      // Photos
      'upload_photo': hasPermission('subcontractor'),
      'create_album': hasPermission('engineer'),
      'delete_photo': hasPermission('superintendent'),
      // Submittals
      'create_submittal': hasPermission('subcontractor'),
      'approve_submittal': hasPermission('superintendent'),
      // Daily Logs
      'create_log': hasPermission('subcontractor'),
      'edit_log': hasPermission('engineer'),
      // Punch List
      'create_punch': hasPermission('engineer'),
      'verify_punch': hasPermission('superintendent'),
      'close_punch': hasPermission('superintendent'),
      // Financials
      'view_budget': hasPermission('superintendent'),
      'edit_budget': hasPermission('project_manager'),
      'create_change_event': hasPermission('engineer'),
      'approve_change_order': hasPermission('project_manager'),
      // Team
      'manage_team': hasPermission('project_manager'),
      'add_member': hasPermission('project_manager'),
      'remove_member': hasPermission('project_manager'),
      'change_role': hasPermission('project_manager')
    };

    return permissions[action] || false;
  };

  const getRoleDisplayName = (role) => {
    const names = {
      'viewer': 'Viewer',
      'subcontractor': 'Subcontractor',
      'engineer': 'Engineer',
      'superintendent': 'Superintendent',
      'project_manager': 'Project Manager',
      'admin': 'Administrator'
    };
    return names[role] || role;
  };

  return (
    <PermissionContext.Provider value={{
      userRole,
      roleLevel,
      loading,
      hasPermission,
      can,
      getRoleDisplayName,
      // Convenience boolean properties
      isViewer: userRole === 'viewer',
      isSubcontractor: userRole === 'subcontractor',
      isEngineer: hasPermission('engineer'),
      isSuperintendent: hasPermission('superintendent'),
      isProjectManager: hasPermission('project_manager'),
      isAdmin: userRole === 'admin'
    }}>
      {children}
    </PermissionContext.Provider>
  );
};
