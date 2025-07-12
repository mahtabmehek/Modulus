'use client'

import { useApp } from '@/lib/hooks/use-app'
import { Clock, LogOut } from 'lucide-react'

export function PendingApprovalView() {
  const { user, logout } = useApp()

  const handleSignOut = () => {
    logout()
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

        {/* Pending Approval Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
            <p className="text-gray-600">
              Your account is currently under review. Please wait for staff approval before accessing the platform.
            </p>
          </div>

          {user && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="text-sm">
                <div className="mb-2">
                  <span className="font-medium text-gray-700">Name:</span>{' '}
                  <span className="text-gray-900">{user.name}</span>
                </div>
                <div className="mb-2">
                  <span className="font-medium text-gray-700">Email:</span>{' '}
                  <span className="text-gray-900">{user.email}</span>
                </div>
                <div className="mb-2">
                  <span className="font-medium text-gray-700">Role:</span>{' '}
                  <span className="text-gray-900 capitalize">{user.role}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>{' '}
                  <span className="text-amber-600 font-medium">Pending Approval</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>What happens next?</strong><br />
                Staff will review your account and notify you via email once approved. 
                You can then log in to access the platform.
              </p>
            </div>

            <button 
              onClick={handleSignOut}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
