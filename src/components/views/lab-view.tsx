'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronRight, Monitor, AlertTriangle, ArrowLeft, Clock, Award, BookOpen, GraduationCap, Play } from 'lucide-react'
import { useApp } from '@/lib/hooks/use-app'
import { labAPI } from '@/lib/api/labs'

export default function LabView() {
  const { navigate, currentView } = useApp()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [currentLab, setCurrentLab] = useState<any>(null)
  const [currentModule, setCurrentModule] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get lab and module data from the URL/state
  const labId = currentView.params?.labId
  const moduleId = currentView.params?.moduleId

  // Fetch lab data when component mounts
  useEffect(() => {
    const fetchLabData = async () => {
      if (!labId) {
        setError('No lab ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const lab = await labAPI.getLab(parseInt(labId))
        setCurrentLab(lab)
        setCurrentModule({
          id: lab.module_id,
          title: lab.module_title,
          pathId: 'default-path' // This should come from the API later
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lab')
      } finally {
        setLoading(false)
      }
    }

    fetchLabData()
  }, [labId])

  // Initialize expanded sections - simplified for content-only labs
  useEffect(() => {
    // For now, we'll create a simple expanded state
    // Later this can be enhanced when we add interactive tasks
    setExpandedSections({ content: true })
  }, [currentLab])

  if (!currentLab || !currentModule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Lab Not Found</h2>
          <p className="text-gray-600 mb-4">The requested lab could not be found.</p>
          <button
            onClick={() => navigate('dashboard')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading lab...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Error Loading Lab</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('dashboard')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // No lab data
  if (!currentLab) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Lab Not Found</h2>
          <p className="text-gray-600 mb-4">The requested lab could not be found.</p>
          <button
            onClick={() => navigate('dashboard')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <button
            onClick={() => navigate('dashboard')}
            className="hover:text-gray-700 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <button
            onClick={() => navigate('module', { moduleId: currentModule.id })}
            className="hover:text-gray-700 transition-colors"
          >
            {currentModule.title}
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">{currentLab.title}</span>
        </div>

        {/* Lab Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold">{currentLab.title}</h1>
              </div>
              
              <p className="text-indigo-100 text-lg leading-relaxed mb-4">
                {currentLab.description}
              </p>
              
              <div className="flex items-center gap-6 text-indigo-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{currentLab.estimated_minutes} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span>{currentLab.points_possible} points</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  <span>{currentLab.lab_type || 'Practical Lab'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Lab Content Overview */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">Lab Overview</h2>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 text-lg leading-relaxed">
                {currentLab.description}
              </p>
            </div>
          </div>
        </div>

        {/* Lab Instructions */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">Instructions</h2>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div 
              className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 cursor-pointer"
              onClick={() => toggleSection('content')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 rounded-lg p-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Lab Instructions</h3>
                </div>
                <ChevronUp className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedSections.content ? 'rotate-180' : ''
                }`} />
              </div>
            </div>

            {expandedSections.content && (
              <div className="p-6">
                <div className="prose prose-gray max-w-none">
                  {currentLab.instructions ? (
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {currentLab.instructions}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No instructions provided yet.</p>
                      <p className="text-gray-400 text-sm mt-2">
                        Instructions will be available when the lab is ready.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
