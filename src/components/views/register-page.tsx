'use client'

import { useState } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export function RegisterView() {
  const { register, navigate } = useApp()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'student' | 'instructor' | 'staff' | 'admin',
    accessCode: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getUserFriendlyError = (error: any) => {
    // If the error has a specific message from the backend, use it
    if (error && typeof error === 'object' && error.message) {
      return error.message;
    }
    
    // If the error has an errorType, provide specific messages
    if (error && typeof error === 'object' && error.errorType) {
      switch (error.errorType) {
        case 'USER_EXISTS':
          return 'An account with this email already exists. Try logging in instead.';
        default:
          return error.error || 'Registration failed. Please try again.';
      }
    }
    
    // Fallback for string errors
    if (typeof error === 'string') {
      if (error.includes('User already exists')) {
        return 'An account with this email already exists. Try logging in instead.';
      }
      if (error.includes('already exists')) {
        return 'An account with this email already exists. Try logging in instead.';
      }
      return error;
    }
    
    return 'Registration failed. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.accessCode) {
      setError('Please fill in all required fields')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    
    setLoading(true)
    setError('')
    
    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.role,
      formData.accessCode
    )
    
    if (!result.success) {
      setError(getUserFriendlyError(result.error))
    }
    
    setLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/logo.svg"
              alt="Modulus Logo"
              className="w-48 h-48"
            />
          </div>
          <h1 className="text-3xl font-bold text-white -mt-12">ModulusLMS</h1>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <button 
                onClick={() => navigate('login')}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 ml-3">Sign Up</h2>
            </div>
            <p className="text-gray-600">
              Create your account to access the platform
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="staff">Staff</option>
                <option value="admin">Administrator</option>
              </select>
              <p className="text-sm text-gray-600 mt-1">
                {formData.role === 'student' ? 'Student accounts require approval from staff before access.' :
                 formData.role === 'instructor' ? 'Instructor accounts require approval from staff before access.' :
                 formData.role === 'staff' ? 'Staff accounts require approval from staff before access.' :
                 'Administrator accounts have full access.'}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700">
                Access Code
              </label>
              <input
                id="accessCode"
                name="accessCode"
                type="text"
                placeholder="Enter your access code"
                value={formData.accessCode}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
              <p className="text-sm text-gray-600 mt-1">
                Contact your instructor or administrator for the appropriate access code.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Role-based information */}
            {formData.role === 'student' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Student Account:</strong> Your account will be created but require approval from staff before you can log in. 
                  You&apos;ll be notified once approved.
                </p>
              </div>
            )}

            {formData.role === 'instructor' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-700">
                  <strong>Instructor Account:</strong> Your account will be created but require approval from staff before you can log in. 
                  You&apos;ll be notified once approved.
                </p>
              </div>
            )}

            {formData.role === 'staff' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-700">
                  <strong>Staff Account:</strong> Your account will be created but require approval from staff before you can log in. 
                  You&apos;ll be notified once approved.
                </p>
              </div>
            )}

            {formData.role === 'admin' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  <strong>Administrator Account:</strong> Admin accounts are automatically approved and have full system access.
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
              disabled={loading || !formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.accessCode}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
          
          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <button 
                onClick={() => navigate('login')}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
