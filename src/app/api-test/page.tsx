'use client'

import { useState, useEffect } from 'react'

export default function ApiTestPage() {
  const [apiUrl, setApiUrl] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('Testing...')
  const [healthData, setHealthData] = useState<any>(null)

  useEffect(() => {
    // Get the API URL that would be used
    const url = process.env.NEXT_PUBLIC_API_URL || (
      process.env.NODE_ENV === 'production'
        ? 'https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api'
        : 'http://localhost:3001/api'
    )
    setApiUrl(url)

    // Test the connection
    const testConnection = async () => {
      try {
        const response = await fetch(`${url}/health`)
        if (response.ok) {
          const data = await response.json()
          setHealthData(data)
          setConnectionStatus('✅ Connected to AWS')
        } else {
          setConnectionStatus(`❌ Connection failed: ${response.status}`)
        }
      } catch (error) {
        setConnectionStatus(`❌ Connection error: ${error}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">API Connection Test</h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current API URL:</label>
              <code className="mt-1 block text-sm text-blue-600 bg-gray-100 p-2 rounded">
                {apiUrl}
              </code>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Connection Status:</label>
              <p className="mt-1 text-lg">{connectionStatus}</p>
            </div>

            {healthData && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Health Check Response:</label>
                <pre className="mt-1 text-sm bg-gray-100 p-4 rounded overflow-auto">
                  {JSON.stringify(healthData, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Environment Variables:</label>
              <div className="mt-1 text-sm bg-gray-100 p-4 rounded">
                <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV || 'undefined'}</p>
                <p><strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'undefined'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
