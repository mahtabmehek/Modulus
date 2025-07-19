'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { Users, BookOpen, Plus, Layers, Eye, Edit, Tag, ChevronLeft, ChevronRight } from 'lucide-react'
import { Lab } from '@/lib/api/labs'

interface Course {
  id: number
  title: string
  code: string
  description: string
  department: string
  academicLevel: string
  duration: number
  totalCredits: number
  createdAt: string
  updatedAt: string
}

export function InstructorDashboard() {
  const { user, navigate } = useApp()
  const [labs, setLabs] = useState<Lab[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [studentCount, setStudentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [currentLabPage, setCurrentLabPage] = useState(0)
  const [showAllCourses, setShowAllCourses] = useState(false)

  const stats = {
    totalStudents: studentCount,
    activeLabs: labs.length,
    totalPaths: 2
  }

  // Load labs and courses on component mount
  useEffect(() => {
    loadLabs()
    loadCourses()
    loadStudentCount()
  }, [])

  const loadStudentCount = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health/stats')

      if (response.ok) {
        const data = await response.json()
        setStudentCount(data.studentCount || 0)
      } else {
        console.error('Failed to load student count:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading student count:', error)
    }
  }

  const loadLabs = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('modulus_token')

      if (!token) {
        console.error('No token found')
        return
      }

      const response = await fetch('http://localhost:3001/api/labs', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setLabs(data.data || [])
      }
    } catch (error) {
      console.error('Error loading labs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async () => {
    try {
      setCoursesLoading(true)
      const response = await fetch('http://localhost:3001/api/courses')

      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setCoursesLoading(false)
    }
  }

  const handlePreviewLab = (labId: number) => {
    // Navigate to lab preview (student view)
    window.open(`/lab/${labId}?preview=true`, '_blank')
  }

  const handleEditLab = (labId: number) => {
    // Navigate to lab creation page with edit mode and lab ID
    navigate('lab-creation', { editLabId: labId })
  }

  const handleCreateLab = () => {
    // Navigate to lab creation page
    navigate('lab-creation')
  }

  const handleViewCourse = (courseId: number) => {
    // Navigate to course overview page
    navigate('course-overview', { courseId: courseId.toString() })
  }

  const handleEditCourse = (courseId: number) => {
    // Navigate to course design page with course data for editing
    navigate('course-creation', { courseId: courseId.toString() })
  }

  // Lab pagination helpers
  const labsPerPage = 6
  const totalLabPages = Math.ceil(labs.length / labsPerPage)
  const currentLabs = labs.slice(currentLabPage * labsPerPage, (currentLabPage + 1) * labsPerPage)

  const nextLabPage = () => {
    if (currentLabPage < totalLabPages - 1) {
      setCurrentLabPage(currentLabPage + 1)
    }
  }

  const prevLabPage = () => {
    if (currentLabPage > 0) {
      setCurrentLabPage(currentLabPage - 1)
    }
  }

  // Course display helpers
  const displayedCourses = showAllCourses ? courses : courses.slice(0, 4)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto p-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <h1 className="text-2xl font-bold mb-4">
              Instructor Dashboard 👩‍🏫
            </h1>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center bg-white/20 rounded-lg px-4 py-2">
                <Users className="w-5 h-5 mr-2" />
                <span className="font-semibold">{stats.totalStudents} Students</span>
              </div>
              <div className="flex items-center bg-white/20 rounded-lg px-4 py-2">
                <BookOpen className="w-5 h-5 mr-2" />
                <span className="font-semibold">{courses.length} Courses</span>
              </div>
              <div className="flex items-center bg-white/20 rounded-lg px-4 py-2">
                <Layers className="w-5 h-5 mr-2" />
                <span className="font-semibold">{stats.activeLabs} Labs</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Main Content */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('course-creation')}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl border-2 border-green-400 p-6 text-left hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <Layers className="w-8 h-8 text-white mb-3" />
                <h3 className="font-semibold text-white mb-1">
                  Design a Course
                </h3>
                <p className="text-green-100 text-sm">
                  Create modules and organize labs into structured courses
                </p>
              </button>

              <button
                onClick={handleCreateLab}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl border-2 border-blue-400 p-6 text-left hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <Plus className="w-8 h-8 text-white mb-3" />
                <h3 className="font-semibold text-white mb-1">
                  Create New Lab
                </h3>
                <p className="text-blue-100 text-sm">
                  Design interactive labs with virtual environments
                </p>
              </button>
            </div>
          </section>

          {/* Your Labs */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Your Labs
                </h2>
                {labs.length > labsPerPage && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={prevLabPage}
                      disabled={currentLabPage === 0}
                      className={`p-2 rounded-lg transition-colors ${currentLabPage === 0
                          ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {currentLabPage + 1} of {totalLabPages}
                    </span>
                    <button
                      onClick={nextLabPage}
                      disabled={currentLabPage >= totalLabPages - 1}
                      className={`p-2 rounded-lg transition-colors ${currentLabPage >= totalLabPages - 1
                          ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-gray-500 dark:text-gray-400">Loading labs...</p>
              </div>
            ) : labs.length === 0 ? (
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                <p>No labs created yet.</p>
                <p className="text-sm">Create your first lab to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentLabs.map((lab) => (
                  <div
                    key={lab.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                  >
                    <div className="flex flex-col items-center text-center h-full">
                      {/* Lab Icon - Centered at top */}
                      <div className="mb-3">
                        {lab.icon_path ? (
                          <img
                            src={lab.icon_path}
                            alt={lab.title}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                            onError={(e) => {
                              // Show default icon if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-lg border border-gray-200 dark:border-gray-600">
                            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                          </div>
                        )}
                      </div>

                      {/* Title and Tags - Centered below icon */}
                      <div className="flex-grow mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm line-clamp-2">
                          {lab.title}
                        </h3>

                        {/* Tags */}
                        {lab.tags && lab.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2 justify-center">
                            {lab.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              >
                                <Tag className="w-2.5 h-2.5 mr-1" />
                                {tag}
                              </span>
                            ))}
                            {lab.tags.length > 2 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{lab.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-1.5 w-full">
                        <button
                          onClick={() => handlePreviewLab(lab.id)}
                          className="flex-1 flex items-center justify-center px-2 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs rounded-md transition-colors"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Preview
                        </button>
                        <button
                          onClick={() => handleEditLab(lab.id)}
                          className="flex-1 flex items-center justify-center px-2 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded-md transition-colors"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Your Courses */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Your Courses
              </h2>
            </div>

            {coursesLoading ? (
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-gray-500 dark:text-gray-400">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                <p>No courses created yet.</p>
                <p className="text-sm">Create your first course to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-green-300 dark:hover:border-green-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 flex items-center justify-center bg-green-100 dark:bg-green-900 rounded-lg border border-gray-200 dark:border-gray-600">
                          <Layers className="w-6 h-6 text-green-600 dark:text-green-300" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {course.title}
                            </h3>
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                              {course.code}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {course.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{course.department}</span>
                            <span>•</span>
                            <span>{course.totalCredits} credits</span>
                            <span>•</span>
                            <span className="capitalize">{course.academicLevel}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewCourse(course.id)}
                          className="flex items-center justify-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => handleEditCourse(course.id)}
                          className="flex items-center justify-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Show more button */}
                {courses.length > 4 && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => setShowAllCourses(!showAllCourses)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium"
                    >
                      {showAllCourses ? 'Show less' : `Show ${courses.length - 4} more courses`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
