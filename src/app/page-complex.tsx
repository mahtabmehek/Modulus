'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/local-auth-provider'
import { useApp } from '@/lib/hooks/use-app'
import { Header } from '@/components/layout/header'
import { StudentDashboard } from '@/components/dashboards/student-dashboard'
import { InstructorDashboard } from '@/components/dashboards/instructor-dashboard'
import { StaffDashboard } from '@/components/dashboards/staff-dashboard'
import { AdminDashboard } from '@/components/dashboards/admin-dashboard'
import { PathView } from '@/components/views/path-view'
import { ModuleView } from '@/components/views/module-view'
// import LabView from '@/components/views/lab-view'
import LabCreationView from '@/components/views/lab-creation'
import { CourseCreationView } from '@/components/views/course-creation'
import { UserCreationView } from '@/components/views/user-creation'
import { DesktopView } from '@/components/views/desktop-view'
import { ProfileView } from '@/components/views/profile-view'
import LocalAuth from '@/components/auth/local-auth'
import { Footer } from '@/components/layout/footer'
import { UserRole } from '@/types'

export default function Home() {
  const { isAuthenticated, isLoading, user: localUser } = useAuth()
  const { currentView, user: appUser, initialize, setUser, navigate } = useApp()
  const [isClient, setIsClient] = useState(false)

  // Convert local user to App user format
  const user = localUser ? {
    id: localUser.id,
    email: localUser.email,
    name: localUser.name,
    role: localUser.role as UserRole,
    isApproved: true, // All users are auto-approved in local mode
    level: 1,
    levelName: 'Beginner',
    badges: [],
    streakDays: 0,
    totalPoints: 0,
    joinedAt: new Date(),
    lastActive: new Date(),
    preferences: {
      theme: 'light' as const,
      language: 'en',
      notifications: {
        email: true,
        push: true,
        announcements: true,
        labUpdates: true
      }
    },
    status: 'approved' as const
  } : appUser

  // Sync local user with app store
  useEffect(() => {
    console.log('🔍 Auth sync effect triggered:', { localUser, isAuthenticated });

    if (localUser && isAuthenticated) {
      const adaptedUser = {
        id: localUser.id,
        email: localUser.email,
        name: localUser.name,
        role: localUser.role as UserRole,
        isApproved: true,
        level: 1,
        levelName: 'Beginner',
        badges: [],
        streakDays: 0,
        totalPoints: 0,
        joinedAt: new Date(),
        lastActive: new Date(),
        preferences: {
          theme: 'light' as const,
          language: 'en',
          notifications: {
            email: true,
            push: true,
            announcements: true,
            labUpdates: true
          }
        },
        status: 'approved' as const
      }
      setUser(adaptedUser)

      console.log('🔄 User authenticated, setting adapted user:', adaptedUser);

      // Navigate to dashboard after login
      if (currentView.type === 'login') {
        console.log('🔄 Navigating to dashboard')
        navigate('dashboard')
      }
    } else if (!isAuthenticated) {
      setUser(null)
      console.log('🔄 User not authenticated, clearing user');
    }
  }, [localUser, isAuthenticated, setUser, navigate, currentView.type])

  // Handle client-side hydration and initialization
  useEffect(() => {
    setIsClient(true)
    // Initialize the app state and URL handling
    const cleanup = initialize()
    return cleanup
  }, [initialize])

  // Debug logging
  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, isLoading, localUser, user })
  }, [isAuthenticated, isLoading, localUser, user, isClient])

  const renderContent = () => {
    // Show loading during hydration to prevent mismatch
    if (!isClient || isLoading) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      )
    }

    // Show local auth if not authenticated
    if (!isAuthenticated) {
      return <LocalAuth />
    }

    // All users are auto-approved in local mode
    // Protected pages (authentication required)

    switch (currentView.type) {
      case 'dashboard':
        switch (user?.role) {
          case 'student':
            return <StudentDashboard />
          case 'instructor':
            return <InstructorDashboard />
          case 'staff':
            return <StaffDashboard />
          case 'admin':
            return <AdminDashboard />
          default:
            return <StudentDashboard />
        }
      case 'path':
        return <PathView />
      case 'module':
        return <ModuleView />
      case 'lab':
        return <div>Lab view temporarily disabled</div> // <LabView />
      case 'lab-creation':
        return <LabCreationView />
      case 'course-creation':
        return <CourseCreationView />
      case 'user-creation':
        return <UserCreationView />
      case 'desktop':
        return <DesktopView />
      case 'profile':
      case 'user-profile':
        return <ProfileView />
      default:
        return <StudentDashboard />
    }
  }

  // Don't show header/footer for public pages, full-screen views, and pending approval
  const isPublicPage = ['login'].includes(currentView.type) || !isAuthenticated
  const isFullScreenView = ['desktop', 'lab-creation'].includes(currentView.type)
  const isPendingApproval = isAuthenticated && user && user.role !== 'admin' && !user.isApproved

  // Debug logging
  console.log('Layout Debug:', {
    isAuthenticated,
    currentView: currentView.type,
    user: user ? { role: user.role, isApproved: user.isApproved } : null,
    isPublicPage,
    isFullScreenView,
    isPendingApproval
  })

  if (isPublicPage || isFullScreenView || isPendingApproval) {
    return (
      <div className="min-h-screen">
        {renderContent()}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
      <Footer />
    </div>
  )
}
