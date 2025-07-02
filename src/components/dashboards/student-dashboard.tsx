'use client'

import { useApp } from '@/lib/hooks/use-app'
import { BookOpen, Trophy, Flame, Clock, Play, ArrowRight, User } from 'lucide-react'

export function StudentDashboard() {
  const { user, appData, navigate } = useApp()

  const stats = {
    totalLabs: 10,
    completedLabs: 4,
    streakDays: user?.streakDays || 0,
    totalPoints: user?.totalPoints || 0,
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Section */}
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, Mahtab!
              </h1>
              <p className="text-gray-400">
                Ready to continue your learning journey?
              </p>
            </div>

            {/* Your Learning Path */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Learning Path</h2>
              
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-2">BSc (Hons) Computer Science</h3>
                <p className="text-gray-400 mb-6">
                  Foundational concepts in computer science, from programming to cybersecurity.
                </p>

                <div className="space-y-4">
                  <h4 className="font-medium">Modules in this path:</h4>
                  
                  {/* Module 1 */}
                  <div 
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => navigate('module', { moduleId: 'module-1' })}
                  >
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-medium">Web Technologies</p>
                        <p className="text-sm text-gray-400">3/3 Completed</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Module 2 */}
                  <div 
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => navigate('module', { moduleId: 'module-2' })}
                  >
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-medium">Systems and Cyber Security</p>
                        <p className="text-sm text-gray-400">2/4 Completed</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Module 3 */}
                  <div 
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => navigate('module', { moduleId: 'module-3' })}
                  >
                    <div className="flex items-center space-x-3">
                      <Flame className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-medium">Developing Applications</p>
                        <p className="text-sm text-gray-400">1/3 Completed</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Profile & Stats */}
          <div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-6 text-center">Your Profile & Stats</h3>
              
              {/* Profile Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mb-3">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
                <h4 className="font-semibold">Mahtab Mehek</h4>
                <p className="text-sm text-yellow-400 flex items-center">
                  Level 7: Elite Hacker <span className="ml-1">⭐</span>
                </p>
              </div>

              {/* Completion Stats */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold mb-2">100%</div>
                <p className="text-gray-400 mb-4">Overall Completion</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">4/4 Mandatory Labs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">3 Badges Earned</span>
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
