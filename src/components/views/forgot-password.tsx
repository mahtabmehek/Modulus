'use client'

import { useState } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { apiClient } from '@/lib/api'
import { ArrowLeft, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'

export function ForgotPasswordView() {
    const { navigate } = useApp()
    const [email, setEmail] = useState('')
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !oldPassword || !newPassword || !confirmPassword) return

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match')
            return
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long')
            return
        }

        setLoading(true)
        setError('')

        try {
            // First login to verify old password and get token
            const loginResponse = await apiClient.login({ email, password: oldPassword })

            // Set the token in the API client for the next request
            apiClient.setToken(loginResponse.token)

            // If login successful, change password
            const changePasswordResponse = await apiClient.changePassword({
                currentPassword: oldPassword,
                newPassword: newPassword
            })

            console.log('Password change response:', changePasswordResponse)

            // Clear the token after password change for security
            apiClient.setToken(null)

            setSuccess(true)
        } catch (error: any) {
            console.error('Password change error:', error)

            // Clear token on error
            apiClient.setToken(null)

            if (error.message?.includes('Invalid credentials')) {
                setError('Invalid email or old password. Please check your credentials.')
            } else if (error.message?.includes('Access token required')) {
                setError('Authentication failed. Please try again.')
            } else {
                setError(error.message || 'Failed to change password. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                            Password Changed Successfully
                        </h2>
                        <p className="text-gray-300 mb-8">
                            Your password has been updated successfully. You can now log in with your new password.
                        </p>
                        <div className="space-y-4">
                            <div className="flex flex-col space-y-3">
                                <button
                                    onClick={() => navigate('login')}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                                >
                                    Go to Login
                                </button>
                                <button
                                    onClick={() => {
                                        setSuccess(false)
                                        setEmail('')
                                        setOldPassword('')
                                        setNewPassword('')
                                        setConfirmPassword('')
                                    }}
                                    className="text-red-400 hover:text-red-300 font-medium"
                                >
                                    Change another password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
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

                {/* Change Password Form */}
                <div className="bg-white rounded-xl shadow-2xl p-8">
                    <div className="mb-6">
                        <div className="flex items-center mb-4">
                            <button 
                                onClick={() => navigate('login')}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-2xl font-bold text-gray-900 ml-3">Change Your Password</h2>
                        </div>
                        <p className="text-gray-600">
                            Enter your current credentials and new password to update your account.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                What was your old password?
                            </label>
                            <div className="relative">
                                <input
                                    id="oldPassword"
                                    type={showOldPassword ? 'text' : 'password'}
                                    placeholder="Enter your current password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showOldPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="newPassword"
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder="Enter your new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-600" />
                                    )}
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                Password must be at least 6 characters long
                            </p>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Confirm your new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-600" />
                                    )}
                                </button>
                            </div>
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
                            disabled={loading || !email || !oldPassword || !newPassword || !confirmPassword}
                        >
                            {loading ? 'Changing Password...' : 'Change Password'}
                        </button>
                    </form>

                    {/* Remember Password Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm">
                            Remember your password?{' '}
                            <button
                                onClick={() => navigate('login')}
                                className="text-red-600 hover:text-red-700 font-medium"
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
