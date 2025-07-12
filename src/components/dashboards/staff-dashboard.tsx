'use client'

import { useApp } from '@/lib/hooks/use-app'
import { Users, BookOpen, GraduationCap, Settings, Plus, Edit, User } from 'lucide-react'

export function StaffDashboard() {
  const { user, navigate } = useApp()
  
  // TODO: Load real data from API
  const stats = {
    totalUsers: 0,
    totalCourses: 0,
    totalInstructors: 0,
    totalStudents: 0,
    pendingApprovals: 0,
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
              <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
                <p>Course management features will be available soon.</p>
                <p className="text-sm">Courses are managed through the backend API.</p>
              </div>
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
              <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
                <p>User management features will be available soon.</p>
                <p className="text-sm">Users are managed through the backend API.</p>
              </div>
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
