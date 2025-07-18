'use client'

import { useState } from 'react'

export default function ApiTestPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testApiCall = async () => {
    setLoading(true)
    setResult('Testing...')
    
    try {
      console.log('Making API call...')
      
      const response = await fetch('http://localhost:3001/api/auth/validate-access-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode: 'mahtabmehek1337' })
      })
      
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Response data:', data)
      
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('API call error:', error)
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test</h1>
      
      <button 
        onClick={testApiCall}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test API Call'}
      </button>
      
      <div className="mt-4">
        <h2 className="text-lg font-semibold">Result:</h2>
        <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
          {result}
        </pre>
      </div>
    </div>
  )
}
