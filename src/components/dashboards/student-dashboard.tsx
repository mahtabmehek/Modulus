'use client'

import { useApp } from '@/lib/hooks/use-app'
import { getMyCourse, Course } from '@/lib/api/courses'
import { useEffect, useState } from 'react'
import { BookOpen, Trophy, Flame, Clock, Play, ArrowRight, User, AlertCircle } from 'lucide-react'

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Section */}
            <div>
              <h1 className="text-3xl font-bold mb-2 text-foreground">
                Welcome back, Mahtab!
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
                <div className="bg-card rounded-lg p-6 border border-border mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{course.title}</h3>
                  <p className="text-muted-foreground mb-2">
                    {course.code} • {course.department} • {course.academicLevel}
                  </p>
                  <p className="text-muted-foreground mb-6">
                    {course.description}
                  </p>

                  {course.modules.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-foreground">Modules in this course:</h4>
                      
                      {course.modules.map((module, index) => {
                        const IconComponent = getModuleIcon(index)
                        const completionText = `${module.completedLabs}/${module.totalLabs} Completed`
                        
                        return (
                          <div 
                            key={module.id}
                            className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => navigate('module', { moduleId: module.id.toString(), courseId: course.id.toString() })}
                          >
                            <div className="flex items-center space-x-3">
                              <IconComponent className="w-5 h-5 text-red-400" />
                                <div>
                                  <p className="font-medium text-foreground">{module.title}</p>
                                  <p className="text-sm text-muted-foreground">{completionText}</p>
                                </div>
                              </div>
                              <ArrowRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {course.modules.length === 0 && (
                      <div className="text-center py-4">
                        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No modules available yet</p>
                      </div>
                    )}
                  </div>
              )}
            </div>

            {/* Timeline Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-foreground">Timeline</h2>
              
              <div className="bg-card rounded-lg p-6 border border-border">
                {/* Timeline Controls */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <select className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm">
                      <option>All</option>
                      <option>Assignments</option>
                      <option>Labs</option>
                      <option>Deadlines</option>
                    </select>
                    <select className="px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm">
                      <option>Sort by dates</option>
                      <option>Sort by priority</option>
                      <option>Sort by course</option>
                    </select>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search by activity type or name"
                    className="px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm flex-1 max-w-sm ml-4"
                  />
                </div>

                {/* Timeline Items */}
                <div className="space-y-6">
                  {/* Monday, 14 July 2025 */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">Monday, 14 July 2025</h3>
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">📄</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-600 dark:text-blue-400">Resit Coursework</h4>
                          <p className="text-sm text-muted-foreground">Assignment is due • 24/25, Smart Internet Technologies</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">17:00</span>
                        <button className="px-4 py-2 bg-muted border border-border rounded-lg text-foreground text-sm hover:bg-muted/80 transition-colors">
                          Add submission
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Friday, 18 July 2025 */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">Friday, 18 July 2025</h3>
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">📄</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-600 dark:text-blue-400">Final Project Report Upload (CW3 70% summer cohort)</h4>
                          <p className="text-sm text-muted-foreground">Assignment is due • 24/25, Honours Computer Science Project</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">16:00</span>
                        <button className="px-4 py-2 bg-muted border border-border rounded-lg text-foreground text-sm hover:bg-muted/80 transition-colors">
                          Add submission
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Monday, 21 July 2025 */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">Monday, 21 July 2025</h3>
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-lg">📄</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-600 dark:text-blue-400">CW Re-Sub (60%)</h4>
                          <p className="text-sm text-muted-foreground">Assignment is due • 24/25, Systems and Cyber Security</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">23:00</span>
                        <button className="px-4 py-2 bg-muted border border-border rounded-lg text-foreground text-sm hover:bg-muted/80 transition-colors">
                          Add submission
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Profile & Stats */}
          <div>
            <div className="bg-card rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold mb-6 text-center text-foreground">Your Profile & Stats</h3>
              
              {/* Profile Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-3">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
                <h4 className="font-semibold text-foreground">Mahtab Mehek</h4>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                  Level 7: Elite Hacker <span className="ml-1">⭐</span>
                </p>
              </div>

              {/* Completion Stats */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold mb-2 text-foreground">100%</div>
                <p className="text-muted-foreground mb-4">Overall Completion</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">4/4 Mandatory Labs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">3 Badges Earned</span>
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
