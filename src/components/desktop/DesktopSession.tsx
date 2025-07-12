'use client'

import { useState, useEffect, useCallback } from 'react'
import { Monitor, Power, RefreshCw, AlertCircle, ExternalLink, Clock, Database, Wifi } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface DesktopSessionProps {
  labId: string
  labTitle?: string
  onClose?: () => void
}

interface SessionData {
  sessionId: string
  vncUrl: string
  webUrl: string
  status: string
  persistenceType: string
  labId: string
  createdAt?: string
}

export function DesktopSession({ labId, labTitle = `Lab ${labId}`, onClose }: DesktopSessionProps) {
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [terminating, setTerminating] = useState(false)
  const [sessionTimer, setSessionTimer] = useState<string>('')

  // Check for existing session on component mount
  useEffect(() => {
    checkExistingSession()
  }, [])

  // Update session timer every minute
  useEffect(() => {
    if (session?.createdAt) {
      const updateTimer = () => {
        const created = new Date(session.createdAt!)
        const now = new Date()
        const diffMs = now.getTime() - created.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))
        const hours = Math.floor(diffMins / 60)
        const minutes = diffMins % 60
        
        if (hours > 0) {
          setSessionTimer(`${hours}h ${minutes}m`)
        } else {
          setSessionTimer(`${minutes}m`)
        }
      }

      updateTimer()
      const interval = setInterval(updateTimer, 60000) // Update every minute
      
      return () => clearInterval(interval)
    }
  }, [session?.createdAt])

  const checkExistingSession = async () => {
    setLoading(true)
    try {
      const response = await apiClient.desktop.getCurrentSession()
      if (response.success && response.session) {
        setSession(response.session)
      }
    } catch (err: any) {
      // No existing session is fine
      if (err.status !== 404) {
        console.error('Error checking existing session:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  const createSession = async () => {
    setCreating(true)
    setError('')
    
    try {
      const response = await apiClient.desktop.createSession(labId)
      if (response.success) {
        setSession(response.session)
      } else {
        throw new Error('Failed to create session')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create desktop session'
      setError(errorMessage)
      console.error('Desktop session creation error:', err)
    } finally {
      setCreating(false)
    }
  }

  const terminateSession = async () => {
    if (!session) return
    
    setTerminating(true)
    try {
      await apiClient.desktop.terminateSession()
      setSession(null)
      setSessionTimer('')
      
      if (onClose) {
        onClose()
      }
    } catch (err: any) {
      console.error('Failed to terminate session:', err)
      setError('Failed to terminate session properly')
    } finally {
      setTerminating(false)
    }
  }

  const extendSession = async () => {
    try {
      const response = await apiClient.desktop.extendSession()
      if (response.success) {
        // Update last accessed time
        if (session) {
          setSession({
            ...session,
            createdAt: session.createdAt || new Date().toISOString()
          })
        }
      }
    } catch (err) {
      console.error('Failed to extend session:', err)
    }
  }

  const openInNewTab = useCallback(() => {
    if (session?.webUrl) {
      window.open(session.webUrl, '_blank', 'noopener,noreferrer')
    }
  }, [session?.webUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Checking for existing session...</p>
        </div>
      </div>
    )
  }

  if (creating) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-blue-600" />
          </div>
          <div className="space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900">Creating Your Kali Linux Environment</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Launching secure container...</p>
              <p>• Restoring your personal files...</p>
              <p>• Setting up VNC access...</p>
              <p className="text-blue-600 font-medium">This may take 1-3 minutes</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Desktop Session Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="flex space-x-3">
              <button 
                onClick={createSession}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              {onClose && (
                <button 
                  onClick={onClose}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Monitor className="w-10 h-10 text-blue-600" />
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">Kali Linux Desktop</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Launch a dedicated Kali Linux environment with your personal settings and files automatically restored.
        </p>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-sm text-left max-w-md mx-auto">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
            <Database className="w-4 h-4 mr-2" />
            Your Data is Preserved
          </h4>
          <ul className="text-blue-800 space-y-1">
            <li>• Personal files and scripts</li>
            <li>• Browser bookmarks and settings</li>
            <li>• SSH keys and configurations</li>
            <li>• Desktop customizations</li>
          </ul>
        </div>
        
        <button 
          onClick={createSession}
          disabled={creating}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          {creating ? 'Launching...' : 'Launch Desktop'}
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Kali Linux Desktop</h3>
              <p className="text-sm text-gray-300">{labTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Session Info */}
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Online</span>
              </div>
              
              {sessionTimer && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400">{sessionTimer}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <Database className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400">Hybrid Storage</span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={extendSession}
                className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 rounded bg-blue-900/30 hover:bg-blue-900/50 transition-colors"
                title="Extend Session"
              >
                Extend
              </button>
              
              <button 
                onClick={openInNewTab}
                className="text-gray-300 hover:text-white transition-colors"
                title="Open in New Tab"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              
              <button 
                onClick={terminateSession}
                disabled={terminating}
                className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                title="Terminate Session"
              >
                {terminating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Power className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop Content */}
      <div className="flex-1 bg-black">
        <iframe 
          src={session.webUrl}
          className="w-full h-full border-0"
          title="Kali Linux Desktop"
          allow="clipboard-read; clipboard-write"
        />
      </div>
      
      {/* Footer */}
      <div className="bg-gray-100 px-4 py-2 text-xs text-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Session ID: {session.sessionId.slice(0, 8)}...</span>
          <span>VNC Port: Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-600">• Data Auto-Saved</span>
        </div>
      </div>
    </div>
  )
}
