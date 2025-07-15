import { useEffect, useState } from 'react'

export default function DebugApiTest() {
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const addResult = (test: string, success: boolean, data: any) => {
        setResults(prev => [...prev, { test, success, data, timestamp: new Date().toLocaleTimeString() }])
    }

    const testHealthEndpoint = async () => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://2wd44vvcnypx57l3g32zo4dnoy0bkmwi.lambda-url.eu-west-2.on.aws/api'

        try {
            addResult('Health Check', false, `Testing: ${API_URL}/health`)

            const response = await fetch(`${API_URL}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                const data = await response.json()
                addResult('Health Check', true, data)
            } else {
                addResult('Health Check', false, `HTTP ${response.status}: ${response.statusText}`)
            }
        } catch (error: any) {
            addResult('Health Check', false, `Error: ${error.message}`)
        }
    }

    const testLoginEndpoint = async () => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://2wd44vvcnypx57l3g32zo4dnoy0bkmwi.lambda-url.eu-west-2.on.aws/api'

        try {
            addResult('Login Test', false, `Testing: ${API_URL}/auth/login`)

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: 'admin@test.com',
                    password: 'Mahtabmehek@1337'
                })
            })

            if (response.ok) {
                const data = await response.json()
                addResult('Login Test', true, data)
            } else {
                const errorText = await response.text()
                addResult('Login Test', false, `HTTP ${response.status}: ${errorText}`)
            }
        } catch (error: any) {
            addResult('Login Test', false, `Error: ${error.message}`)
        }
    }

    const runAllTests = async () => {
        setLoading(true)
        setResults([])

        await testHealthEndpoint()
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        await testLoginEndpoint()

        setLoading(false)
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">API Debug Test</h1>

            <div className="mb-4">
                <button
                    onClick={runAllTests}
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                    {loading ? 'Testing...' : 'Run API Tests'}
                </button>
            </div>

            <div className="space-y-4">
                {results.map((result, index) => (
                    <div
                        key={index}
                        className={`p-4 rounded-lg border ${result.success
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                            }`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold">{result.test}</span>
                            <span className="text-sm">{result.timestamp}</span>
                        </div>
                        <pre className="text-sm whitespace-pre-wrap overflow-auto">
                            {typeof result.data === 'object'
                                ? JSON.stringify(result.data, null, 2)
                                : result.data}
                        </pre>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Environment Info:</h3>
                <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set (using fallback)'}</p>
                <p><strong>Node Environment:</strong> {process.env.NODE_ENV}</p>
                <p><strong>Browser:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'Server-side'}</p>
            </div>
        </div>
    )
}
