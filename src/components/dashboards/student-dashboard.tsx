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
              
              <div className="bg-card rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold mb-2 text-foreground">BSc (Hons) Computer Science</h3>
                <p className="text-muted-foreground mb-6">
                  Foundational concepts in computer science, from programming to cybersecurity.
                </p>

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Modules in this path:</h4>
                  
                  {/* Module 1 */}
                  <div 
                    className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => navigate('module', { moduleId: 'module-1' })}
                  >
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-medium text-foreground">Web Technologies</p>
                        <p className="text-sm text-muted-foreground">3/3 Completed</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>

                  {/* Module 2 */}
                  <div 
                    className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => navigate('module', { moduleId: 'module-2' })}
                  >
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-medium text-foreground">Systems and Cyber Security</p>
                        <p className="text-sm text-muted-foreground">2/4 Completed</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>

                  {/* Module 3 */}
                  <div 
                    className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => navigate('module', { moduleId: 'module-3' })}
                  >
                    <div className="flex items-center space-x-3">
                      <Flame className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-medium text-foreground">Developing Applications</p>
                        <p className="text-sm text-muted-foreground">1/3 Completed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
