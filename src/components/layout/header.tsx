'use client'

import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { Menu, Bell, User, Sun, Moon, Monitor, LogOut, Flame, Award, Trophy, Zap, Server, Wifi } from 'lucide-react'
import { useTheme } from 'next-themes'
import { userProgress, getStreakEmoji, getLevelInfo, achievements } from '@/demo/achievements'

export function Header() {
  const { user, navigate, logout, currentView, getCurrentLabSession, updateLabInteraction, cleanupExpiredSessions } = useApp()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [showCopiedNotification, setShowCopiedNotification] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Get current lab session
  const currentLabSession = getCurrentLabSession()

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

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

  // Update current time and remaining lab time every 10 seconds for more accurate updates
  useEffect(() => {
    // Set initial time on client side only
    setCurrentTime(new Date())

    // Initial cleanup
    cleanupExpiredSessions()

    const timer = setInterval(() => {
      setCurrentTime(new Date())
      // Clean up expired sessions
      cleanupExpiredSessions()
      // Update lab interaction to keep session alive
      if (currentLabSession && currentLabSession.isActive) {
        updateLabInteraction(currentLabSession.id)
      }
    }, 10000) // Update every 10 seconds

    return () => clearInterval(timer)
  }, [currentLabSession, updateLabInteraction, cleanupExpiredSessions])

  // Calculate remaining time for lab session
  const getRemainingTime = () => {
    if (!currentLabSession || !currentLabSession.isActive || !currentTime) return null

    try {
      const now = currentTime.getTime()
      // Ensure endTime is a Date object
      const endTime = currentLabSession.endTime instanceof Date
        ? currentLabSession.endTime.getTime()
        : new Date(currentLabSession.endTime).getTime()

      const remaining = Math.max(0, endTime - now)

      const hours = Math.floor(remaining / (1000 * 60 * 60))
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 0) {
        return { text: `${hours}h ${minutes}m`, isLow: remaining < 15 * 60 * 1000 } // Low if less than 15 min
      }
      return { text: `${minutes}m`, isLow: remaining < 15 * 60 * 1000 }
    } catch (error) {
      console.error('Error calculating remaining time:', error)
      return null
    }
  }

  const handleLabVMClick = () => {
    if (currentLabSession) {
      navigate('lab', {
        labId: currentLabSession.labId
      })
    }
  }

  const handleCopyIP = (e: React.MouseEvent, ip: string) => {
    e.stopPropagation() // Prevent lab navigation when clicking IP
    navigator.clipboard.writeText(ip).then(() => {
      setShowCopiedNotification(true)
      setTimeout(() => {
        setShowCopiedNotification(false)
      }, 2000) // Hide after 2 seconds
    }).catch(err => {
      console.error('Failed to copy IP:', err)
    })
  }

  const handleDesktopClick = () => {
    // Navigate to desktop view
    navigate('desktop')
  }

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  }

  // Use resolvedTheme for icon display when system is selected, otherwise use theme
  const currentThemeForIcon = theme === 'system' ? 'system' : (resolvedTheme || theme)
  const ThemeIcon = themeIcons[currentThemeForIcon as keyof typeof themeIcons] || Monitor
  const levelInfo = getLevelInfo(userProgress.level)
  const earnedAchievements = achievements.filter(a => a.earned)

  // Check if user is in a lab or desktop view
  const isInLab = currentView.type === 'lab' || currentView.type === 'desktop'
  const userMachineIP = '192.168.1.100'
  const remainingTime = getRemainingTime()

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
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <img
                  src="/logo.svg"
                  alt="Modulus Logo"
                  className="w-8 h-8"
                />
              </div>
              <span className="ml-3 text-xl font-bold text-white">
                Modulus
              </span>
            </div>

            {/* Lab VM Button - show when user has active lab session */}
            {currentLabSession && currentLabSession.isActive && (
              <div className="flex items-center space-x-4 ml-6">
                <div
                  onClick={handleLabVMClick}
                  className="flex items-center space-x-2 bg-red-500 hover:bg-red-400 px-3 py-1 rounded-full transition-colors cursor-pointer"
                >
                  <Server className="w-3 h-3" />
                  <span className="font-medium">{currentLabSession.labName}</span>
                  {currentLabSession.vmIP && (
                    <span
                      onClick={(e) => handleCopyIP(e, currentLabSession.vmIP!)}
                      className="text-xs opacity-80 hover:opacity-100 px-1 py-0.5 rounded bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
                      title="Click to copy IP"
                    >
                      ({currentLabSession.vmIP})
                    </span>
                  )}
                </div>
                {remainingTime && (
                  <div className={`flex items-center space-x-1 ${remainingTime.isLow ? 'text-red-300' : 'text-yellow-200'}`}>
                    <span className="text-xs font-medium">Time: {remainingTime.text}</span>
                    {remainingTime.isLow && <span className="text-xs">⚠️</span>}
                  </div>
                )}
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
                        className={`p-3 border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${achievement.earned ? 'bg-green-50 dark:bg-green-900/20' : 'opacity-50'
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

            {/* Desktop Button - Always visible */}
            <div
              onClick={handleDesktopClick}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-full transition-colors cursor-pointer"
            >
              <Monitor className="w-4 h-4" />
              <span className="font-medium">Desktop</span>
            </div>

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
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-gray-600">
                    <h3 className="font-semibold text-white">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="p-4 hover:bg-gray-700 border-b border-gray-600">
                      <p className="text-sm text-white font-medium">
                        New lab available: APT Simulation
                      </p>
                      <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                    </div>
                    <div className="p-4 hover:bg-gray-700 border-b border-gray-600">
                      <p className="text-sm text-white font-medium">
                        Congratulations! You earned ⚡12 🏆3 points and badges
                      </p>
                      <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                    </div>
                    <div className="p-4 hover:bg-gray-700">
                      <p className="text-sm text-white font-medium">
                        Achievement unlocked: ⚡25 🏆1 earned from completing Web Security module
                      </p>
                      <p className="text-xs text-gray-400 mt-1">3 days ago</p>
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

                  <div className="p-2">
                    <h4 className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Theme
                    </h4>
                    <button
                      onClick={() => setTheme('light')}
                      className={`w-full text-left px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center ${theme === 'light' ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                    >
                      <Sun className="w-4 h-4 mr-2" />
                      Light
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`w-full text-left px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center ${theme === 'dark' ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                    >
                      <Moon className="w-4 h-4 mr-2" />
                      Dark
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`w-full text-left px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center ${theme === 'system' ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                    >
                      <Monitor className="w-4 h-4 mr-2" />
                      <div className="flex flex-col">
                        <span>System</span>
                        {mounted && theme === 'system' && (
                          <span className="text-xs opacity-75">
                            {resolvedTheme === 'dark' ? '(Dark)' : '(Light)'}
                          </span>
                        )}
                      </div>
                    </button>
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

      {/* Copied Notification Popup */}
      {showCopiedNotification && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Copied!</span>
          </div>
        </div>
      )}
    </header>
  )
}
