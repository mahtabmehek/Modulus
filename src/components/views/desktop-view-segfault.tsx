'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
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

export function DesktopViewSegfault() {
  const { navigate } = useApp()
  const [isConnected, setIsConnected] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [activeMenu, setActiveMenu] = useState('desktop')

  // Desktop session would come from API
  const session = {
    id: '',
    status: 'disconnected',
    osType: '',
    ipAddress: '',
    vncPort: 0,
    sshPort: 0,
    expiresAt: new Date(),
  }

  useEffect(() => {
    // Simulate connection process
    const timer = setTimeout(() => setIsConnected(true), 3000)
    return () => clearTimeout(timer)
  }, [])

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
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-20 bg-gray-800 flex flex-col items-center py-4 space-y-4">
        <div className="flex flex-col items-center mb-6">
          <h6 className="text-2xl font-bold text-red-500">M</h6>
          <span className="text-xs text-gray-400">by mahtabmehek</span>
        </div>
        
        {menuItems.map((item) => {
          const IconComponent = item.icon
          return (
            <div
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                activeMenu === item.id 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title={item.name}
            >
              <IconComponent className="w-6 h-6" />
            </div>
          )
        })}
        
        <div className="flex-1" />
        
        {/* Back button */}
        <button
          onClick={() => navigate('dashboard')}
          className="w-12 h-12 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center cursor-pointer transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Control Bar */}
        <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">
              {activeMenu === 'desktop' ? 'Remote Desktop' : activeMenu === 'terminal' ? 'Terminal' : 'File Browser'}
            </span>
            <div className="text-xs text-gray-400">
              {session.osType} • {session.ipAddress}:{session.vncPort}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Session Info */}
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{formatTime(sessionTime)}</span>
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-1">
              <button className="p-1.5 hover:bg-gray-700 rounded transition-colors" title="Share Desktop">
                <Share className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-gray-700 rounded transition-colors" title="Upload File">
                <Upload className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-gray-700 rounded transition-colors" title="Download">
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 hover:bg-gray-700 rounded transition-colors" 
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button className="p-1.5 hover:bg-gray-700 rounded transition-colors" title="Settings">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative">
          {activeMenu === 'desktop' && (
            <div className="h-full">
              {!isConnected ? (
                <div className="h-full flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-lg font-semibold mb-2">Starting Desktop Session</h3>
                    <p className="text-gray-400 mb-4">Connecting to {session.osType}...</p>
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                </div>
              ) : (
                <div className="h-full bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <Monitor className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-semibold mb-2">Desktop Connected</h3>
                    <p className="text-gray-400 mb-4">VNC session active at {session.ipAddress}:{session.vncPort}</p>
                    <div className="bg-black rounded-lg p-4 min-h-[400px] min-w-[600px] border border-gray-600">
                      <div className="text-green-400 font-mono text-sm">
                        <div>root@kali:~# uname -a</div>
                        <div>Linux kali 5.15.0-kali3-amd64 #1 SMP Debian 5.15.15-2kali1 (2022-01-31) x86_64 GNU/Linux</div>
                        <div>root@kali:~# whoami</div>
                        <div>root</div>
                        <div>root@kali:~# <span className="animate-pulse">|</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMenu === 'terminal' && (
            <div className="h-full bg-black p-4">
              <div className="h-full bg-black rounded border border-gray-600 p-4 font-mono text-sm text-green-400">
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
            <div className="h-full bg-gray-900 p-4">
              <div className="bg-gray-800 rounded-lg border border-gray-700 h-full">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="font-semibold">File Browser</h3>
                  <p className="text-sm text-gray-400">/root</p>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <span>.bashrc</span>
                      <span className="text-xs text-gray-400 ml-auto">3.1 KB</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <span>.profile</span>
                      <span className="text-xs text-gray-400 ml-auto">161 B</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer">
                      <FileText className="w-5 h-5 text-yellow-400" />
                      <span>Desktop/</span>
                      <span className="text-xs text-gray-400 ml-auto">Folder</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer">
                      <FileText className="w-5 h-5 text-yellow-400" />
                      <span>Documents/</span>
                      <span className="text-xs text-gray-400 ml-auto">Folder</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer">
                      <FileText className="w-5 h-5 text-yellow-400" />
                      <span>Downloads/</span>
                      <span className="text-xs text-gray-400 ml-auto">Folder</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="h-8 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-4 text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Status: {isConnected ? 'Connected' : 'Connecting...'}</span>
            <span>Session: {session.id}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Wifi className="w-3 h-3" />
              <span>Connected</span>
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
