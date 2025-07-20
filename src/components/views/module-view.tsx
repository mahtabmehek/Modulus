'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { apiClient } from '@/lib/api'
import { labAPI, Lab } from '@/lib/api/labs'
import { ArrowLeft, BookOpen, Code, GraduationCap, Clock, Award, Play, CheckCircle, ChevronRight } from 'lucide-react'

export function ModuleView() {
  const { navigate, currentView } = useApp()
  const [currentModule, setCurrentModule] = useState<any>(null)
  const [labs, setLabs] = useState<Lab[]>([])
  const [loading, setLoading] = useState(true)
  const [labsLoading, setLabsLoading] = useState(true)

  // Get moduleId from either the direct property or params
  const moduleId = currentView.params?.moduleId

  useEffect(() => {
    const loadModuleData = async () => {
      if (moduleId) {
        try {
          // For now, use courses API to simulate module data
          // In the future, this would be a dedicated modules API
          const coursesResponse = await apiClient.getCourses()
          if (coursesResponse.courses && coursesResponse.courses.length > 0) {
            // Create a sample module from course data
            const courseData = coursesResponse.courses[0] // Use first course
            const sampleModule = {
              id: moduleId,
              name: `${courseData.title} - Module 1`,
              description: `Core concepts and practical exercises for ${courseData.title}`,
              course: courseData,
              lessons: [
                { id: 1, title: 'Introduction and Setup', duration: '30 min', completed: false },
                { id: 2, title: 'Basic Concepts', duration: '45 min', completed: false },
                { id: 3, title: 'Hands-on Lab', duration: '60 min', completed: false },
              ],
              estimatedDuration: '2-3 hours',
              difficulty: courseData.difficulty || 'Intermediate'
            }
            setCurrentModule(sampleModule)
          }
        } catch (error) {
          console.error('Failed to load module data:', error)
          setCurrentModule(null)
        }
      }
      setLoading(false)
    }

    const loadLabsData = async () => {
      if (moduleId) {
        try {
          console.log('🔍 Loading labs for module:', moduleId)
          console.log('🔍 Module ID type:', typeof moduleId)
          const moduleIdNumber = parseInt(moduleId)
          console.log('🔍 Parsed module ID:', moduleIdNumber)

          // Use the dedicated module-labs endpoint instead of the general labs endpoint
          // This avoids potential duplication from both direct and junction table relationships
          const response = await fetch(`http://localhost:3001/api/module-labs/modules/${moduleIdNumber}/labs`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            throw new Error(`Failed to fetch module labs: ${response.statusText}`)
          }

          const result = await response.json()
          const labsData = result.data || []

          console.log('✅ Labs loaded via module-labs endpoint:', labsData)
          console.log('✅ Number of labs:', labsData.length)
          setLabs(labsData)
        } catch (error) {
          console.error('❌ Failed to load labs:', error)
          console.error('❌ Error details:', error instanceof Error ? error.message : String(error))
          setLabs([])
        }
      }
      setLabsLoading(false)
    }

    loadModuleData()
    loadLabsData()
  }, [moduleId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading module...</p>
        </div>
      </div>
    )
  }

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
        <div className="flex items-center text-base text-muted-foreground mb-6">
          <button
            onClick={() => navigate('dashboard')}
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-foreground font-medium text-base">Modules</span>
        </div>

        {/* Module Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-3">{currentModule.title}</h1>
              <p className="text-indigo-100 text-lg leading-relaxed mb-4">
                {currentModule.description}
              </p>
              <div className="flex items-center gap-6 text-indigo-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>Estimated: {currentModule.estimatedDuration || '2-3 hours'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  <span>{currentModule.difficulty || 'Intermediate'}</span>
                </div>
              </div>
            </div>
            <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Labs Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-foreground">Lab Exercises</h2>
          </div>

          {labsLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300 text-lg">Loading labs...</p>
            </div>
          ) : labs.length > 0 ? (
            <div className="grid gap-6">
              {labs.map((lab, index) => (
                <div
                  key={lab.id}
                  className="group bg-white dark:bg-gray-800 rounded-xl px-8 py-6 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
                  onClick={() => navigate('lab', { labId: lab.id.toString() })}
                >
                  {/* Gradient accent */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-3 group-hover:from-indigo-200 group-hover:to-purple-200 dark:group-hover:from-indigo-800/50 dark:group-hover:to-purple-800/50 transition-colors">
                        <Play className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {lab.title}
                          </h3>
                          {lab.tags && lab.tags.length > 0 && (
                            <div className="flex gap-2">
                              {lab.tags.slice(0, 3).map((tag: string, index: number) => (
                                <span key={index} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm font-medium">
                                  {tag}
                                </span>
                              ))}
                              {lab.tags.length > 3 && (
                                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full text-sm font-medium">
                                  +{lab.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {lab.description && (
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{lab.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>

                  {/* Progress indicator (placeholder) */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full w-0 transition-all duration-300"></div>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 text-xs min-w-fit">Not Started</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center shadow-sm">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 w-fit mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Labs Available</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">There are no lab exercises for this module yet.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Module ID: {moduleId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
