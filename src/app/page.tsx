'use client'

import { useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { Header } from '@/components/layout/header'
import { StudentDashboard } from '@/components/dashboards/student-dashboard'
import { InstructorDashboard } from '@/components/dashboards/instructor-dashboard'
import { AdminDashboard } from '@/components/dashboards/admin-dashboard'
import { PathView } from '@/components/views/path-view'
import { ModuleView } from '@/components/views/module-view'
import LabView from '@/components/views/lab-view'
import { DesktopView } from '@/components/views/desktop-view'
import { ProfileView } from '@/components/views/profile-view'
import LandingPage from '@/components/views/landing-page'
import LoginPage from '@/components/views/login-page'
import RegisterPage from '@/components/views/register-page'
import ApprovalPendingPage from '@/components/views/approval-pending-page'
import { Footer } from '@/components/layout/footer'

export default function Home() {
  const { currentView, user, initializeFromUrl } = useApp()

  // Handle browser back/forward navigation
  useEffect(() => {
    // Initialize from URL on mount
    initializeFromUrl()
    
    // Set initial browser state if none exists
    if (typeof window !== 'undefined' && !window.history.state) {
      const url = new URL(window.location.href)
      if (!url.searchParams.has('view')) {
        // If no user is logged in, show landing page, otherwise dashboard
        const defaultView = user ? 'dashboard' : 'landing'
        url.searchParams.set('view', defaultView)
        window.history.replaceState({ view: { type: defaultView } }, '', url.toString())
      }
    }
    
    // Handle browser back/forward buttons
    const handlePopState = (event: PopStateEvent) => {
      initializeFromUrl()
    }
    
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [initializeFromUrl, user])

  const renderContent = () => {
    // Public pages (no authentication required)
    if (currentView.type === 'landing') {
      return <LandingPage />
    }
    if (currentView.type === 'login') {
      return <LoginPage />
    }
    if (currentView.type === 'register') {
      return <RegisterPage />
    }
    if (currentView.type === 'approval-pending') {
      return <ApprovalPendingPage />
    }

    // Protected pages (authentication required)
    if (!user) {
      return <LandingPage />
    }

    switch (currentView.type) {
      case 'dashboard':
        switch (user?.role) {
          case 'student':
            return <StudentDashboard />
          case 'instructor':
            return <InstructorDashboard />
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
      case 'desktop':
        return <DesktopView />
      case 'profile':
        return <ProfileView />
      default:
        return user ? <StudentDashboard /> : <LandingPage />
    }
  }

  // Don't show header/footer for public pages
  const isPublicPage = ['landing', 'login', 'register', 'approval-pending'].includes(currentView.type)

  if (isPublicPage) {
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
