'use client'

import { useApp } from '@/lib/hooks/use-app'
import { ArrowLeft, BookOpen, Code, GraduationCap } from 'lucide-react'

export function ModuleView() {
  const { navigate, appData, currentView } = useApp()
  
  // Get moduleId from either the direct property or params
  const moduleId = currentView.params?.moduleId
  const currentModule = appData.modules.find(m => m.id === moduleId)
  
  if (!currentModule) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Module not found</h1>
          <button 
            onClick={() => navigate('dashboard')}
            className="text-red-400 hover:text-red-300"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-muted-foreground mb-6">
          <button 
            onClick={() => navigate('dashboard')}
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </button>
          <span>&gt;</span>
          <button 
            onClick={() => navigate('path', { pathId: currentModule.pathId })}
            className="hover:text-foreground transition-colors"
          >
            Learning Path
          </button>
          <span>&gt;</span>
          <span className="text-foreground">{currentModule.title}</span>
        </div>

        {/* Module Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{currentModule.title}</h1>
          <p className="text-muted-foreground">
            {currentModule.description}
          </p>
        </div>

        {/* Labs Section */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Labs in this Module</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentModule.labs.map((lab) => (
              <div 
                key={lab.id}
                className="bg-card rounded-lg p-6 border border-border cursor-pointer hover:border-border/80 transition-colors"
                onClick={() => navigate('lab', { labId: lab.id, moduleId: currentModule.id })}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Code className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-center mb-2">
                  {lab.title}
                </h3>
                <div className="flex justify-between items-center mt-4">
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    lab.difficulty === 'Easy' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' :
                    lab.difficulty === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300' :
                    'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                  }`}>
                    {lab.difficulty}
                  </span>
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    lab.type === 'Mandatory' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300' : 
                    lab.type === 'Challenge' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {lab.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
