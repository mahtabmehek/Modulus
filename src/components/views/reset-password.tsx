'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { apiClient } from '@/lib/api'
import { ArrowLeft, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'

export function ResetPasswordView() {
    const { navigate } = useApp()
    const [token, setToken] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [tokenError, setTokenError] = useState('')

    // Extract token from URL on component mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search)
            const urlToken = urlParams.get('token')
            if (urlToken) {
                setToken(urlToken)
            } else {
                setTokenError('No reset token found in URL')
            }
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token || !password || !confirmPassword) return

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long')
            return
        }

        setLoading(true)
        setError('')

        try {
            const response = await apiClient.resetPassword(token, password)
            console.log('Reset password response:', response)
            setSuccess(true)
        } catch (error: any) {
            console.error('Reset password error:', error)
            setError(error.message || 'Failed to reset password. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (tokenError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Invalid Reset Link
                        </h2>
                        <p className="text-gray-600 mb-8">
                            The password reset link is invalid or has expired. Please request a new one.
                        </p>
                        <div className="space-y-4">
                            <button
                                onClick={() => navigate('forgot-password')}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                Request New Reset Link
                            </button>
                            <button
                                onClick={() => navigate('login')}
                                className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-700 w-full"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back to login</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Password Reset Successful
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Your password has been reset successfully. You can now log in with your new password.
                        </p>
                        <button
                            onClick={() => navigate('login')}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <button
                        onClick={() => navigate('login')}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to login</span>
                    </button>

                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <Lock className="h-8 w-8 text-red-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Reset Your Password
                        </h2>
                        <p className="text-gray-600">
                            Enter your new password below.
                        </p>
                    </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <Eye className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
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
                                    <EyeOff className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <Eye className="h-5 w-5 text-gray-400" />
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
                        disabled={loading || !token || !password || !confirmPassword}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <div className="text-center">
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
    )
}
