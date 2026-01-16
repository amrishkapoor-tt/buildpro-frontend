import React, { useState, useEffect } from 'react';
import { Building2, LayoutDashboard, FolderOpen, FileText, Users, Camera, Send, Wrench, Calendar, DollarSign, Layers, Plus, LogOut, Bell, X, BarChart3 } from 'lucide-react';

// Import all module components
import Documents from './components/Documents';
import RFIs from './components/RFIs';
import Team from './components/Team';
import Drawings from './components/Drawings';
import Photos from './components/Photos';
import Submittals from './components/Submittals';
import DailyLogs from './components/DailyLogs';
import PunchList from './components/PunchList';
import Financials from './components/Financials';
import Schedule from './components/Schedule';

// IMPORTANT: Update this to your Render backend URL
const API_URL = 'https://buildpro-api.onrender.com/api/v1';

const BuildProProduction = () => {
  const [token, setToken] = useState(localStorage.getItem('buildpro_token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('buildpro_user') || 'null'));
  const [currentView, setCurrentView] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [showLogin, setShowLogin] = useState(!token);
  const [showRegister, setShowRegister] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    organization_name: ''
  });
  const [projectForm, setProjectForm] = useState({
    name: '',
    location: '',
    budget: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    if (token) {
      loadProjects();
    }
  }, [token]);

  const apiCall = async (endpoint, options = {}) => {
    try {
      setError(null);
      const currentToken = token || localStorage.getItem('buildpro_token');
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          ...(currentToken && { 'Authorization': `Bearer ${currentToken}` }),
          ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' })
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm)
      });
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('buildpro_token', data.token);
      localStorage.setItem('buildpro_user', JSON.stringify(data.user));
      setShowLogin(false);
      await loadProjects();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerForm)
      });
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('buildpro_token', data.token);
      localStorage.setItem('buildpro_user', JSON.stringify(data.user));
      setShowRegister(false);
      setShowLogin(false);
      await loadProjects();
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('buildpro_token');
    localStorage.removeItem('buildpro_user');
    setShowLogin(true);
    setProjects([]);
    setSelectedProject(null);
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/projects');
      setProjects(data.projects);
      if (data.projects.length > 0 && !selectedProject) {
        setSelectedProject(data.projects[0]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiCall('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: projectForm.name,
          location: { address: projectForm.location },
          budget: parseFloat(projectForm.budget),
          start_date: projectForm.start_date,
          end_date: projectForm.end_date
        })
      });
      
      setProjects([data.project, ...projects]);
      setSelectedProject(data.project);
      setShowNewProject(false);
      setProjectForm({ name: '', location: '', budget: '', start_date: '', end_date: '' });
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showLogin && !showRegister) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-8">
            <Building2 className="w-16 h-16 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">BuildPro</h1>
              <p className="text-sm text-gray-600">Construction Management</p>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Sign In</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              onClick={() => { setShowLogin(false); setShowRegister(true); }}
              className="w-full px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showRegister) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Create Your Account</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  value={registerForm.first_name}
                  onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  value={registerForm.last_name}
                  onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                value={registerForm.organization_name}
                onChange={(e) => setRegisterForm({ ...registerForm, organization_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            <button
              onClick={() => { setShowRegister(false); setShowLogin(true); }}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">BuildPro</h1>
                <p className="text-xs text-green-600">● Production</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Bell className="w-6 h-6 text-gray-600 cursor-pointer" />
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user?.first_name} {user?.last_name}</div>
                  <div className="text-gray-500">{user?.email}</div>
                </div>
              </div>
              <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'schedule', icon: BarChart3, label: 'Schedule' },
              { id: 'drawings', icon: Layers, label: 'Drawings' },
              { id: 'documents', icon: FolderOpen, label: 'Documents' },
              { id: 'photos', icon: Camera, label: 'Photos' },
              { id: 'rfis', icon: FileText, label: 'RFIs' },
              { id: 'submittals', icon: Send, label: 'Submittals' },
              { id: 'dailylogs', icon: Calendar, label: 'Daily Logs' },
              { id: 'punch', icon: Wrench, label: 'Punch List' },
              { id: 'financials', icon: DollarSign, label: 'Financials' },
              { id: 'team', icon: Users, label: 'Team' }
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  currentView === id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-xl text-gray-600">Loading...</div>
            </div>
          ) : (
            <>
              {projects.length > 0 && (
                <div className="mb-6 flex items-center justify-between">
                  <select
                    value={selectedProject?.id || ''}
                    onChange={(e) => {
                      const project = projects.find(p => p.id === e.target.value);
                      setSelectedProject(project);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => setShowNewProject(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-5 h-5" />
                    New Project
                  </button>
                </div>
              )}

              {/* Dashboard View */}
              {currentView === 'dashboard' && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-gray-900">Welcome to BuildPro</h2>
                  
                  {projects.length === 0 ? (
                    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                      <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Yet</h3>
                      <p className="text-gray-600 mb-6">Create your first project to get started</p>
                      <button 
                        onClick={() => setShowNewProject(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        Create First Project
                      </button>
                    </div>
                  ) : selectedProject && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Project Status</h3>
                        <p className="text-2xl font-bold text-gray-900 capitalize">{selectedProject.status}</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Budget</h3>
                        <p className="text-2xl font-bold text-gray-900">
                          ${selectedProject.budget ? parseInt(selectedProject.budget).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Team Role</h3>
                        <p className="text-2xl font-bold text-gray-900 capitalize">
                          {selectedProject.user_role?.replace('_', ' ') || 'Member'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 mb-2">🎉 Production Platform Live!</h3>
                    <p className="text-sm text-blue-800">
                      All 10 modules are active and connected to your live database. 
                      Use the sidebar to explore Documents, RFIs, Drawings, Photos, Submittals, Daily Logs, Punch List, Financials, and Team management.
                    </p>
                  </div>
                </div>
              )}

              {/* Route to Module Components */}
              {selectedProject && (
                <>
                  {currentView === 'documents' && <Documents projectId={selectedProject.id} token={token} />}
                  {currentView === 'rfis' && <RFIs projectId={selectedProject.id} token={token} />}
                  {currentView === 'team' && <Team projectId={selectedProject.id} token={token} />}
                  {currentView === 'drawings' && <Drawings projectId={selectedProject.id} token={token} />}
                  {currentView === 'photos' && <Photos projectId={selectedProject.id} token={token} />}
                  {currentView === 'submittals' && <Submittals projectId={selectedProject.id} token={token} />}
                  {currentView === 'dailylogs' && <DailyLogs projectId={selectedProject.id} token={token} />}
                  {currentView === 'punch' && <PunchList projectId={selectedProject.id} token={token} />}
                  {currentView === 'financials' && <Financials projectId={selectedProject.id} token={token} />}
                  {currentView === 'schedule' && <Schedule projectId={selectedProject.id} token={token} />}
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Create New Project</h3>
              <button onClick={() => setShowNewProject(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Downtown Office Tower"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  value={projectForm.location}
                  onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main St, San Francisco, CA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  type="number"
                  value={projectForm.budget}
                  onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5000000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={projectForm.start_date}
                    onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={projectForm.end_date}
                    onChange={(e) => setProjectForm({ ...projectForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateProject}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  onClick={() => setShowNewProject(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildProProduction;