'use client'

import { useApp } from '@/lib/hooks/use-app'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default function ApprovalPendingPage() {
  const { navigate } = useApp()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Account Pending Approval
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your instructor account has been submitted for review. An administrator will approve your account within 24-48 hours.
        </p>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">What happens next?</p>
              <ul className="space-y-1 text-left">
                <li>• An administrator will review your application</li>
                <li>• You&apos;ll receive an email notification once approved</li>
                <li>• You can then log in and access instructor features</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('landing')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Back to Home
          </button>
          
          <button
            onClick={() => navigate('login')}
            className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Try Login Again
          </button>
        </div>
      </div>
    </div>
  )
}
