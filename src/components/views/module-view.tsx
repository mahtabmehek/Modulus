'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { apiClient } from '@/lib/api'
import { ArrowLeft, BookOpen, Code, GraduationCap } from 'lucide-react'

export function ModuleView() {
  const { navigate, currentView } = useApp()
  const [currentModule, setCurrentModule] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

    loadModuleData()
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

          <div className="bg-card rounded-lg p-6 border border-border text-center">
            <p className="text-muted-foreground">Labs will be loaded here from the API.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Module ID: {moduleId}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
