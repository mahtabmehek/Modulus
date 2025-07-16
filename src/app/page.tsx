'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useApp } from '@/lib/hooks/use-app'
import { Header } from '@/components/layout/header'
import { StudentDashboard } from '@/components/dashboards/student-dashboard'
import { InstructorDashboard } from '@/components/dashboards/instructor-dashboard'
import { StaffDashboard } from '@/components/dashboards/staff-dashboard'
import { AdminDashboard } from '@/components/dashboards/admin-dashboard'
import { PathView } from '@/components/views/path-view'
import { ModuleView } from '@/components/views/module-view'
import LabView from '@/components/views/lab-view'
import LabCreationView from '@/components/views/lab-creation'
import { CourseCreationView } from '@/components/views/course-creation'
import { UserCreationView } from '@/components/views/user-creation'
import { DesktopView } from '@/components/views/desktop-view'
import { ProfileView } from '@/components/views/profile-view'
import CognitoAuth from '@/components/auth/cognito-auth'
import { PendingApprovalView } from '@/components/views/pending-approval'
import { Footer } from '@/components/layout/footer'

export default function Home() {
  const { isAuthenticated, isLoading, user: cognitoUser } = useAuth()
  const { currentView, user: appUser, initialize } = useApp()
  const [isClient, setIsClient] = useState(false)

  // Use Cognito user as the primary user, fallback to app user for backward compatibility
  const user = cognitoUser || appUser

  // Handle client-side hydration and initialization
  useEffect(() => {
    setIsClient(true)
    // Initialize the app state and URL handling
    const cleanup = initialize()
    return cleanup
  }, [initialize])

  // Debug logging
  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, isLoading, cognitoUser, user })
  }, [isAuthenticated, isLoading, cognitoUser, user])

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

    // Show Cognito auth if not authenticated
    if (!isAuthenticated) {
      return <CognitoAuth />
    }

    if (currentView.type === 'pending-approval') {
      return <PendingApprovalView />
    }

    // Protected pages (authentication required) - This is now handled above with CognitoAuth

    // Check if user is approved before allowing access to protected views (admins are always approved)
    if (user && user.role !== 'admin' && !user.isApproved) {
      return <PendingApprovalView />
    }

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
        return <LabView />
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
