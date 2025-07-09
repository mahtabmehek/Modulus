'use client'

import { useState } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { AlertCircle, Users, Shield, Award } from 'lucide-react'

export function LoginView() {
  const { login } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    
    setLoading(true)
    setError('')
    
    const result = await login(email, password)
    
    if (!result.success) {
      setError(result.error || 'Login failed')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">ModulusLMS</h1>
          <p className="text-gray-300 mt-2">Interactive Cybersecurity Learning Platform</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
            <p className="text-gray-600">
              Enter your credentials to access the platform
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>

            {error && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
              disabled={loading || !email || !password}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          <p className="text-gray-300 text-sm mb-4">What makes Modulus LMS special:</p>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-400 mr-2" />
              Interactive Cybersecurity Labs
            </div>
            <div className="flex items-center justify-center">
              <Users className="w-4 h-4 text-red-400 mr-2" />
              Desktop-as-a-Service Virtual Environments
            </div>
            <div className="flex items-center justify-center">
              <Award className="w-4 h-4 text-red-400 mr-2" />
              Gamified Learning with Badges & Streaks
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
