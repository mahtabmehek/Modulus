'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { 
  Monitor, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Download, 
  Upload, 
  Settings, 
  Play, 
  Square, 
  Volume2,
  Wifi,
  Battery,
  Clock,
  ArrowLeft
} from 'lucide-react'

export function DesktopView() {
  const { navigate, currentView } = useApp()
  const [isConnected, setIsConnected] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Mock desktop session data
  const session = {
    id: 'session-123',
    status: isConnected ? 'running' : 'starting',
    osType: 'Kali Linux',
    ipAddress: '10.0.1.15',
    vncPort: 5901,
    sshPort: 22,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
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

  const handleFileUpload = () => {
    // Simulate file upload
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Monitor className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Starting Virtual Desktop Environment
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Initializing your {session.osType} environment...
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Allocating resources</span>
                <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Starting container</span>
                <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Establishing connection</span>
                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>Session ID: {session.id}</p>
              <p>IP Address: {session.ipAddress}</p>
              <p>Expires: {session.expiresAt.toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('lab', { labId: currentView.params?.labId })}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Lab
            </button>
            
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Connected</span>
              </div>
              <span>•</span>
              <span>Session: {formatTime(sessionTime)}</span>
              <span>•</span>
              <span>{session.osType}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
              <Settings className="w-4 h-4" />
            </button>
            <button 
              className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Container */}
      <div className={`bg-black rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : 'relative'}`}>
        {/* Mock Desktop Interface */}
        <div className="relative w-full h-[600px] bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800">
          {/* Desktop Taskbar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm h-12 flex items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">K</span>
              </div>
              <button className="flex items-center space-x-1 bg-gray-800 px-3 py-1 rounded text-white text-xs">
                <Monitor className="w-3 h-3" />
                <span>Terminal</span>
              </button>
              <button className="flex items-center space-x-1 bg-gray-800 px-3 py-1 rounded text-white text-xs">
                <Play className="w-3 h-3" />
                <span>Firefox</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-3 text-white text-xs">
              <div className="flex items-center space-x-1">
                <Wifi className="w-3 h-3" />
                <span>WiFi</span>
              </div>
              <div className="flex items-center space-x-1">
                <Volume2 className="w-3 h-3" />
                <span>50%</span>
              </div>
              <div className="flex items-center space-x-1">
                <Battery className="w-3 h-3" />
                <span>85%</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Mock Terminal Window */}
          <div className="absolute top-8 left-8 w-96 h-64 bg-black bg-opacity-90 rounded border border-gray-600">
            <div className="bg-gray-800 px-3 py-1 flex items-center justify-between text-white text-xs">
              <span>Terminal</span>
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
            <div className="p-3 text-green-400 font-mono text-xs">
              <div>kali@modulus:~$ whoami</div>
              <div>kali</div>
              <div>kali@modulus:~$ nmap -sS 10.0.1.0/24</div>
              <div>Starting Nmap scan...</div>
              <div>Host is up (0.001s latency).</div>
              <div className="text-green-300">
                PORT    STATE SERVICE
              </div>
              <div>22/tcp  open  ssh</div>
              <div>80/tcp  open  http</div>
              <div>443/tcp open  https</div>
              <div>kali@modulus:~$ <span className="animate-pulse">▊</span></div>
            </div>
          </div>

          {/* Mock File Manager */}
          <div className="absolute top-8 right-8 w-80 h-48 bg-white bg-opacity-95 rounded border border-gray-300">
            <div className="bg-gray-100 px-3 py-2 flex items-center justify-between text-gray-800 text-xs border-b">
              <span>Files</span>
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
            <div className="p-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 py-1">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Desktop</span>
                </div>
                <div className="flex items-center space-x-2 py-1">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Documents</span>
                </div>
                <div className="flex items-center space-x-2 py-1">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span>Downloads</span>
                </div>
                <div className="flex items-center space-x-2 py-1">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span>lab-files</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Icons */}
          <div className="absolute top-4 left-4 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-1">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs">Burp Suite</span>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-1">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs">Wireshark</span>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-1">
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs">Metasploit</span>
            </div>
          </div>
        </div>
      </div>

      {/* File Transfer Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          File Transfer
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload to Desktop
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100 dark:file:bg-red-900 dark:file:text-red-300"
              />
              <button
                onClick={handleFileUpload}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Download from Desktop
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="/home/kali/file.txt"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              />
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
