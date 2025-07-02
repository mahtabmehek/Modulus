'use client'

import { useState } from 'react'
import { CheckCircle, Users, Monitor, ChevronUp, Lightbulb, Award, X } from 'lucide-react'
import { useApp } from '@/lib/hooks/use-app'

export default function LabView() {
  const { navigate, appData, currentView } = useApp()
  const [answer, setAnswer] = useState('')

  // Get lab and module data from the URL/state
  const labId = currentView.params?.labId
  const moduleId = currentView.params?.moduleId
  
  const currentLab = appData.labs.find(lab => lab.id === labId)
  const currentModule = appData.modules.find(module => module.id === moduleId)
  const moduleLabs = currentModule ? currentModule.labs : []

  if (!currentLab || !currentModule) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lab not found</h1>
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

  const handleAccessMachine = () => {
    // Handle access user machine
    console.log('Accessing user machine...')
  }

  const handleDeployMachine = () => {
    // Handle deploy lab machine
    console.log('Deploying lab machine...')
  }

  const handleSubmit = () => {
    console.log('Submitting answer:', answer)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Left Sidebar - Module Labs */}
      <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium">Module Labs</h3>
            <button 
              onClick={() => navigate('module', { moduleId: currentModule.id })}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4">
          <div className="space-y-2">
            {moduleLabs.map((lab) => (
              <div 
                key={lab.id} 
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
                  lab.id === currentLab.id
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => navigate('lab', { labId: lab.id, moduleId: currentModule.id })}
              >
                <CheckCircle className={`w-5 h-5 text-gray-500`} />
                <span className="text-sm font-medium">{lab.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Breadcrumb */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="text-sm text-gray-400 flex items-center space-x-2">
            <button 
              onClick={() => navigate('dashboard')}
              className="hover:text-white transition-colors"
            >
              Dashboard
            </button>
            <span>{'>'}</span>
            <button 
              onClick={() => navigate('path', { pathId: currentModule.pathId })}
              className="hover:text-white transition-colors"
            >
              Learning Path
            </button>
            <span>{'>'}</span>
            <button 
              onClick={() => navigate('module', { moduleId: currentModule.id })}
              className="hover:text-white transition-colors"
            >
              {currentModule.title}
            </button>
            <span>{'>'}</span>
            <span className="text-white">{currentLab.title}</span>
          </div>
        </div>

        {/* Lab Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {currentLab.title}
              </h1>
              <p className="text-gray-400 text-lg">
                {currentLab.description}
              </p>
            </div>
            
            <div className="flex items-center space-x-4 ml-6">
              <button 
                onClick={handleAccessMachine}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                <Users className="w-5 h-5" />
                <span>Access User Machine</span>
              </button>
              
              <button 
                onClick={handleDeployMachine}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                <Monitor className="w-5 h-5" />
                <span>Deploy Lab Machine</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lab Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl">
            {/* Task Section */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              {/* Task Header */}
              <div className="bg-gray-750 px-6 py-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">
                    {currentLab.tasks.length > 0 ? currentLab.tasks[0].title : 'Lab Content'}
                  </h2>
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Task Content */}
              <div className="p-6">
                <div className="prose prose-invert max-w-none mb-8">
                  <p className="text-gray-300 leading-relaxed">
                    {currentLab.tasks.length > 0 ? currentLab.tasks[0].content : currentLab.content}
                  </p>
                </div>

                {/* Question */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-3">
                    {currentLab.questions.length > 0 ? currentLab.questions[0].text : 'Complete the task above'}
                  </h3>
                  
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Enter your answer..."
                      className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    
                    <button className="flex items-center space-x-2 text-yellow-400 hover:text-yellow-300 transition-colors px-4 py-3">
                      <Lightbulb className="w-5 h-5" />
                    </button>
                    
                    <button 
                      onClick={handleSubmit}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                    >
                      <span>Submit</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
