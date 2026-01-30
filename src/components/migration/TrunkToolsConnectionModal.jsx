import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

const TrunkToolsConnectionModal = ({ token, onClose, onConnectionSaved }) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const response = await fetch(`${API_URL}/migration/connectors/trunk_tools/connections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleTest = async () => {
    if (!clientId || !clientSecret) {
      window.alert('Please provide both Client ID and Client Secret');
      return;
    }

    if (clientId.length < 10) {
      window.alert('Client ID appears to be invalid (too short). Please check your TrunkTools credentials.');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${API_URL}/migration/connectors/trunk_tools/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          credentials: {
            client_id: clientId.trim(),
            client_secret: clientSecret.trim()
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestResult({ success: true, message: 'Connection successful!' });
      } else {
        setTestResult({ success: false, message: data.message || data.error || 'Connection failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!clientId || !clientSecret) {
      window.alert('Please provide both Client ID and Client Secret');
      return;
    }

    if (clientId.length < 10) {
      window.alert('Client ID appears to be invalid (too short). Please check your TrunkTools credentials.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/migration/connectors/trunk_tools/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          credentials: {
            client_id: clientId.trim(),
            client_secret: clientSecret.trim()
          },
          display_name: displayName.trim() || 'TrunkTools Connection'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details || errorData.error || 'Connection failed';
        window.alert(errorMessage);
        setLoading(false);
        return;
      }

      const data = await response.json();

      window.alert('Connection saved successfully! You can now select this connection to import data.');

      // Reload connections
      await loadConnections();

      if (onConnectionSaved) {
        onConnectionSaved(data.connection);
      }

      // Clear form
      setClientId('');
      setClientSecret('');
      setDisplayName('');
      setTestResult(null);
    } catch (error) {
      const errorMessage = `Connection failed: ${error.message}`;
      window.alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConnection = (connection) => {
    if (onConnectionSaved) {
      onConnectionSaved(connection);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Connect to TrunkTools</h2>
          <p className="text-sm text-gray-600 mt-1">
            Enter your TrunkTools API credentials to import data
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
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectConnection(conn)}
                  >
                    <div>
                      <div className="font-medium text-gray-900">{conn.display_name}</div>
                      <div className="text-xs text-gray-500">
                        Connected {new Date(conn.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectConnection(conn);
                      }}
                    >
                      Use This Connection
                    </button>
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
            <h3 className="font-semibold text-blue-900 mb-2">How to get your TrunkTools credentials:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Log in to your TrunkTools account</li>
              <li>Navigate to Settings → API Settings</li>
              <li>Generate or copy your Client ID and Client Secret</li>
              <li>Paste them below</li>
            </ol>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your TrunkTools Client ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Secret <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your TrunkTools Client Secret"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Connection Name (Optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Main TrunkTools Account"
              />
            </div>

            {/* Test Connection Button */}
            <button
              onClick={handleTest}
              disabled={testing || !clientId || !clientSecret}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {testing ? 'Testing Connection...' : 'Test Connection'}
            </button>

            {/* Test Result */}
            {testResult && (
              <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.message}
                </p>
              </div>
            )}
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
          <button
            onClick={handleSave}
            disabled={loading || !clientId || !clientSecret}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Connection'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrunkToolsConnectionModal;
