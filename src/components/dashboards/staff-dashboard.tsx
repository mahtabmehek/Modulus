'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { apiClient } from '@/lib/api'
import { Users, BookOpen, GraduationCap, UserCheck, UserPlus, BarChart3, Settings, Plus, RefreshCw, Eye, AlertTriangle, Search, X, Edit } from 'lucide-react'

export function StaffDashboard() {
  const { user, navigate } = useApp()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalInstructors: 0,
    totalStudents: 0,
    pendingApprovals: 0,
  })
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any>(null)
  const [courseFormData, setCourseFormData] = useState({
    title: '',
    code: '',
    department: '',
    academicLevel: '',
    totalCredits: '',
    duration: '',
    description: ''
  })

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [usersResponse, coursesResponse] = await Promise.all([
          apiClient.getAllUsers(),
          apiClient.getCourses()
        ])

        const users = usersResponse.users || []
        const courses = coursesResponse.courses || []

        const instructors = users.filter(u => u.role === 'instructor')
        const students = users.filter(u => u.role === 'student')
        const pending = users.filter(u => u.status === 'pending')

        setStats({
          totalUsers: users.length,
          totalCourses: courses.length,
          totalInstructors: instructors.length,
          totalStudents: students.length,
          pendingApprovals: pending.length,
        })

        setCourses(courses)
      } catch (error) {
        console.error('Failed to load staff dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const loadCourses = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getCourses()
      setCourses(response.courses || [])
    } catch (error) {
      console.error('Failed to load courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validate required fields
    if (!courseFormData.title.trim()) {
      alert('❌ Course title is required')
      return
    }
    if (!courseFormData.code.trim()) {
      alert('❌ Course code is required')
      return
    }
    if (!courseFormData.department) {
      alert('❌ Department is required')
      return
    }
    if (!courseFormData.totalCredits || parseInt(courseFormData.totalCredits) < 20 || parseInt(courseFormData.totalCredits) > 360) {
      alert('❌ Credits must be between 20 and 360')
      return
    }
    if (!courseFormData.duration || parseInt(courseFormData.duration) < 1 || parseInt(courseFormData.duration) > 52) {
      alert('❌ Duration must be between 1 and 52 weeks')
      return
    }
    // Enhanced description validation
    const descriptionText = courseFormData.description.trim()
    if (descriptionText.length > 0 && descriptionText.split(' ').filter(word => word.length > 0).length < 10) {
      alert('❌ Description must contain at least 10 words')
      return
    }

    try {
      setLoading(true)
      console.log('Creating course:', courseFormData)

      const response = await apiClient.createCourse({
        title: courseFormData.title.trim(),
        code: courseFormData.code.trim().toUpperCase(),
        department: courseFormData.department,
        academicLevel: courseFormData.academicLevel,
        totalCredits: parseInt(courseFormData.totalCredits),
        description: descriptionText || `An comprehensive ${courseFormData.academicLevel} level course in ${courseFormData.title}. This course covers essential concepts and practical applications in the field, designed to provide students with thorough understanding and hands-on experience.`,
        duration: parseInt(courseFormData.duration)
      })

      setShowCourseModal(false)
      setEditingCourse(null)
      setCourseFormData({
        title: '',
        code: '',
        department: '',
        academicLevel: '',
        totalCredits: '',
        duration: '',
        description: ''
      })
      await loadCourses() // Refresh the list
      alert(editingCourse ? '✅ Course updated successfully!' : '✅ Course created successfully!')
    } catch (error: any) {
      console.error('Failed to create course:', error)
      
      // More specific error handling
      if (error.message && error.message.includes('400')) {
        if (error.message.includes('duplicate') || error.message.includes('exists')) {
          alert('❌ Course code already exists. Please use a different code.')
        } else if (error.message.includes('validation')) {
          alert('❌ Validation error. Please check all required fields.')
        } else {
          alert('❌ Invalid course data. Please check your input and try again.')
        }
      } else {
        alert('❌ Failed to create course. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditCourse = (course: any) => {
    setEditingCourse(course)
    setCourseFormData({
      title: course.title || '',
      code: course.code || '',
      department: course.department || '',
      academicLevel: course.academicLevel || '',
      totalCredits: course.totalCredits ? String(course.totalCredits) : '',
      duration: course.duration ? String(course.duration) : '',
      description: course.description || ''
    })
    setShowCourseModal(true)
  }

  const filteredCourses = courses.filter(course =>
    course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.department?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            Staff Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage courses, users, and academic programs
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalCourses}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Instructors</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalInstructors}</p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold text-foreground">{stats.pendingApprovals}</p>
              </div>
              <Settings className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Course Management */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Course Management</h2>
              <div className="flex gap-3">
                <button
                  onClick={loadCourses}
                  disabled={loading}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => {
                    setEditingCourse(null)
                    setCourseFormData({
                      title: '',
                      code: '',
                      department: '',
                      academicLevel: '',
                      totalCredits: '',
                      duration: '',
                      description: ''
                    })
                    setShowCourseModal(true)
                  }}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Create Course
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search courses by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-foreground"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                <span className="ml-2 text-muted-foreground">Loading courses...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-foreground">Course</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Code</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Department</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Level</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Duration</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Credits</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Students</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.length > 0 ? filteredCourses.map((course) => (
                      <tr key={course.id} className="border-b border-border/50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-foreground">{course.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {course.description}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-foreground font-mono">{course.code}</td>
                        <td className="py-3 px-4 text-muted-foreground">{course.department}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            course.academicLevel === 'bachelor'
                              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                              : course.academicLevel === 'master'
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
                          }`}>
                            {course.academicLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{course.duration || 16} weeks</td>
                        <td className="py-3 px-4 text-muted-foreground">{course.totalCredits}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {course.enrolledStudents || 0}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button 
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 p-1"
                              title="Edit Course"
                              onClick={() => handleEditCourse(course)}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          {searchTerm ? `No courses found matching "${searchTerm}"` : 'No courses found. Click refresh to load courses from the API.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-card rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold mb-6 text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('course-overview')}
              className="flex items-center space-x-3 p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-left"
            >
              <GraduationCap className="w-6 h-6 text-green-500" />
              <div>
                <h3 className="font-medium text-foreground">Course Overview</h3>
                <p className="text-sm text-muted-foreground">View all courses and programs</p>
              </div>
            </button>

            <button
              onClick={() => navigate('user-overview')}
              className="flex items-center space-x-3 p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-left"
            >
              <Settings className="w-6 h-6 text-purple-500" />
              <div>
                <h3 className="font-medium text-foreground">User Overview</h3>
                <p className="text-sm text-muted-foreground">Manage all user accounts</p>
              </div>
            </button>
          </div>
        </div>

        {/* Course Creation Modal */}
        {showCourseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 border border-border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  {editingCourse ? 'Edit Course' : 'Create New Course'}
                </h3>
                <button
                  onClick={() => {
                    setShowCourseModal(false)
                    setEditingCourse(null)
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    value={courseFormData.title}
                    onChange={(e) => setCourseFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-foreground"
                    placeholder="e.g., Introduction to Computer Science"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    value={courseFormData.code}
                    onChange={(e) => setCourseFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-foreground"
                    placeholder="e.g., CS101, MATH200, ENG150"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Department</label>
                  <select
                    required
                    value={courseFormData.department}
                    onChange={(e) => setCourseFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-foreground"
                  >
                    <option value="">Choose department...</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Business">Business</option>
                    <option value="Science">Science</option>
                    <option value="Arts">Arts</option>
                    <option value="Social Sciences">Social Sciences</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Academic Level</label>
                  <select
                    required
                    value={courseFormData.academicLevel}
                    onChange={(e) => setCourseFormData(prev => ({ ...prev, academicLevel: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-foreground"
                  >
                    <option value="">Select academic level...</option>
                    <option value="bachelor">Bachelor's Degree</option>
                    <option value="master">Master's Degree</option>
                    <option value="phd">PhD / Doctoral</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Credits</label>
                    <input
                      type="text"
                      required
                      value={courseFormData.totalCredits}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                          setCourseFormData(prev => ({ ...prev, totalCredits: value }))
                        }
                      }}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-foreground"
                      placeholder="20-360"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Duration (weeks)</label>
                    <input
                      type="text"
                      required
                      value={courseFormData.duration}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 52)) {
                          setCourseFormData(prev => ({ ...prev, duration: value }))
                        }
                      }}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-foreground"
                      placeholder="1-52"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <textarea
                    rows={4}
                    value={courseFormData.description}
                    onChange={(e) => setCourseFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-foreground"
                    placeholder="Provide a comprehensive description of the course objectives, topics covered, and learning outcomes."
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      {courseFormData.description.trim() ? 
                        `${courseFormData.description.trim().split(' ').filter(word => word.length > 0).length} words` : 
                        'No description provided'
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {courseFormData.description.trim().length > 0 && 
                        courseFormData.description.trim().split(' ').filter(word => word.length > 0).length < 10 ? 
                        '⚠️ Minimum 10 words required' : 
                        courseFormData.description.trim().length > 0 ? '✓ Valid' : ''
                      }
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCourseModal(false)
                      setEditingCourse(null)
                    }}
                    className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    {loading ? (editingCourse ? 'Updating...' : 'Creating...') : (editingCourse ? 'Update Course' : 'Create Course')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
