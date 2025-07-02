'use client'

import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { Menu, Bell, User, Sun, Moon, Monitor, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'

export function Header() {
  const { user, navigate, switchUserRole } = useApp()
  const { theme, setTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Refs for dropdown menus
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Handle clicking outside dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleRoleSwitch = (role: 'student' | 'instructor' | 'admin') => {
    switchUserRole(role)
    setShowUserMenu(false)
  }

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  }

  const ThemeIcon = themeIcons[theme as keyof typeof themeIcons] || Monitor

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => navigate('dashboard')}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                Modulus
              </span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                by mahtabmehek
              </span>
            </div>

            <nav className="hidden md:flex space-x-6">
              <button
                onClick={() => navigate('dashboard')}
                className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('profile')}
                className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
              >
                Profile
              </button>
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={() => {
                const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
                setTheme(nextTheme)
              }}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              title={`Current theme: ${theme}`}
            >
              <ThemeIcon className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
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
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
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
                      Switch Role
                    </h4>
                    <button
                      onClick={() => handleRoleSwitch('student')}
                      className="w-full text-left px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Student View
                    </button>
                    <button
                      onClick={() => handleRoleSwitch('instructor')}
                      className="w-full text-left px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Instructor View
                    </button>
                    <button
                      onClick={() => handleRoleSwitch('admin')}
                      className="w-full text-left px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Admin View
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
