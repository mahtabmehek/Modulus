'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, ViewState, AppData, UserProgress, DesktopSession } from '@/types'
import { mockData } from '@/lib/data/mock-data'

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
  
  // Actions
  setUser: (user: User | null) => void
  navigate: (type: ViewState['type'], params?: ViewState['params']) => void
  updateProgress: (progress: UserProgress) => void
  createDesktopSession: (labId: string) => Promise<DesktopSession>
  terminateDesktopSession: (sessionId: string) => void
  switchUserRole: (role: User['role']) => void
  initializeFromUrl: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: mockData.users[0], // Default to first user
      isAuthenticated: true,
      currentView: { type: 'dashboard' },
      appData: mockData,
      userProgress: [],
      desktopSessions: [],

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
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
        const viewType = url.searchParams.get('view') as ViewState['type'] || 'dashboard'
        
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
    }),
    {
      name: 'modulus-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        userProgress: state.userProgress,
      }),
    }
  )
)

export const useApp = () => {
  const store = useAppStore()
  return store
}
