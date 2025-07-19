'use client'

import { useApp } from '@/lib/hooks/use-app'
import { getMyCourse, Course } from '@/lib/api/courses'
import { useEffect, useState } from 'react'
import { BookOpen, Trophy, Flame, Clock, Play, ArrowRight, User, AlertCircle, CheckCircle } from 'lucide-react'

export function StudentDashboard() {
  const { user, navigate } = useApp()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getMyCourse()
        setCourse(response.course)
        console.log('Student course loaded:', response.course)
      } catch (err) {
        console.error('Error loading course:', err)
        setError(err instanceof Error ? err.message : 'Failed to load course')
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [])

  const stats = {
    totalLabs: course?.modules.reduce((total, module) => total + module.totalLabs, 0) || 0,
    completedLabs: course?.modules.reduce((total, module) => total + module.completedLabs, 0) || 0,
    streakDays: user?.streakDays || 0,
    totalPoints: user?.totalPoints || 0,
  }

  const getModuleIcon = (index: number) => {
    const icons = [BookOpen, Trophy, Flame, Clock, Play]
    const IconComponent = icons[index % icons.length]
    return IconComponent
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto p-6">
        <div className="space-y-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Welcome Section */}
            <div>
              <h1 className="text-3xl font-bold mb-2 text-foreground">
                Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
              </h1>
              <p className="text-muted-foreground">
                Ready to continue your learning journey?
              </p>
            </div>

            {/* Your Learning Path */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-foreground">Your Learning Path</h2>

              {loading ? (
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="animate-pulse">
                    <div className="h-6 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded mb-6"></div>
                    <div className="space-y-4">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-16 bg-muted rounded"></div>
                      <div className="h-16 bg-muted rounded"></div>
                      <div className="h-16 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-center space-x-3 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <p>Error loading course: {error}</p>
                  </div>
                </div>
              ) : !course ? (
                <div className="bg-card rounded-lg p-6 border border-border text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-foreground">No Course Assigned</h3>
                  <p className="text-muted-foreground">
                    You haven't been assigned to any course yet. Contact your instructor or administrator.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Course Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{course.title}</h3>
                        <p className="text-blue-100 mb-1">
                          {course.code} • {course.department} • {course.academicLevel}
                        </p>
                        <p className="text-blue-100 text-sm opacity-90">
                          {course.description}
                        </p>
                      </div>
                      <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Modules Section */}
                  {course.modules.length > 0 && (
                    <div>
                      <h4 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Your Learning Modules
                      </h4>

                      <div className="grid gap-4">
                        {course.modules.map((module, index) => {
                          const IconComponent = getModuleIcon(index)
                          const completionPercentage = module.totalLabs > 0 ? Math.round((module.completedLabs / module.totalLabs) * 100) : 0
                          const isCompleted = completionPercentage === 100

                          return (
                            <div
                              key={module.id}
                              className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1"
                              onClick={() => navigate('module', { moduleId: module.id.toString(), courseId: course.id.toString() })}
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-4">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    isCompleted ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                  }`}>
                                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <IconComponent className="w-6 h-6" />}
                                  </div>
                                  <div>
                                    <h5 className="text-lg font-semibold text-foreground">{module.title}</h5>
                                    <p className="text-muted-foreground text-sm mt-1">{module.description || "Ready to start learning"}</p>
                                  </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              </div>

                              {/* Progress Bar */}
                              <div className="mb-3">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-foreground">Progress</span>
                                  <span className="text-sm text-muted-foreground">
                                    {module.completedLabs}/{module.totalLabs} labs completed
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      isCompleted ? 'bg-green-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${completionPercentage}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  isCompleted 
                                    ? 'bg-green-100 text-green-800' 
                                    : completionPercentage > 0 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {isCompleted ? '✓ Completed' : completionPercentage > 0 ? 'In Progress' : 'Not Started'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {completionPercentage}% complete
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {course.modules.length === 0 && (
                    <div className="bg-card border border-border rounded-xl p-8 text-center">
                      <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Clock className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">No modules available yet</h4>
                      <p className="text-muted-foreground">Your instructor will add learning modules soon.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
