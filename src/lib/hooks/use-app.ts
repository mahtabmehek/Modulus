'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, ViewState, UserProgress, DesktopSession, LabSession } from '@/types'
import { apiClient } from '@/lib/api'

interface AppStore {
  // User state
  user: User | null
  isAuthenticated: boolean

  // View state
  currentView: ViewState

  // Progress tracking
  userProgress: UserProgress[]

  // Desktop sessions
  desktopSessions: DesktopSession[]

  // Lab sessions
  labSessions: LabSession[]
  currentLabSession: LabSession | null

  // Actions
  setUser: (user: User | null) => void
  logout: () => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: any }>
  register: (name: string, email: string, password: string, role: string, accessCode: string) => Promise<{ success: boolean; error?: any }>
  navigate: (type: ViewState['type'], params?: ViewState['params']) => void
  updateProgress: (progress: UserProgress) => void
  createDesktopSession: (labId: string) => Promise<DesktopSession>
  terminateDesktopSession: (sessionId: string) => void
  initializeFromUrl: () => void
  initialize: () => void // Add initialization function
  checkSession: () => Promise<boolean> // Add session check function

  // Lab session actions
  startLabSession: (labId: string) => Promise<LabSession>
  extendLabSession: (sessionId: string) => boolean
  endLabSession: (sessionId: string) => void
  updateLabInteraction: (sessionId: string) => void
  getCurrentLabSession: () => LabSession | null
  cleanupExpiredSessions: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state - No authenticated user, start with login
      user: null,
      isAuthenticated: false,
      currentView: { type: 'login' },
      userProgress: [],
      desktopSessions: [],
      labSessions: [],
      currentLabSession: null,

      // Actions
      setUser: (user) => {
        set({ user, isAuthenticated: !!user })
        // If logging out, redirect to login
        if (!user) {
          set({ currentView: { type: 'login' } })
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, currentView: { type: 'login' } })
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          url.searchParams.set('view', 'login')
          // Clear all other params
          Array.from(url.searchParams.keys()).forEach(key => {
            if (key !== 'view') {
              url.searchParams.delete(key)
            }
          })
          window.history.pushState({ view: { type: 'login' } }, '', url.toString())
        }
      },
      login: async (email: string, password: string) => {
        try {
          console.log('Attempting login with:', { email })

          const response = await apiClient.login({ email, password })
          console.log('Login successful:', response)
          console.log('🎯 TOKEN RECEIVED:', response.token ? `${response.token.substring(0, 30)}...` : 'No token')

          // Check if user is approved (admins are always approved)
          if (response.user.role !== 'admin' && !response.user.isApproved) {
            // Show pending approval screen for unapproved non-admin users
            set({
              user: response.user,
              isAuthenticated: true,
              currentView: { type: 'pending-approval' }
            })
            return { success: true }
          }

          // Set token in API client
          console.log('🎯 CALLING setToken with:', response.token ? 'Valid token' : 'No token')
          apiClient.setToken(response.token)

          // Set user and redirect to dashboard
          set({
            user: response.user,
            isAuthenticated: true,
            currentView: { type: 'dashboard' }
          })

          // Update browser URL to dashboard
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.set('view', 'dashboard')
            // Clear other view params
            Array.from(url.searchParams.keys()).forEach(key => {
              if (key !== 'view') {
                url.searchParams.delete(key)
              }
            })
            window.history.pushState({ view: { type: 'dashboard' } }, '', url.toString())
          }

          return { success: true }
        } catch (error) {
          console.error('Login error:', error)
          return {
            success: false,
            error: error // Pass the entire error object
          }
        }
      },

      register: async (name: string, email: string, password: string, role: string, accessCode: string) => {
        try {
          console.log('Attempting registration with:', { name, email, role })

          const response = await apiClient.register({ name, email, password, role, accessCode })
          console.log('Registration successful:', response)

          // Set token in API client
          apiClient.setToken(response.token)

          // Check if user requires approval
          if (response.user.isApproved) {
            // Auto-approved users (admins) go straight to dashboard
            set({
              user: response.user,
              isAuthenticated: true,
              currentView: { type: 'dashboard' }
            })
          } else {
            // Users requiring approval see a pending approval screen
            set({
              user: response.user,
              isAuthenticated: true,
              currentView: { type: 'pending-approval' }
            })
          }

          return { success: true }
        } catch (error) {
          console.error('Registration error:', error)
          return {
            success: false,
            error: error // Pass the entire error object
          }
        }
      },

      navigate: (type, params = {}) => {
        const newView: ViewState = { type, params }
        set({ currentView: newView })

        // Update browser history for proper back button behavior
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          url.searchParams.set('view', type)

          // Clear existing params first
          Array.from(url.searchParams.keys()).forEach(key => {
            if (key !== 'view') {
              url.searchParams.delete(key)
            }
          })

          // Add any parameters to the URL
          if (params) {
            Object.entries(params).forEach(([key, value]) => {
              if (value) {
                url.searchParams.set(key, String(value))
              }
            })
          }

          // Push new state to browser history
          window.history.pushState({ view: newView }, '', url.toString())
        }
      },

      updateProgress: (progress) => {
        set((state) => ({
          userProgress: [
            ...state.userProgress.filter(p =>
              !(p.userId === progress.userId && p.labId === progress.labId)
            ),
            progress
          ]
        }))
      },

      createDesktopSession: async (labId) => {
        const { user } = get()
        if (!user) throw new Error('User not authenticated')

        const session: DesktopSession = {
          id: `session-${Date.now()}`,
          userId: user.id,
          labId,
          token: `token-${Math.random().toString(36).substr(2, 9)}`,
          status: 'starting',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
          lastActive: new Date(),
        }

        set((state) => ({
          desktopSessions: [...state.desktopSessions, session]
        }))

        // Simulate session startup
        setTimeout(() => {
          set((state) => ({
            desktopSessions: state.desktopSessions.map(s =>
              s.id === session.id
                ? { ...s, status: 'running' as const, vnc_port: 5900, ssh_port: 22 }
                : s
            )
          }))
        }, 3000)

        return session
      },

      terminateDesktopSession: (sessionId) => {
        set((state) => ({
          desktopSessions: state.desktopSessions.filter(s => s.id !== sessionId)
        }))
      },

      initializeFromUrl: () => {
        if (typeof window === 'undefined') return

        const url = new URL(window.location.href)
        const viewType = url.searchParams.get('view') as ViewState['type'] || 'login'

        // Extract parameters from URL and build the params object correctly
        const params: ViewState['params'] = {}

        // Get specific parameters based on view type
        if (viewType === 'lab') {
          const moduleId = url.searchParams.get('moduleId')
          const labId = url.searchParams.get('labId')
          if (moduleId && labId) {
            params.moduleId = moduleId
            params.labId = labId
          }
        } else if (viewType === 'module') {
          const moduleId = url.searchParams.get('moduleId')
          if (moduleId) {
            params.moduleId = moduleId
          }
        } else if (viewType === 'path') {
          const pathId = url.searchParams.get('pathId')
          if (pathId) {
            params.pathId = pathId
          }
        } else if (viewType === 'desktop') {
          const sessionId = url.searchParams.get('sessionId')
          if (sessionId) {
            params.sessionId = sessionId
          }
        }

        const newView: ViewState = { type: viewType, params }
        set({ currentView: newView })
      },

      // Lab session actions
      startLabSession: async (labId: string) => {
        const { user, labSessions } = get()
        if (!user) throw new Error('User not authenticated')

        // Clean up any expired sessions first
        get().cleanupExpiredSessions()

        // Check if user already has an active lab session
        const existingActiveSession = labSessions.find(s =>
          s.userId === user.id && s.isActive
        )

        if (existingActiveSession) {
          throw new Error('You already have an active lab session. Please end it before starting a new one.')
        }

        const now = new Date()
        const endTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now

        const session: LabSession = {
          id: `lab-session-${Date.now()}`,
          userId: user.id,
          labId,
          labName: `Lab ${labId}`, // Simplified lab name for content-based labs
          startTime: now,
          endTime,
          lastInteraction: now,
          remainingMinutes: 60,
          isActive: true,
          canExtend: true,
          vmIP: `10.0.1.${Math.floor(Math.random() * 254) + 1}`,
        }

        set((state) => ({
          labSessions: [...state.labSessions, session],
          currentLabSession: session
        }))

        // Set up auto-close timer for inactivity (30 minutes)
        const timeoutId = setTimeout(() => {
          const currentState = get()
          const currentSession = currentState.labSessions.find(s => s.id === session.id)
          if (currentSession && currentSession.isActive) {
            const timeSinceLastInteraction = Date.now() - currentSession.lastInteraction.getTime()
            if (timeSinceLastInteraction >= 30 * 60 * 1000) { // 30 minutes
              get().endLabSession(session.id)
            }
          }
        }, 30 * 60 * 1000)

        return session
      },

      extendLabSession: (sessionId: string) => {
        const { labSessions } = get()
        const session = labSessions.find(s => s.id === sessionId)

        if (!session || !session.isActive || !session.canExtend) {
          return false
        }

        const now = new Date()
        const newEndTime = new Date(session.endTime.getTime() + 30 * 60 * 1000) // Add 30 minutes

        set((state) => ({
          labSessions: state.labSessions.map(s =>
            s.id === sessionId
              ? {
                ...s,
                endTime: newEndTime,
                remainingMinutes: Math.ceil((newEndTime.getTime() - now.getTime()) / (60 * 1000)),
                canExtend: false, // Can only extend once
                lastInteraction: now,
              }
              : s
          ),
          currentLabSession: state.currentLabSession?.id === sessionId
            ? {
              ...state.currentLabSession,
              endTime: newEndTime,
              remainingMinutes: Math.ceil((newEndTime.getTime() - now.getTime()) / (60 * 1000)),
              canExtend: false,
              lastInteraction: now,
            }
            : state.currentLabSession
        }))

        return true
      },

      endLabSession: (sessionId: string) => {
        set((state) => ({
          labSessions: state.labSessions.map(s =>
            s.id === sessionId
              ? { ...s, isActive: false, remainingMinutes: 0 }
              : s
          ),
          currentLabSession: state.currentLabSession?.id === sessionId
            ? null
            : state.currentLabSession
        }))
      },

      updateLabInteraction: (sessionId: string) => {
        const now = new Date()
        set((state) => ({
          labSessions: state.labSessions.map(s =>
            s.id === sessionId
              ? {
                ...s,
                lastInteraction: now,
                remainingMinutes: Math.ceil((s.endTime.getTime() - now.getTime()) / (60 * 1000))
              }
              : s
          ),
          currentLabSession: state.currentLabSession?.id === sessionId
            ? {
              ...state.currentLabSession,
              lastInteraction: now,
              remainingMinutes: Math.ceil((state.currentLabSession.endTime.getTime() - now.getTime()) / (60 * 1000))
            }
            : state.currentLabSession
        }))
      },

      getCurrentLabSession: () => {
        const { user, labSessions } = get()
        if (!user) return null

        return labSessions.find(s => s.userId === user.id && s.isActive) || null
      },

      cleanupExpiredSessions: () => {
        const now = new Date()
        set((state) => ({
          labSessions: state.labSessions.map(s => {
            if (s.isActive && now > s.endTime) {
              return { ...s, isActive: false, remainingMinutes: 0 }
            }
            return s
          }),
          currentLabSession: state.currentLabSession && now > state.currentLabSession.endTime
            ? null
            : state.currentLabSession
        }))
      },

      // Initialize user state and check session validity
      initialize: () => {
        const { user, checkSession } = get()

        // Check URL params and restore view state
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          const viewParam = url.searchParams.get('view')

          if (viewParam && user) {
            // User is logged in, restore view from URL
            switch (viewParam) {
              case 'dashboard':
                set({ currentView: { type: 'dashboard' } })
                break
              case 'profile':
                set({ currentView: { type: 'profile' } })
                break
              case 'course-creation':
                set({ currentView: { type: 'course-creation' } })
                break
              default:
                set({ currentView: { type: 'dashboard' } })
            }
          } else if (user) {
            // User is logged in but no view param, go to dashboard
            set({ currentView: { type: 'dashboard' } })
            url.searchParams.set('view', 'dashboard')
            window.history.replaceState({ view: { type: 'dashboard' } }, '', url.toString())
          } else {
            // No user, go to login
            set({ currentView: { type: 'login' } })
            url.searchParams.set('view', 'login')
            window.history.replaceState({ view: { type: 'login' } }, '', url.toString())
          }

          // Listen for browser back/forward navigation
          const handlePopState = (event: PopStateEvent) => {
            if (event.state?.view) {
              set({ currentView: event.state.view })
            }
          }

          window.addEventListener('popstate', handlePopState)
          return () => window.removeEventListener('popstate', handlePopState)
        }
      },

      // Check session validity with the server
      checkSession: async () => {
        const { user } = get()
        if (!user) return false

        try {
          const response = await apiClient.checkSession()
          if (response.valid) {
            // Session is valid, update user state
            set({ user: response.user, isAuthenticated: true })
            return true
          } else {
            // Session is invalid, clear user state
            set({ user: null, isAuthenticated: false })
            return false
          }
        } catch (error) {
          console.error('Session check error:', error)
          return false
        }
      },
    }),
    {
      name: 'modulus-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        userProgress: state.userProgress,
        labSessions: state.labSessions,
        currentLabSession: state.currentLabSession,
      }),
    }
  )
)

export const useApp = () => {
  const store = useAppStore()
  return store
}
