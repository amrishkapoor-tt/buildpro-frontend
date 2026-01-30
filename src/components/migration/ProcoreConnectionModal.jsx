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

  useEffect(() => {
    loadConnections();

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
      } else {
        throw new Error('Failed to initiate OAuth flow');
      }
    } catch (error) {
      alert(`Connection failed: ${error.message}\n\nNote: Procore OAuth credentials need to be configured in backend .env file (PROCORE_CLIENT_ID, PROCORE_CLIENT_SECRET, PROCORE_REDIRECT_URI)`);
      setConnecting(false);
    }
  };

  const handleSelectConnection = (connection) => {
    if (onConnected) {
      onConnected(connection);
    }
    onClose();
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

      {/* Connect New Account Button */}
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {connecting ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Connecting to Procore...
          </>
        ) : (
          <>
            <ExternalLink className="w-5 h-5" />
            Connect New Procore Account
          </>
        )}
      </button>

      {/* Setup Instructions (for developer) */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">For Developer:</p>
            <p className="mb-2">To enable Procore integration, add these to backend <code className="bg-yellow-100 px-1 rounded">.env</code>:</p>
            <pre className="bg-yellow-100 p-2 rounded text-xs overflow-x-auto">
{`PROCORE_CLIENT_ID=your_app_client_id
PROCORE_CLIENT_SECRET=your_app_client_secret
PROCORE_REDIRECT_URI=https://yourdomain.com/api/v1/migration/procore/callback`}
            </pre>
            <p className="mt-2 text-xs">
              Register your app at <a href="https://developers.procore.com" target="_blank" rel="noopener noreferrer" className="underline">developers.procore.com</a>
            </p>
          </div>
        </div>
      </div>

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
