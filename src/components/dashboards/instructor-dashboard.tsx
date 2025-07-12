'use client'

import { useApp } from '@/lib/hooks/use-app'
import { Users, BookOpen, Plus, TrendingUp, Calendar, Eye } from 'lucide-react'

export function InstructorDashboard() {
  const { user, navigate } = useApp()

  const stats = {
    totalStudents: 156,
    activeLabs: 8,
    totalPaths: 2,
    monthlyEngagement: 87
  }

  const recentActivity = [
    { id: 1, student: 'Alex Johnson', action: 'Completed Firewall Configuration Lab', time: '2 hours ago' },
    { id: 2, student: 'Maria Garcia', action: 'Started SQL Injection Lab', time: '4 hours ago' },
    { id: 3, student: 'David Kim', action: 'Submitted APT Simulation Lab', time: '6 hours ago' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Instructor Dashboard 👩‍🏫
        </h1>
        <p className="text-blue-100 mb-4">
          Create and manage module content within assigned courses. Track student progress and engagement.
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center bg-white/20 rounded-lg px-4 py-2">
            <Users className="w-5 h-5 mr-2" />
            <span className="font-semibold">{stats.totalStudents} Students</span>
          </div>
          <div className="flex items-center bg-white/20 rounded-lg px-4 py-2">
            <BookOpen className="w-5 h-5 mr-2" />
            <span className="font-semibold">{stats.activeLabs} Active Labs</span>
          </div>
          <div className="flex items-center bg-white/20 rounded-lg px-4 py-2">
            <TrendingUp className="w-5 h-5 mr-2" />
            <span className="font-semibold">{stats.monthlyEngagement}% Engagement</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate('lab-creation')}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-left hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <Plus className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Create New Lab
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Design interactive labs with virtual environments
                </p>
              </button>
              
              <button className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-left hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                <Calendar className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Schedule Assignment
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Set deadlines and requirements for student work
                </p>
              </button>
              
              <button className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-left hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                <Eye className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  View Analytics
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Track student performance and engagement
                </p>
              </button>
            </div>
          </section>

          {/* Your Content */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Your Assigned Modules
              </h2>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Create Module Content
              </button>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
              <p>Learning path management features will be available soon.</p>
              <p className="text-sm">Paths are managed through the backend API.</p>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Student Activity */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Recent Student Activity
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-medium">
                        {activity.student.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.student}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Performance Overview */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Performance Overview
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Lab Completion Rate</span>
                    <span className="font-medium text-gray-900 dark:text-white">78%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Average Score</span>
                    <span className="font-medium text-gray-900 dark:text-white">85%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Student Engagement</span>
                    <span className="font-medium text-gray-900 dark:text-white">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
