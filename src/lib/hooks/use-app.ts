'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect } from 'react'
import { User, ViewState, AppData, UserProgress, DesktopSession, LabSession } from '@/types'
import { mockData } from '@/lib/data/mock-data'
import { apiClient } from '@/lib/api'

interface AppStore {
  // User state
  user: User | null
  isAuthenticated: boolean
  
  // View state
  currentView: ViewState
  
  // App data
  appData: AppData
  
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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  navigate: (type: ViewState['type'], params?: ViewState['params']) => void
  updateProgress: (progress: UserProgress) => void
  createDesktopSession: (labId: string) => Promise<DesktopSession>
  terminateDesktopSession: (sessionId: string) => void
  switchUserRole: (role: User['role']) => void
  initializeFromUrl: () => void
  
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
      appData: mockData,
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
          
          // Use real API in production, mock in development
          if (process.env.NODE_ENV === 'production') {
            const response = await apiClient.login({ email, password })
            console.log('Production login successful:', response)

            // Set token in API client
            apiClient.setToken(response.token)
            
            // Set user and redirect to dashboard
            set({
              user: response.user,
              isAuthenticated: true,
              currentView: { type: 'dashboard' }
            })
            
            return { success: true }
          } else {
            // Development mock authentication
            const testUsers = {
              'student@test.com': { id: 'user-1', name: 'Test Student', role: 'student' as const },
              'instructor@test.com': { id: 'user-2', name: 'Test Instructor', role: 'instructor' as const },
              'admin@test.com': { id: 'user-3', name: 'Test Admin', role: 'admin' as const },
              'student@modulus.com': { id: 'user-1', name: 'Test Student', role: 'student' as const },
              'instructor@modulus.com': { id: 'user-2', name: 'Test Instructor', role: 'instructor' as const },
              'admin@modulus.com': { id: 'user-3', name: 'Test Admin', role: 'admin' as const }
            }
            
            const user = testUsers[email as keyof typeof testUsers]
            const validPassword = ['student123', 'instructor123', 'admin123'].includes(password)
            
            if (user && validPassword) {
              console.log('Mock login successful:', user)
              
              // Create mock user object
              const mockUser: User = {
                id: user.id,
                email: email,
                name: user.name,
                role: user.role,
                avatar: '/api/placeholder/40/40',
                level: 1,
                levelName: 'Beginner',
                badges: [],
                streakDays: 0,
                totalPoints: 0,
                joinedAt: new Date(),
                lastActive: new Date(),
                preferences: {
                  theme: 'dark',
                  language: 'en',
                  notifications: {
                    email: true,
                    push: true,
                    announcements: true,
                    labUpdates: true
                  }
                },
                isApproved: true,
                approvalStatus: 'approved'
              }
              
              // Set user and redirect to dashboard
              set({
                user: mockUser,
                isAuthenticated: true,
                currentView: { type: 'dashboard' }
              })
              
              return { success: true }
            } else {
              console.log('Invalid credentials')
              return { success: false, error: 'Invalid email or password' }
            }
          }
        } catch (error) {
          console.error('Login error:', error)
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Login failed' 
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
      
      switchUserRole: (role) => {
        const { user } = get()
        if (user) {
          const mockUser = mockData.users.find(u => u.role === role) || user
          set({ user: { ...mockUser, role } })
        }
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
        const { user, appData, labSessions } = get()
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
        
        // Find the lab details
        const lab = appData.labs.find(l => l.id === labId)
        if (!lab) throw new Error('Lab not found')
        
        const now = new Date()
        const endTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
        
        const session: LabSession = {
          id: `lab-session-${Date.now()}`,
          userId: user.id,
          labId,
          labName: lab.title,
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
  
  // Initialize development invite codes on first load
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('invite_DEVACCESS')) {
      const devInvite = {
        id: 'dev-invite-1',
        code: 'DEVACCESS',
        name: 'Development User',
        email: 'dev@modulus.edu',
        role: 'admin',
        permissions: ['all'],
        createdBy: 'system',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isUsed: false
      }
      localStorage.setItem('invite_DEVACCESS', JSON.stringify(devInvite))
      console.log('Created development invite code: DEVACCESS')
    }
  }, [])
  
  return store
}
