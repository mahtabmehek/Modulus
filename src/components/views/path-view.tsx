'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { ArrowLeft, Clock, Users, Award } from 'lucide-react'

export function PathView() {
  const { navigate, currentView } = useApp()
  const [path, setPath] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Get pathId from either the direct property or params
  const pathId = currentView.params?.pathId

  useEffect(() => {
    // TODO: Fetch real path data from API
    if (pathId) {
      // For now, just show empty state until API is implemented
      setPath(null)
    }
    setLoading(false)
  }, [pathId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading learning path...</p>
        </div>
      </div>
    )
  }
  
  if (!path) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Path not found
        </h1>
        <button 
          onClick={() => navigate('dashboard')}
          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => navigate('dashboard')}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {path.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {path.description}
          </p>
        </div>
      </div>

      {/* Path Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 mr-2" />
            <span>Self-paced</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4 mr-2" />
            <span>Available modules will be shown here</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Award className="w-4 h-4 mr-2" />
            <span>All levels</span>
          </div>
        </div>
        
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          Learning Path
        </span>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Modules
        </h2>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">Modules will be loaded here from the API.</p>
        </div>
      </div>
    </div>
  )
}
