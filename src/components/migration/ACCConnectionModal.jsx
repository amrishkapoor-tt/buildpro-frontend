import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

const ACCConnectionModal = ({ token, onClose, onConnectionSaved }) => {
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);

  useEffect(() => {
    loadConnections();

    // Check for OAuth callback result
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('acc_connected') === 'true') {
      window.alert('ACC connection successful! Loading your connection...');
      loadConnections();

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('acc_error')) {
      const error = urlParams.get('acc_error');
      window.alert(`ACC connection failed: ${error}`);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadConnections = async () => {
    try {
      const response = await fetch(`${API_URL}/migration/connectors/acc/connections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections);

        // If we just connected and have a new connection, auto-select it
        if (data.connections.length > 0 && window.location.search.includes('acc_connected')) {
          const newestConnection = data.connections[0];
          if (onConnectionSaved) {
            onConnectionSaved(newestConnection);
          }
        }
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);

    try {
      // Get OAuth authorization URL
      const response = await fetch(`${API_URL}/migration/acc/auth`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        window.alert(errorData.details || errorData.error || 'Failed to initiate OAuth flow');
        setLoading(false);
        return;
      }

      const data = await response.json();

      // Redirect to OAuth authorization page
      window.location.href = data.authorization_url;
    } catch (error) {
      window.alert(`Failed to connect: ${error.message}`);
      setLoading(false);
    }
  };

  const handleSelectConnection = (connection) => {
    if (onConnectionSaved) {
      onConnectionSaved(connection);
    }
  };

  const handleRefreshToken = async (connectionId) => {
    try {
      const response = await fetch(`${API_URL}/migration/acc/connections/${connectionId}/refresh`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        window.alert('Token refreshed successfully!');
        await loadConnections();
      } else {
        const errorData = await response.json();
        window.alert(`Token refresh failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      window.alert(`Token refresh failed: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Connect to Autodesk Construction Cloud</h2>
          <p className="text-sm text-gray-600 mt-1">
            Connect to ACC/BIM 360 to import Issues, RFIs, Submittals, and Documents
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Existing Connections */}
          {!loadingConnections && connections.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Existing Connections</h3>
              <div className="space-y-2">
                {connections.map(conn => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{conn.display_name}</div>
                      <div className="text-xs text-gray-500">
                        Connected {new Date(conn.created_at).toLocaleDateString()}
                        {conn.token_expires_at && (
                          <span className="ml-2">
                            • Expires {new Date(conn.token_expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        onClick={() => handleRefreshToken(conn.id)}
                      >
                        Refresh
                      </button>
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        onClick={() => handleSelectConnection(conn)}
                      >
                        Use This Connection
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Or Add New Connection</h3>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">How to connect to ACC:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Click "Connect to ACC" below</li>
              <li>You'll be redirected to Autodesk to authorize access</li>
              <li>Log in with your Autodesk account</li>
              <li>Grant BuildPro permission to access your ACC data</li>
              <li>You'll be redirected back to BuildPro</li>
            </ol>
            <div className="mt-3 text-xs text-blue-700">
              <strong>Note:</strong> You need an ACC/BIM 360 account with appropriate permissions.
              Your admin must also register BuildPro as an app in the Autodesk Platform Services portal.
            </div>
          </div>

          {/* OAuth Configuration Check */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Admin Setup Required</h3>
            <p className="text-sm text-yellow-800">
              Before you can connect, your administrator needs to:
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-800 mt-2 space-y-1">
              <li>Register BuildPro at <a href="https://aps.autodesk.com" target="_blank" rel="noopener noreferrer" className="underline">aps.autodesk.com</a></li>
              <li>Configure ACC_CLIENT_ID and ACC_CLIENT_SECRET in backend .env</li>
              <li>Set ACC_REDIRECT_URI to match your deployment URL</li>
            </ul>
          </div>

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-300 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Redirecting to Autodesk...' : 'Connect to ACC'}
          </button>

          <div className="text-xs text-gray-500 text-center">
            By connecting, you authorize BuildPro to access your ACC project data including Issues, RFIs, Submittals, and Documents.
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ACCConnectionModal;
