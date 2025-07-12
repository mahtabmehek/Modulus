'use client'

import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { Menu, Bell, User, Sun, Moon, Monitor, LogOut, Flame, Award, Trophy, Zap, Server, Wifi } from 'lucide-react'
import { useTheme } from 'next-themes'
import { userProgress, getStreakEmoji, getLevelInfo, achievements } from '@/demo/achievements'

export function Header() {
  const { user, navigate, logout, currentView } = useApp()
  const { theme, setTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  
  // Refs for dropdown menus
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const achievementsRef = useRef<HTMLDivElement>(null)

  // Handle clicking outside dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (achievementsRef.current && !achievementsRef.current.contains(event.target as Node)) {
        setShowAchievements(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  }

  const ThemeIcon = themeIcons[theme as keyof typeof themeIcons] || Monitor
  const levelInfo = getLevelInfo(userProgress.level)
  const earnedAchievements = achievements.filter(a => a.earned)

  // Check if user is in a lab or desktop session
  const isInLab = currentView.type === 'lab' || currentView.type === 'desktop'
  
  // Get IP addresses from session data - TODO: Replace with real session data
  const currentSession = null // Placeholder until session management is implemented
  const userMachineIP = 'Local Network'
  const labVmIP = currentSession ? `VM-${(currentSession as any).id.slice(0, 8)}` : 'N/A'

  return (
    <header className="bg-red-600 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side: Logo + Lab VM */}
          <div className="flex items-center space-x-4">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => navigate('dashboard')}
            >
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="ml-3 text-xl font-bold text-white">
                Modulus
              </span>
            </div>

            {/* Lab VM Button */}
            {isInLab && (
              <div className="flex items-center space-x-2 bg-red-500 hover:bg-red-400 px-3 py-1 rounded-full transition-colors cursor-pointer ml-6">
                <Server className="w-3 h-3" />
                <span className="font-medium">Lab VM: {labVmIP}</span>
              </div>
            )}
          </div>

          {/* Right Side: Streaks, Achievements, Your Desktop, and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Current Streak */}
            <div className="flex items-center space-x-1">
              <span className="text-lg">{getStreakEmoji(userProgress.currentStreak)}</span>
              <span className="font-medium">{userProgress.currentStreak}</span>
            </div>

            {/* Achievements Dropdown */}
            <div className="relative" ref={achievementsRef}>
              <button
                onClick={() => setShowAchievements(!showAchievements)}
                className="flex items-center space-x-1 hover:bg-red-500 px-2 py-1 rounded transition-colors"
              >
                <Award className="w-4 h-4" />
                <span className="font-medium">{earnedAchievements.length}</span>
              </button>

              {showAchievements && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 text-gray-900 dark:text-gray-100">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold">Achievements</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {earnedAchievements.length} of {achievements.length} unlocked
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {achievements.map((achievement) => (
                      <div 
                        key={achievement.id}
                        className={`p-3 border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
                          achievement.earned ? 'bg-green-50 dark:bg-green-900/20' : 'opacity-50'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{achievement.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{achievement.name}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {achievement.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                                {achievement.points} XP
                              </span>
                              {achievement.earned && achievement.earnedDate && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {achievement.earnedDate.toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Your Desktop Button (when in lab) */}
            {isInLab && (
              <div className="flex items-center space-x-2 bg-green-600 hover:bg-green-500 px-3 py-1 rounded-full transition-colors cursor-pointer">
                <Monitor className="w-3 h-3" />
                <span className="font-medium">Your desktop</span>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => {
                const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
                setTheme(nextTheme)
              }}
              className="p-2 text-white/80 hover:text-white transition-colors"
              title={`Current theme: ${theme}`}
            >
              <ThemeIcon className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-white/80 hover:text-white transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                        New lab available: APT Simulation
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">2 hours ago</p>
                    </div>
                    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                        Congratulations! You earned the &quot;Week Warrior&quot; badge
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">1 day ago</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-red-500 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-white/80 capitalize">
                    {user?.role}
                  </p>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  
                  <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => navigate('profile')}
                      className="w-full text-left px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        logout()
                        setShowUserMenu(false)
                      }}
                      className="w-full text-left px-2 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
