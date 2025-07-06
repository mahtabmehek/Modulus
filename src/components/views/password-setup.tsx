'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { CheckCircle, AlertCircle, Eye, EyeOff, User, Mail, Shield } from 'lucide-react'

export default function PasswordSetupPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteData, setInviteData] = useState<any>(null)
  const { currentView, setupUserAccount, navigate } = useApp()

  const inviteCode = currentView.params?.inviteCode

  useEffect(() => {
    if (!inviteCode) {
      navigate('invite-landing')
      return
    }
    
    // Handle temporary development access code
    if (inviteCode === 'mahtabmehek') {
      setInviteData({
        id: 'temp-invite',
        code: 'mahtabmehek',
        name: 'Development User',
        email: 'dev@modulus.edu',
        role: 'admin',
        permissions: ['all'],
        createdBy: 'system',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isUsed: false
      })
      return
    }
    
    // Load invite data from localStorage or API
    const invite = localStorage.getItem(`invite_${inviteCode}`)
    if (invite) {
      setInviteData(JSON.parse(invite))
    } else {
      setError('Invalid or expired invitation code.')
    }
  }, [inviteCode, navigate])

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      // Create user account with the invite data
      await setupUserAccount({
        ...inviteData,
        password,
        inviteCode
      })
      
      // Clear the invite from localStorage
      localStorage.removeItem(`invite_${inviteCode}`)
      
      // Navigate to dashboard
      navigate('dashboard')
    } catch (err) {
      setError('Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">
              This invitation link is invalid or has expired.
            </p>
            <button
              onClick={() => navigate('invite-landing')}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Modulus<span className="text-red-400">LMS</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Modulus!</h2>
              <p className="text-gray-600">
                Complete your account setup by creating a password.
              </p>
            </div>

            {/* Invite Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Your Invitation Details:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{inviteData.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{inviteData.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 capitalize">{inviteData.role}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordSetup} className="space-y-6">
              {error && (
                <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Complete Setup</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-gray-400 text-sm">
        <p>© 2025 Modulus LMS. Secure. Scalable. Educational.</p>
      </footer>
    </div>
  )
}
