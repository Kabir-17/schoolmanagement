import React, { useState, useEffect } from "react";
import { adminApi } from "@/services/admin.api";
import { useAuth } from "@/context/AuthContext";

interface ApiInfo {
  schoolId: string;
  schoolSlug: string;
  apiEndpoint: string;
  apiKey?: string; // masked
  instructions: {
    endpoint: string;
    authentication: string;
    documentation: string;
  };
}

const AutoAttendApiKeyManager: React.FC = () => {
  const [apiInfo, setApiInfo] = useState<ApiInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showFullKey, setShowFullKey] = useState(false);
  const [fullApiKey, setFullApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
const {user} = useAuth();
console.log(user)
  useEffect(() => {
    fetchApiInfo();
  }, []);

  const fetchApiInfo = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAttendanceApiInfo();
      setApiInfo(response.data.data);
    } catch (err) {
      console.error("Failed to fetch API info:", err);
    } finally {
      setLoading(false);
    }
  };

  const regenerateApiKey = async () => {
    if (
      !confirm(
        "Are you sure you want to regenerate the API key? The old key will stop working immediately and you will need to update your Auto-Attend configuration."
      )
    ) {
      return;
    }

    setRegenerating(true);
    try {
      const response = await adminApi.regenerateAttendanceApiKey(
        apiInfo?.schoolId || ""
      );
      setFullApiKey(response.data.data.apiKey);
      setShowFullKey(true);
      alert(
        "API key regenerated successfully! Copy the new key now - it will not be shown again."
      );
      // Refresh info
      await fetchApiInfo();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to regenerate API key");
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!apiInfo) {
    return (
      <div className="bg-red-50 p-6 rounded-lg shadow">
        <p className="text-red-800">Failed to load API information</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Auto-Attend API Configuration
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Use these credentials to configure your Auto-Attend desktop
            application
          </p>
        </div>
        <button
          onClick={regenerateApiKey}
          disabled={regenerating}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {regenerating ? "Regenerating..." : "🔄 Regenerate API Key"}
        </button>
      </div>

      {/* School Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School ID
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white border rounded text-sm font-mono">
              {apiInfo.schoolId}
            </code>
            <button
              onClick={() => copyToClipboard(apiInfo.schoolId)}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              📋
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School Slug
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white border rounded text-sm font-mono">
              {apiInfo.schoolSlug}
            </code>
            <button
              onClick={() => copyToClipboard(apiInfo.schoolSlug)}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              📋
            </button>
          </div>
        </div>
      </div>

      {/* API Endpoint */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <label className="block text-sm font-medium text-blue-900 mb-2">
          API Endpoint
        </label>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-white border rounded text-sm font-mono">
            POST {window.location.origin}
            {apiInfo.apiEndpoint}/events
          </code>
          <button
            onClick={() =>
              copyToClipboard(
                `${window.location.origin}${apiInfo.apiEndpoint}/events`
              )
            }
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            📋
          </button>
        </div>
        <p className="text-xs text-blue-700 mt-2">
          Configure this URL in your Auto-Attend application settings
        </p>
      </div>

      {/* API Key */}
      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <label className="block text-sm font-medium text-yellow-900 mb-2">
          API Key
        </label>
        {showFullKey && fullApiKey ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white border border-yellow-300 rounded text-sm font-mono">
              {fullApiKey}
            </code>
            <button
              onClick={() => copyToClipboard(fullApiKey)}
              className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              📋 {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white border border-yellow-300 rounded text-sm font-mono">
              {apiInfo.apiKey || "••••••••••••••••"}
            </code>
            <button
              disabled
              className="px-3 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
            >
              Hidden
            </button>
          </div>
        )}
        <div className="mt-2 p-3 bg-yellow-100 border border-yellow-300 rounded">
          <p className="text-xs text-yellow-800">
            ⚠️ <strong>Security Notice:</strong> Keep this API key secure. It
            allows Auto-Attend to send attendance events to your school. If
            compromised, regenerate immediately.
          </p>
        </div>
      </div>

      {/* Configuration Instructions */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          📖 Auto-Attend Configuration Steps
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Open your Auto-Attend desktop application</li>
          <li>Navigate to Settings → API Configuration</li>
          <li>
            Enter the <strong>Base URL</strong>:{" "}
            <code>{window.location.origin}</code>
          </li>
          <li>
            Enter the <strong>School Slug</strong>:{" "}
            <code>{apiInfo.schoolSlug}</code>
          </li>
          <li>
            Enter the <strong>API Key</strong>: (copy from above)
          </li>
          <li>Click "Test Connection" to verify the setup</li>
          <li>Click "Save" to apply the configuration</li>
        </ol>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-800">
            💡 <strong>Tip:</strong> Use the "Send Test Event" button in
            Auto-Attend to verify your configuration. Test events will appear in
            the Camera Events viewer but won't affect actual attendance records.
          </p>
        </div>
      </div>

      {/* Authentication Header Example */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Technical Details (for developers)
        </h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-600">HTTP Method:</label>
            <code className="block px-2 py-1 bg-white border rounded text-xs font-mono mt-1">
              POST
            </code>
          </div>
          <div>
            <label className="text-xs text-gray-600">
              Authentication Header:
            </label>
            <code className="block px-2 py-1 bg-white border rounded text-xs font-mono mt-1">
              X-Attendance-Key: {apiInfo.apiKey || "[YOUR_API_KEY]"}
            </code>
          </div>
          <div>
            <label className="text-xs text-gray-600">Content-Type:</label>
            <code className="block px-2 py-1 bg-white border rounded text-xs font-mono mt-1">
              application/json
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoAttendApiKeyManager;
