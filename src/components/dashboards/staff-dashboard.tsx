'use client'

import { useApp } from '@/lib/hooks/use-app'
import { Users, BookOpen, GraduationCap, Settings, Plus, Edit, User } from 'lucide-react'

export function StaffDashboard() {
  const { user, appData, navigate } = useApp()

  const stats = {
    totalUsers: appData.users.length,
    totalCourses: appData.courses?.length || 0,
    totalInstructors: appData.users.filter(u => u.role === 'instructor').length,
    totalStudents: appData.users.filter(u => u.role === 'student').length,
    pendingApprovals: appData.users.filter(u => u.approvalStatus === 'pending').length,
  }

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Management */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Course Management</h2>
              <button 
                onClick={() => navigate('course-creation')}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Course</span>
              </button>
            </div>

            <div className="space-y-4">
              {appData.courses?.slice(0, 5).map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-medium text-foreground">{course.title}</h3>
                    <p className="text-sm text-muted-foreground">{course.code} • {course.level}</p>
                    <p className="text-xs text-muted-foreground">{course.duration} year(s) • {course.totalCredits} credits</p>
                  </div>
                  <button 
                    onClick={() => navigate('course-edit', { courseId: course.id })}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              )) || (
                <p className="text-muted-foreground text-center py-4">No courses available</p>
              )}
            </div>
          </div>

          {/* User Management */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">User Management</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => navigate('user-creation')}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create User</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Recent Users */}
              {appData.users.filter(u => u.role !== 'admin').slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-medium text-foreground">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.role === 'instructor' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {user.role}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.approvalStatus === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        user.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {user.approvalStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => navigate('user-profile', { userId: user.id })}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                      title="View Profile"
                    >
                      <User className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => navigate('user-edit', { userId: user.id })}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit User"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
      </div>
    </div>
  )
}
