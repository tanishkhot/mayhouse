"use client";

import { useEffect, useState } from 'react';

export default function ServerDebug() {
  const [serverInfo, setServerInfo] = useState<{
    apiBaseUrl: string;
    environment: string;
    isServerReachable: boolean;
    serverResponse: string;
  } | null>(null);

  useEffect(() => {
    const checkServer = async () => {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const environment = process.env.NODE_ENV || 'development';
      
      try {
        // Test server connectivity
        const response = await fetch(apiBaseUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const responseText = await response.text();
        
        setServerInfo({
          apiBaseUrl,
          environment,
          isServerReachable: response.ok,
          serverResponse: responseText,
        });
      } catch (error) {
        setServerInfo({
          apiBaseUrl,
          environment,
          isServerReachable: false,
          serverResponse: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    checkServer();
  }, []);

  if (!serverInfo) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-blue-700">Checking server connection...</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 m-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">🔍 Server Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-gray-600">API Base URL:</span>
          <span className="ml-2 font-mono text-blue-600">{serverInfo.apiBaseUrl}</span>
        </div>
        
        <div>
          <span className="font-medium text-gray-600">Environment:</span>
          <span className="ml-2 text-gray-800">{serverInfo.environment}</span>
        </div>
        
        <div>
          <span className="font-medium text-gray-600">Server Status:</span>
          <span className={`ml-2 font-medium ${serverInfo.isServerReachable ? 'text-green-600' : 'text-red-600'}`}>
            {serverInfo.isServerReachable ? '✅ Reachable' : '❌ Not Reachable'}
          </span>
        </div>
        
        <div>
          <span className="font-medium text-gray-600">Server Response:</span>
          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
            {serverInfo.serverResponse}
          </pre>
        </div>
      </div>
    </div>
  );
}
