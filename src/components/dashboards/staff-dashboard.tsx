'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { apiClient } from '@/lib/api'
import { Users, BookOpen, GraduationCap, UserCheck, UserPlus, BarChart3, Settings, Plus, RefreshCw, Eye, AlertTriangle, Search, X, Edit, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  
  // Pending approvals state
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [approvalsPage, setApprovalsPage] = useState(1)
  const approvalsPerPage = 5

  // Pagination for approvals
  const paginatedApprovals = pendingApprovals.slice(
    (approvalsPage - 1) * approvalsPerPage,
    approvalsPage * approvalsPerPage
  )
  const totalApprovalsPages = Math.ceil(pendingApprovals.length / approvalsPerPage)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [usersResponse, coursesResponse, pendingResponse] = await Promise.all([
          apiClient.getAllUsers(),
          apiClient.getCourses(),
          apiClient.getPendingApprovals()
        ])

        const users = usersResponse.users || []
        const courses = coursesResponse.courses || []
        const pendingUsers = pendingResponse.users || []

        // Filter pending users - staff can only see students and instructors (not admin/staff)
        const filteredPendingUsers = pendingUsers.filter(u => 
          u.role === 'student' || u.role === 'instructor'
        )

        const instructors = users.filter(u => u.role === 'instructor')
        const students = users.filter(u => u.role === 'student')

        setStats({
          totalUsers: users.length,
          totalCourses: courses.length,
          totalInstructors: instructors.length,
          totalStudents: students.length,
          pendingApprovals: filteredPendingUsers.length,
        })

        setCourses(courses)
        setPendingApprovals(filteredPendingUsers)
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
      const [coursesResponse, pendingResponse] = await Promise.all([
        apiClient.getCourses(),
        apiClient.getPendingApprovals()
      ])
      
      const courses = coursesResponse.courses || []
      const pendingUsers = pendingResponse.users || []
      const filteredPendingUsers = pendingUsers.filter(u => 
        u.role === 'student' || u.role === 'instructor'
      )
      
      setCourses(courses)
      setPendingApprovals(filteredPendingUsers)
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalCourses: courses.length,
        pendingApprovals: filteredPendingUsers.length
      }))
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate required fields
    if (!courseFormData.title.trim()) {
      toast.error('Course title is required')
      return
    }
    if (!courseFormData.code.trim()) {
      toast.error('Course code is required')
      return
    }
    if (!courseFormData.department) {
      toast.error('Department is required')
      return
    }
    if (!courseFormData.totalCredits || parseInt(courseFormData.totalCredits) < 1) {
      toast.error('Credits must be a positive number')
      return
    }
    if (!courseFormData.duration || parseInt(courseFormData.duration) < 1 || parseInt(courseFormData.duration) > 52) {
      toast.error('Duration must be between 1 and 52 weeks')
      return
    }
    // Enhanced description validation
    const descriptionText = courseFormData.description.trim()
    if (descriptionText.length > 0 && descriptionText.split(' ').filter(word => word.length > 0).length < 10) {
      toast.error('Description must contain at least 10 words')
      return
    }

    try {
      setLoading(true)
      console.log(editingCourse ? 'Updating course:' : 'Creating course:', courseFormData)

      const courseData = {
        title: courseFormData.title.trim(),
        code: courseFormData.code.trim().toUpperCase(),
        department: courseFormData.department,
        academicLevel: courseFormData.academicLevel,
        totalCredits: parseInt(courseFormData.totalCredits, 10) || 0,
        description: descriptionText || `An comprehensive ${courseFormData.academicLevel} level course in ${courseFormData.title}. This course covers essential concepts and practical applications in the field, designed to provide students with thorough understanding and hands-on experience.`,
        duration: parseInt(courseFormData.duration, 10) || 0
      }

      // Validate parsed integer values
      if (courseData.totalCredits <= 0) {
        toast.error('Total credits must be a positive number')
        setLoading(false)
        return
      }
      
      if (courseData.duration <= 0) {
        toast.error('Duration must be a positive number')  
        setLoading(false)
        return
      }

      console.log('🎯 Course Data Debug:', {
        isEditing: !!editingCourse,
        courseData,
        formData: courseFormData
      })

      const response = editingCourse
        ? await apiClient.updateCourse(editingCourse.id, courseData)
        : await apiClient.createCourse(courseData)

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
      toast.success(editingCourse ? 'Course updated successfully!' : 'Course created successfully!')
    } catch (error: any) {
      console.error('Failed to create course:', error)

      // More specific error handling
      if (error.message && error.message.includes('400')) {
        if (error.message.includes('duplicate') || error.message.includes('exists')) {
          toast.error('Course code already exists. Please use a different code.')
        } else if (error.message.includes('validation')) {
          toast.error('Validation error. Please check all required fields.')
        } else {
          toast.error('Invalid course data. Please check your input and try again.')
        }
      } else {
        toast.error('Failed to create course. Please try again.')
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

  const handleDeleteCourse = async () => {
    if (deleteConfirmText !== 'delete') {
      toast.error('Please type "delete" to confirm deletion')
      return
    }

    if (!editingCourse) return

    setLoading(true)
    try {
      await apiClient.deleteCourse(editingCourse.id)
      toast.success('Course deleted successfully!')

      // Refresh courses list
      const coursesResponse = await apiClient.getCourses()
      setCourses(coursesResponse.courses || [])

      // Close modal and reset states
      setShowCourseModal(false)
      setEditingCourse(null)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
      setCourseFormData({
        title: '',
        code: '',
        department: '',
        academicLevel: '',
        totalCredits: '',
        duration: '',
        description: ''
      })
    } catch (error: any) {
      console.error('Delete course error:', error)
      toast.error('Failed to delete course. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // User approval handlers
  const handleApproveUser = async (userId: string) => {
    try {
      await apiClient.approveUser(Number(userId))
      toast.success('User approved successfully!')
      
      // Refresh pending approvals
      const pendingResponse = await apiClient.getPendingApprovals()
      const pendingUsers = pendingResponse.users || []
      const filteredPendingUsers = pendingUsers.filter(u => 
        u.role === 'student' || u.role === 'instructor'
      )
      setPendingApprovals(filteredPendingUsers)
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingApprovals: filteredPendingUsers.length
      }))
    } catch (error) {
      console.error('Failed to approve user:', error)
      toast.error('Failed to approve user. Please try again.')
    }
  }

  const handleRejectUser = async (userId: string) => {
    if (confirm('Are you sure you want to reject this user? This action cannot be undone.')) {
      try {
        await apiClient.rejectUser(Number(userId))
        toast.success('User rejected successfully!')
        
        // Refresh pending approvals
        const pendingResponse = await apiClient.getPendingApprovals()
        const pendingUsers = pendingResponse.users || []
        const filteredPendingUsers = pendingUsers.filter(u => 
          u.role === 'student' || u.role === 'instructor'
        )
        setPendingApprovals(filteredPendingUsers)
        
        // Update stats
        setStats(prev => ({
          ...prev,
          pendingApprovals: filteredPendingUsers.length
        }))
      } catch (error) {
        console.error('Failed to reject user:', error)
        toast.error('Failed to reject user. Please try again.')
      }
    }
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
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.academicLevel === 'bachelor'
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

        {/* Pending User Approvals Card */}
        <div className="bg-card rounded-lg p-6 border border-border mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Pending User Approvals</h2>
            <div className="flex gap-3">
              <button
                onClick={loadCourses}
                disabled={loading}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
              <span className="ml-2 text-muted-foreground">Loading pending approvals...</span>
            </div>
          ) : pendingApprovals.length > 0 ? (
            <div className="space-y-4">
              {paginatedApprovals.map((user) => (
                <div key={user.id} className="bg-muted rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 dark:text-purple-300 font-semibold">
                          {user.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {user.name || 'Unknown User'}
                        </h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'instructor'
                              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
                              : user.role === 'student'
                                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300'
                          }`}>
                            {user.role}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Registered {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveUser(user.id)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectUser(user.id)}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Approvals Pagination */}
              {totalApprovalsPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6 pt-4 border-t border-border">
                  <button
                    onClick={() => setApprovalsPage(prev => Math.max(1, prev - 1))}
                    disabled={approvalsPage === 1}
                    className="flex items-center gap-1 px-3 py-2 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-foreground rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-muted-foreground px-4">
                    Page {approvalsPage} of {totalApprovalsPages} ({pendingApprovals.length} total)
                  </span>
                  <button
                    onClick={() => setApprovalsPage(prev => Math.min(totalApprovalsPages, prev + 1))}
                    disabled={approvalsPage === totalApprovalsPages}
                    className="flex items-center gap-1 px-3 py-2 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-foreground rounded-lg transition-colors"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-foreground mb-2">
                All caught up!
              </h4>
              <p className="text-muted-foreground">
                No pending user approvals at the moment.
              </p>
            </div>
          )}
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
                        if (value === '' || parseInt(value) >= 1) {
                          setCourseFormData(prev => ({ ...prev, totalCredits: value }))
                        }
                      }}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-foreground"
                      placeholder="Enter credits"
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
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }}
                    className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  {editingCourse && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  )}
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 border border-border">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-foreground">Delete Course</h3>
              </div>

              <div className="mb-6">
                <p className="text-muted-foreground mb-4">
                  Are you sure you want to delete the course "{editingCourse?.title}"?
                </p>
                <p className="text-sm text-red-600 mb-4">
                  This action cannot be undone. All associated data will be permanently removed.
                </p>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Type "delete" to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
                    placeholder="Type 'delete' to confirm"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                  }}
                  className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCourse}
                  disabled={loading || deleteConfirmText !== 'delete'}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {loading ? 'Deleting...' : 'Delete Course'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
