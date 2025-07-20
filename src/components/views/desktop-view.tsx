'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { apiClient } from '@/lib/api'
import {
  Monitor,
  Maximize2,
  Minimize2,
  Power,
  Settings,
  Upload,
  Download,
  Terminal,
  FolderOpen,
  Clock,
  Wifi,
  Volume2,
  User,
  ArrowLeft,
  ExternalLink,
  Copy,
  RefreshCw,
  Share,
  FileText,
  Battery
} from 'lucide-react'

interface DesktopSession {
  sessionId: string;
  vncUrl: string;
  webUrl: string;
  port?: number;
  status: string;
  osType?: string;
  ipAddress?: string;
  persistenceType?: string;
  labId?: string;
  createdAt?: string;
}

export function DesktopView() {
  const { navigate } = useApp()
  const [session, setSession] = useState<DesktopSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [activeMenu, setActiveMenu] = useState('desktop')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeDesktopSession()
  }, [])

  const initializeDesktopSession = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // First try to get existing session
      try {
        console.log('🔍 Checking for existing Kali session...')
        const existingSession = await apiClient.desktop.getCurrentSession()
        if (existingSession.success) {
          console.log('✅ Found existing session:', existingSession.session)
          setSession(existingSession.session)
          setIsConnected(true)
          setIsLoading(false)
          return
        }
      } catch (err) {
        console.log('ℹ️ No existing session found, creating new one...')
      }

      // Create new session
      console.log('🐉 Creating new Kali desktop session...')
      const newSession = await apiClient.desktop.createSession('')

      if (newSession.success) {
        console.log('✅ Kali session created:', newSession.session)
        setSession(newSession.session)

        // Wait a bit for container to be ready
        setTimeout(() => {
          setIsConnected(true)
          setIsLoading(false)
        }, 5000)
      } else {
        throw new Error('Failed to create session')
      }

    } catch (error) {
      console.error('❌ Failed to initialize desktop session:', error)
      setError(error instanceof Error ? error.message : 'Failed to start desktop session')
      setIsLoading(false)
    }
  }

  const terminateSession = async () => {
    if (!session) return

    try {
      console.log('🛑 Terminating Kali session...')
      await apiClient.desktop.terminateSession()
      setSession(null)
      setIsConnected(false)
      navigate('dashboard')
    } catch (error) {
      console.error('❌ Failed to terminate session:', error)
    }
  }

  useEffect(() => {
    // Session timer
    if (isConnected) {
      const timer = setInterval(() => {
        setSessionTime(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isConnected])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const menuItems = [
    { id: 'desktop', name: 'Desktop', icon: Monitor },
    { id: 'terminal', name: 'Terminal', icon: Terminal },
    { id: 'files', name: 'Files', icon: FileText },
  ]

  return (
    <div className="h-screen bg-gray-900 text-white flex overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-16 bg-gray-800 flex flex-col items-center py-3 space-y-3 border-r border-gray-700">
        {/* Logo */}
        <div
          onClick={() => navigate('dashboard')}
          className="w-10 h-10 bg-red-600 rounded flex items-center justify-center mb-4 cursor-pointer hover:bg-red-500 transition-colors"
          title="Back to Dashboard"
        >
          <span className="text-white font-bold text-lg">M</span>
        </div>

        {/* Navigation Icons */}
        {menuItems.map((item) => {
          const IconComponent = item.icon
          return (
            <div
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-10 h-10 rounded flex items-center justify-center cursor-pointer transition-all duration-200 ${activeMenu === item.id
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                }`}
              title={item.name}
            >
              <IconComponent className="w-5 h-5" />
            </div>
          )
        })}

        <div className="flex-1" />

        {/* Back to Dashboard */}
        <button
          onClick={() => navigate('dashboard')}
          className="w-10 h-10 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center cursor-pointer transition-colors text-gray-300 hover:text-white"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Top Control Bar */}
        <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-white font-medium">
              {activeMenu === 'desktop' ? 'Remote Desktop' : activeMenu === 'terminal' ? 'Terminal' : 'File Browser'}
            </span>
            <div className="text-xs text-gray-400">
              {session?.osType || 'Kali Linux'} • {session?.ipAddress || 'localhost'}:{session?.port || 'N/A'}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Session Timer */}
            <div className="flex items-center space-x-2 text-xs text-gray-300">
              <Clock className="w-4 h-4" />
              <span>{formatTime(sessionTime)}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1">
              <button className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white" title="Share">
                <Share className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white" title="Upload">
                <Upload className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white" title="Download">
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={terminateSession}
                className="p-1 hover:bg-red-700 rounded transition-colors text-red-400 hover:text-red-300"
                title="Terminate Session"
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative bg-gray-900">
          {activeMenu === 'desktop' && (
            <div className="h-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                    <h3 className="text-base font-medium mb-2 text-white">Starting Kali Desktop Session</h3>
                    <p className="text-sm text-gray-400 mb-4">Creating container and initializing noVNC...</p>
                    <div className="w-6 h-6 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Monitor className="w-12 h-12 mx-auto mb-3 text-red-500" />
                    <h3 className="text-base font-medium mb-2 text-white">Failed to Start Desktop</h3>
                    <p className="text-sm text-gray-400 mb-4">{error}</p>
                    <button
                      onClick={initializeDesktopSession}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : !isConnected ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                    <h3 className="text-base font-medium mb-2 text-white">Starting Desktop Session</h3>
                    <p className="text-sm text-gray-400 mb-4">Connecting to {session?.osType || 'Kali Linux'}...</p>
                    <div className="w-6 h-6 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                </div>
              ) : (
                <div className="h-full bg-black flex items-center justify-center relative">
                  <div className="text-center">
                    <Monitor className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <h3 className="text-base font-medium mb-2 text-white">Desktop Connected</h3>
                    <p className="text-sm text-gray-400 mb-4">VNC session active at {session?.ipAddress || 'localhost'}:{session?.port || 'N/A'}</p>
                    {/* noVNC Iframe */}
                    <div className="w-full h-96">
                      <iframe
                        src={session?.webUrl}
                        className="w-full h-full border border-gray-700 rounded"
                        title="Kali Linux Desktop"
                        allow="fullscreen"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMenu === 'terminal' && (
            <div className="h-full bg-black p-3">
              <div className="h-full bg-black rounded border border-gray-700 p-3 font-mono text-sm text-green-400 leading-relaxed">
                <div>Welcome to Kali Linux</div>
                <div>root@kali:~# ls -la</div>
                <div>total 24</div>
                <div>drwx------ 1 root root  512 Jan  1 12:00 .</div>
                <div>drwxr-xr-x 1 root root  512 Jan  1 12:00 ..</div>
                <div>-rw-r--r-- 1 root root 3106 Jan  1 12:00 .bashrc</div>
                <div>-rw-r--r-- 1 root root  161 Jan  1 12:00 .profile</div>
                <div>drwxr-xr-x 1 root root  512 Jan  1 12:00 Desktop</div>
                <div>drwxr-xr-x 1 root root  512 Jan  1 12:00 Documents</div>
                <div>drwxr-xr-x 1 root root  512 Jan  1 12:00 Downloads</div>
                <div>root@kali:~# <span className="animate-pulse">|</span></div>
              </div>
            </div>
          )}

          {activeMenu === 'files' && (
            <div className="h-full bg-gray-900 p-3">
              <div className="bg-gray-800 rounded border border-gray-700 h-full flex flex-col">
                <div className="p-3 border-b border-gray-700">
                  <h3 className="font-medium text-white text-sm">File Browser</h3>
                  <p className="text-xs text-gray-400">/root</p>
                </div>
                <div className="flex-1 p-3 overflow-auto">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer text-sm">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-white">.bashrc</span>
                      <span className="text-xs text-gray-400 ml-auto">3.1 KB</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer text-sm">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-white">.profile</span>
                      <span className="text-xs text-gray-400 ml-auto">161 B</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer text-sm">
                      <FileText className="w-4 h-4 text-yellow-400" />
                      <span className="text-white">Desktop/</span>
                      <span className="text-xs text-gray-400 ml-auto">Folder</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer text-sm">
                      <FileText className="w-4 h-4 text-yellow-400" />
                      <span className="text-white">Documents/</span>
                      <span className="text-xs text-gray-400 ml-auto">Folder</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer text-sm">
                      <FileText className="w-4 h-4 text-yellow-400" />
                      <span className="text-white">Downloads/</span>
                      <span className="text-xs text-gray-400 ml-auto">Folder</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="h-6 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-4 text-xs">
          <div className="flex items-center space-x-4 text-gray-400">
            <span>Status: {isConnected ? <span className="text-green-400">Connected</span> : <span className="text-yellow-400">Connecting...</span>}</span>
            <span>Session: {session?.sessionId?.substring(0, 12) || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-400">
            <div className="flex items-center space-x-1">
              <Wifi className="w-3 h-3" />
              <span className="text-green-400">Connected</span>
            </div>
            <div className="flex items-center space-x-1">
              <Battery className="w-3 h-3" />
              <span>100%</span>
            </div>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
