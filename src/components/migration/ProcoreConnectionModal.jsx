import React, { useState, useEffect } from 'react';
import { ExternalLink, Check, AlertCircle, Loader } from 'lucide-react';

const API_URL = 'https://buildpro-api.onrender.com/api/v1';

/**
 * ProcoreConnectionModal
 *
 * Handles user's Procore OAuth connection.
 *
 * ARCHITECTURE:
 * - Backend has ONE set of OAuth credentials (PROCORE_CLIENT_ID/SECRET) for the BuildPro app
 * - EACH USER connects their own Procore account via OAuth
 * - User tokens stored in `procore_connections` table (one per user)
 * - Multiple users can have different Procore accounts connected
 *
 * FLOW:
 * 1. User clicks "Connect to Procore"
 * 2. Redirected to Procore OAuth page (login.procore.com)
 * 3. User logs into Procore and authorizes BuildPro
 * 4. Procore redirects back with authorization code
 * 5. Backend exchanges code for access token
 * 6. Token stored in database for this user
 */
const ProcoreConnectionModal = ({ token, onClose, onConnected }) => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [oauthConfigured, setOauthConfigured] = useState(null);
  const [configError, setConfigError] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualForm, setManualForm] = useState({
    access_token: '',
    company_id: '',
    company_name: ''
  });

  useEffect(() => {
    loadConnections();
    checkOAuthConfiguration();

    // Check if user just returned from OAuth flow
    const urlParams = new URLSearchParams(window.location.search);
    const procoreConnected = urlParams.get('procore_connected');
    const procoreError = urlParams.get('procore_error');

    if (procoreConnected === 'true') {
      // Clean up URL
      window.history.replaceState({}, '', '/');
      // Reload connections to show the new one
      setTimeout(() => loadConnections(), 500);
    }

    if (procoreError) {
      alert(`Procore connection failed: ${procoreError}`);
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const checkOAuthConfiguration = async () => {
    try {
      const response = await fetch(`${API_URL}/migration/procore/auth`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 503) {
        // OAuth not configured
        const data = await response.json();
        setOauthConfigured(false);
        setConfigError(data.details || 'OAuth credentials not configured');
      } else if (response.ok) {
        setOauthConfigured(true);
      } else {
        setOauthConfigured(false);
        setConfigError('Unable to check OAuth configuration');
      }
    } catch (error) {
      console.error('Failed to check OAuth configuration:', error);
      setOauthConfigured(false);
      setConfigError('Unable to connect to server');
    }
  };

  const loadConnections = async () => {
    setLoading(true);
    try {
      // This endpoint would list user's Procore connections
      const response = await fetch(`${API_URL}/migration/procore/connections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Get OAuth authorization URL from backend
      const response = await fetch(`${API_URL}/migration/procore/auth`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect user to Procore OAuth page
        // Procore will redirect back to: /api/v1/migration/procore/callback
        window.location.href = data.authorization_url;
      } else if (response.status === 503) {
        const data = await response.json();
        throw new Error(data.details || 'OAuth not configured');
      } else {
        throw new Error('Failed to initiate OAuth flow');
      }
    } catch (error) {
      alert(`Connection failed: ${error.message}`);
      setConnecting(false);
    }
  };

  const handleSelectConnection = (connection) => {
    if (onConnected) {
      onConnected(connection);
    }
    onClose();
  };

  const handleManualConnect = async () => {
    if (!manualForm.access_token || !manualForm.company_id) {
      alert('Please provide both access token and company ID');
      return;
    }

    setConnecting(true);
    try {
      const response = await fetch(`${API_URL}/migration/procore/connections/manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(manualForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save connection');
      }

      const data = await response.json();
      alert('Connection saved successfully!');
      setShowManualEntry(false);
      setManualForm({ access_token: '', company_id: '', company_name: '' });
      loadConnections();
    } catch (error) {
      alert(`Failed to save connection: ${error.message}`);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Connect to Procore
        </h3>
        <p className="text-sm text-gray-600">
          Connect your Procore account to import projects, RFIs, submittals, and more.
        </p>
      </div>

      {/* OAuth Architecture Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          How it works:
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Each user connects their own Procore account</li>
          <li>• Your credentials are never shared with other users</li>
          <li>• You can revoke access anytime from your Procore account</li>
          <li>• BuildPro securely stores your access token</li>
        </ul>
      </div>

      {/* Existing Connections */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : connections.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">
            Your Procore Connections
          </h4>
          {connections.map(connection => (
            <button
              key={connection.id}
              onClick={() => handleSelectConnection(connection)}
              className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left flex items-start justify-between"
            >
              <div>
                <div className="font-semibold text-gray-900">
                  {connection.procore_company_name}
                </div>
                <div className="text-sm text-gray-600">
                  Connected {new Date(connection.created_at).toLocaleDateString()}
                </div>
              </div>
              <Check className="w-5 h-5 text-green-600" />
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          No Procore connections yet
        </div>
      )}

      {/* Manual Token Entry Form */}
      {showManualEntry ? (
        <div className="space-y-4 border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Enter Procore API Credentials</h4>
            <button
              onClick={() => setShowManualEntry(false)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Token *
              </label>
              <input
                type="password"
                value={manualForm.access_token}
                onChange={(e) => setManualForm({ ...manualForm, access_token: e.target.value })}
                placeholder="Enter your Procore API access token"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get this from your Procore account settings or API documentation
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company ID *
              </label>
              <input
                type="text"
                value={manualForm.company_id}
                onChange={(e) => setManualForm({ ...manualForm, company_id: e.target.value })}
                placeholder="e.g., 12345"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Procore company ID (numeric)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name (Optional)
              </label>
              <input
                type="text"
                value={manualForm.company_name}
                onChange={(e) => setManualForm({ ...manualForm, company_name: e.target.value })}
                placeholder="e.g., Acme Construction"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleManualConnect}
            disabled={connecting || !manualForm.access_token || !manualForm.company_id}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {connecting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Save Connection
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          {/* Primary Option: Manual Token Entry */}
          <button
            onClick={() => setShowManualEntry(true)}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            Add Procore API Token
          </button>

          {/* Alternative Option: OAuth (if configured) */}
          {oauthConfigured === true && (
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {connecting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Connecting via OAuth...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-5 h-5" />
                    Connect via OAuth
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      <button
        onClick={onClose}
        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  );
};

export default ProcoreConnectionModal;
