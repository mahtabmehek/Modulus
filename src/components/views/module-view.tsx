'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { apiClient } from '@/lib/api'
import { labAPI, Lab } from '@/lib/api/labs'
import { ArrowLeft, BookOpen, Code, GraduationCap, Clock, Award } from 'lucide-react'

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
          const labsData = await labAPI.getLabs(moduleIdNumber)
          console.log('✅ Labs loaded:', labsData)
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
        <div className="flex items-center space-x-2 text-muted-foreground mb-6">
          <button
            onClick={() => navigate('dashboard')}
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </button>
          <span>&gt;</span>
          <button
            onClick={() => navigate('dashboard')}
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

          {labsLoading ? (
            <div className="bg-card rounded-lg p-6 border border-border text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading labs...</p>
            </div>
          ) : labs.length > 0 ? (
            <div className="grid gap-4">
              {labs.map((lab) => (
                <div
                  key={lab.id}
                  className="bg-card rounded-lg p-6 border border-border hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => navigate('lab', { labId: lab.id.toString() })}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-foreground">{lab.title}</h3>
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                      {lab.lab_type || 'Lab'}
                    </span>
                  </div>

                  {lab.description && (
                    <p className="text-muted-foreground mb-4">{lab.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{lab.estimated_minutes || 30} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>{lab.points_possible || 0} pts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>Order: {lab.order_index}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-lg p-6 border border-border text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No labs available for this module yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Module ID: {moduleId}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
