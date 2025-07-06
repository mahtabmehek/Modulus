'use client'

import { useState } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { CheckCircle, AlertCircle, Users, Shield, Award } from 'lucide-react'

export default function InviteLandingPage() {
  const [accessCode, setAccessCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { validateInviteCode, navigate } = useApp()

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    console.log('Submitting access code:', accessCode)

    try {
      // Validate the invite code
      const invite = await validateInviteCode(accessCode)
      console.log('Validation result:', invite)
      
      if (invite) {
        console.log('Valid invite, navigating to password-setup')
        // Redirect to password setup page
        navigate('password-setup', { inviteCode: accessCode })
      } else {
        console.log('Invalid invite code')
        setError('Invalid access code. Please check your invitation link.')
      }
    } catch (err) {
      console.error('Error validating access code:', err)
      setError('Failed to validate access code. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
          {/* Access Form */}
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h2>
              <p className="text-gray-600">
                Modulus LMS is invite-only. Enter your access code to continue.
              </p>
            </div>

            <form onSubmit={handleAccessSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Access Code
                </label>
                <input
                  id="accessCode"
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter your invitation code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !accessCode.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Validating...</span>
                  </>
                ) : (
                  <span>Access Platform</span>
                )}
              </button>
            </form>
          </div>

          {/* Features */}
          <div className="mt-8 text-center">
            <p className="text-gray-300 text-sm mb-4">What makes Modulus LMS special:</p>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-center space-x-2 text-gray-300">
                <Users className="w-4 h-4 text-red-400" />
                <span className="text-sm">Interactive Cybersecurity Labs</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-300">
                <Shield className="w-4 h-4 text-red-400" />
                <span className="text-sm">Desktop-as-a-Service Virtual Environments</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-300">
                <Award className="w-4 h-4 text-red-400" />
                <span className="text-sm">Gamified Learning with Badges & Streaks</span>
              </div>
            </div>
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
