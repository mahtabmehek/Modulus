'use client'

import { useApp } from '@/lib/hooks/use-app'
import { ArrowLeft, Clock, Users, Award } from 'lucide-react'

export function PathView() {
  const { appData, navigate, currentView } = useApp()
  
  // Get pathId from either the direct property or params
  const pathId = currentView.params?.pathId
  const path = appData.learningPaths.find(p => p.id === pathId)
  
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
            <span>{path.estimatedHours} hours</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4 mr-2" />
            <span>{path.modules.length} modules</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Award className="w-4 h-4 mr-2" />
            <span>{path.difficulty} level</span>
          </div>
        </div>
        
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
          path.difficulty === 'Beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
          path.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        }`}>
          {path.difficulty}
        </span>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Modules
        </h2>
        
        {path.modules.map((module, index) => (
          <div 
            key={module.id}
            className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${
              module.isLocked ? 'opacity-50' : 'cursor-pointer hover:border-red-300 dark:hover:border-red-600'
            } transition-colors`}
            onClick={() => !module.isLocked && navigate('module', { pathId: path.id, moduleId: module.id })}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {module.title}
                  </h3>
                  {module.isLocked && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                      Locked
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {module.description}
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>{module.labs.length} labs</span>
                  <span>{module.estimatedHours} hours</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg mb-2"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                  <div className="bg-red-500 h-1 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
