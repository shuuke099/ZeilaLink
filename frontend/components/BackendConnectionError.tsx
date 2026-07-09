'use client';

import React from 'react';
import { AlertCircle, Server, RefreshCw } from 'lucide-react';

interface BackendConnectionErrorProps {
  message?: string;
}

export default function BackendConnectionError({ message }: BackendConnectionErrorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-primary-darker mb-2">
              Backend Server Not Running
            </h2>
            <p className="text-primary-darker/70">
              The application cannot connect to the backend API server.
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <pre className="text-sm text-red-800 whitespace-pre-wrap font-mono">
            {message || 'Connection refused: http://localhost:7000/api'}
          </pre>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-primary-darker mb-3 flex items-center gap-2">
              <Server size={18} />
              How to Start the Backend Server:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-primary-darker/80 ml-6">
              <li>Open a terminal/command prompt</li>
              <li>Navigate to the backend folder:
                <code className="block mt-1 bg-gray-100 px-3 py-1 rounded text-sm">
                  cd backend
                </code>
              </li>
              <li>Start the server:
                <code className="block mt-1 bg-gray-100 px-3 py-1 rounded text-sm">
                  npm run dev
                </code>
              </li>
              <li>Wait for the message: <span className="font-semibold text-green-600">"✅ Server running on port 7000"</span></li>
              <li>Refresh this page</li>
            </ol>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary flex items-center gap-2 flex-1"
            >
              <RefreshCw size={18} />
              Refresh Page
            </button>
            <button
              onClick={() => window.open('http://localhost:7000/health', '_blank')}
              className="btn-secondary flex items-center gap-2"
            >
              <Server size={18} />
              Test Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

