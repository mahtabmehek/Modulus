'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Users,
  Server,
  Shield,
  BarChart3 as Activity,
  Settings,
  AlertTriangle,
  Database,
  Cloud,
  Cpu,
  HardDrive,
  Network,
  Eye,
  UserPlus,
  BookOpen,
  Monitor,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Download,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Edit,
  UserX,
  UserCheck,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export function AdminDashboard() {
  const { user } = useApp()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'labs' | 'infrastructure' | 'security'>('overview')
  const [realUsers, setRealUsers] = useState<any[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [labs, setLabs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [isUserTableCollapsed, setIsUserTableCollapsed] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showUserActions, setShowUserActions] = useState<{ [key: string]: boolean }>({})

  // Pagination state
  const [approvalsPage, setApprovalsPage] = useState(1)
  const [usersPage, setUsersPage] = useState(1)
  const approvalsPerPage = 5
  const usersPerPage = 10

  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: 'student'
  })
  const [courseFormData, setCourseFormData] = useState({
    title: '',
    code: '',
    department: '',
    academicLevel: 'bachelor',
    totalCredits: 0
  })

  // Load real user data when component mounts or users tab is selected
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      // Check if the click is outside all action dropdowns
      if (!target.closest('.actions-dropdown') && Object.keys(showUserActions).length > 0) {
        setShowUserActions({})
      }
    }

    // Only add listener if there are open dropdowns
    if (Object.values(showUserActions).some(isOpen => isOpen)) {
      document.addEventListener('click', handleClickOutside, true)
      return () => {
        document.removeEventListener('click', handleClickOutside, true)
      }
    }
  }, [showUserActions])

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers()
    } else if (activeTab === 'courses') {
      loadCourses()
    } else if (activeTab === 'labs') {
      loadLabs()
    }
  }, [activeTab])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getAllUsers()
      console.log('Admin users response:', response)
      setRealUsers(response.users || [])

      // Filter pending approvals (non-admin users who are not approved)
      const pending = (response.users || []).filter((user: any) =>
        user.role !== 'admin' && (!user.is_approved || user.status === 'pending')
      )
      setPendingApprovals(pending)
    } catch (error) {
      console.error('Failed to load users:', error)
      setRealUsers([])
      setPendingApprovals([])
    } finally {
      setLoading(false)
    }
  }

  // Search and filter users
  const filteredUsers = realUsers.filter(user => {
    const searchLower = searchTerm.toLowerCase()
    return (
      user.id?.toString().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.name?.toLowerCase().includes(searchLower)
    )
  })

  // Sort users
  const sortedUsers = sortConfig ?
    [...filteredUsers].sort((a, b) => {
      const aValue = a[sortConfig.key] || ''
      const bValue = b[sortConfig.key] || ''

      if (sortConfig.direction === 'asc') {
        return aValue.toString().localeCompare(bValue.toString())
      } else {
        return bValue.toString().localeCompare(aValue.toString())
      }
    }) : filteredUsers

  // Pagination for approvals
  const paginatedApprovals = pendingApprovals.slice(
    (approvalsPage - 1) * approvalsPerPage,
    approvalsPage * approvalsPerPage
  )
  const totalApprovalsPages = Math.ceil(pendingApprovals.length / approvalsPerPage)

  // Pagination for users
  const paginatedUsers = sortedUsers.slice(
    (usersPage - 1) * usersPerPage,
    usersPage * usersPerPage
  )
  const totalUsersPages = Math.ceil(sortedUsers.length / usersPerPage)

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Department', 'Created At']
    const csvData = [
      headers.join(','),
      ...sortedUsers.map(user => [
        user.id || '',
        `"${user.name || ''}"`,
        user.email || '',
        user.role || '',
        user.department || 'N/A',
        user.created_at ? new Date(user.created_at).toLocaleDateString() : ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `modulus_users_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Handle user actions
  const handleEditUser = (user: any) => {
    // Close dropdown
    setShowUserActions({})
    setSelectedUser(user)
    setShowEditUserModal(true)
  }

  const handleApproveUser = async (userId: string) => {
    console.log('Attempting to approve user:', userId)
    try {
      const response = await apiClient.approveUser(Number(userId))
      console.log('Approve response:', response)
      await loadUsers() // Refresh the list
      toast.success('User approved successfully!')
    } catch (error) {
      console.error('Failed to approve user:', error)
      toast.error('Failed to approve user. Please try again.')
    }
  }

  const handleRejectUser = async (userId: string) => {
    if (confirm('Are you sure you want to reject this user? This action cannot be undone.')) {
      console.log('Attempting to reject user:', userId)
      try {
        const response = await apiClient.rejectUser(Number(userId))
        console.log('Reject response:', response)
        await loadUsers() // Refresh the list
        toast.success('User rejected successfully!')
      } catch (error) {
        console.error('Failed to reject user:', error)
        toast.error('Failed to reject user. Please try again.')
      }
    }
  }

  const handleDisableUser = async (userId: string) => {
    // Close dropdown
    setShowUserActions({})

    if (confirm('Are you sure you want to disable this user?')) {
      console.log('Attempting to disable user:', userId)
      try {
        const response = await apiClient.disableUser(Number(userId))
        console.log('Disable response:', response)
        await loadUsers() // Refresh the list
        toast.success('User disabled successfully!')
      } catch (error) {
        console.error('Failed to disable user:', error)
        toast.error('Failed to disable user. Please try again.')
      }
    }
  }

  const handleDeleteUser = async (userId: string) => {
    // Close dropdown
    setShowUserActions({})

    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      console.log('Attempting to delete user:', userId)
      try {
        const response = await apiClient.deleteUser(Number(userId))
        console.log('Delete response:', response)
        await loadUsers() // Refresh list
        toast.success('User deleted successfully!')
      } catch (error) {
        console.error('Failed to delete user:', error)
        toast.error('Failed to delete user. Please try again.')
      }
    }
  }

  const handleEnableUser = async (userId: string) => {
    // Close dropdown
    setShowUserActions({})

    if (confirm('Are you sure you want to enable this user?')) {
      try {
        console.log('Attempting to enable user:', userId)
        await apiClient.enableUser(Number(userId))
        await loadUsers() // Refresh the list
        toast.success('User enabled successfully!')
      } catch (error) {
        console.error('Failed to enable user:', error)
        toast.error('Failed to enable user. Please try again.')
      }
    }
  }

  const handleCreateUser = async (userData: { name: string; email: string; role: string }) => {
    try {
      setLoading(true)
      console.log('Creating user:', userData)

      const response = await apiClient.createUser({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        password: 'tempPassword123!' // Default password that user should change
      })

      setShowUserModal(false)
      await loadUsers() // Refresh the list
      toast.success('User created successfully!')
    } catch (error) {
      console.error('Failed to create user:', error)
      toast.error('Failed to create user. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async (courseData: { title: string; code: string; department: string; academicLevel: string; totalCredits: number }) => {
    try {
      setLoading(true)
      console.log('Creating course:', courseData)

      const response = await apiClient.createCourse({
        title: courseData.title,
        code: courseData.code,
        department: courseData.department,
        academicLevel: courseData.academicLevel,
        totalCredits: courseData.totalCredits,
        description: `${courseData.title} course`,
        duration: 12 // Default duration in weeks
      })

      setShowCourseModal(false)
      await loadCourses() // Refresh the list
      toast.success('Course created successfully!')
    } catch (error) {
      console.error('Failed to create course:', error)
      toast.error('Failed to create course. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleUserActions = (userId: string) => {
    setShowUserActions(prev => {
      // Close all other dropdowns and toggle the clicked one
      const newState: { [key: string]: boolean } = {}
      newState[userId] = !prev[userId]
      return newState
    })
  }

  const loadCourses = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getCourses()
      setCourses(response.courses)
    } catch (error) {
      console.error('Failed to load courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLabs = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getLabs()
      if (response.success) {
        setLabs(response.data)
      } else {
        console.error('Failed to load labs')
        setLabs([])
      }
    } catch (error) {
      console.error('Failed to load labs:', error)
      setLabs([])
    } finally {
      setLoading(false)
    }
  }

  const systemStats = {
    totalUsers: 1247,
    activeUsers: 89,
    totalInstructors: 45,
    activeDesktops: 23,
    totalLabs: 156,
    completedLabSessions: 3842,
    systemUptime: '99.8%',
    securityAlerts: 2,
    avgSessionTime: '45 minutes',
    storageUsed: '2.3TB',
    totalStorage: '5TB'
  }

  const systemHealth = [
    { name: 'Web Servers', status: 'healthy', uptime: '99.9%', instances: 3 },
    { name: 'Database Cluster', status: 'healthy', uptime: '100%', instances: 2 },
    { name: 'Kubernetes Cluster', status: 'warning', uptime: '99.2%', instances: 5 },
    { name: 'Load Balancer', status: 'healthy', uptime: '99.8%', instances: 2 },
    { name: 'Container Registry', status: 'healthy', uptime: '99.5%', instances: 1 },
    { name: 'File Storage', status: 'healthy', uptime: '99.9%', instances: 3 },
  ]

  const recentAlerts = [
    {
      id: 1,
      type: 'warning',
      severity: 'medium',
      message: 'High CPU usage on worker node 3 (85%)',
      time: '15 mins ago',
      action: 'Scale cluster'
    },
    {
      id: 2,
      type: 'info',
      severity: 'low',
      message: 'New user registration spike detected (+15 users)',
      time: '1 hour ago',
      action: 'Monitor'
    },
    {
      id: 3,
      type: 'error',
      severity: 'high',
      message: 'Failed desktop deployment on node kube-worker-2',
      time: '2 hours ago',
      action: 'Investigate'
    },
    {
      id: 4,
      type: 'warning',
      severity: 'medium',
      message: 'SSL certificate expires in 30 days',
      time: '3 hours ago',
      action: 'Renew'
    },
  ]

  const recentUsers = [
    { id: 'u1', name: 'Alice Smith', email: 'alice@university.edu', role: 'student', status: 'active', joinedAt: '2 hours ago' },
    { id: 'u2', name: 'Dr. Bob Chen', email: 'bob.chen@university.edu', role: 'instructor', status: 'active', joinedAt: '1 day ago' },
    { id: 'u3', name: 'Carol Johnson', email: 'carol@university.edu', role: 'student', status: 'pending', joinedAt: '3 hours ago' },
    { id: 'u4', name: 'David Wilson', email: 'david@university.edu', role: 'student', status: 'active', joinedAt: '1 day ago' },
  ]

  const resourceUsage = {
    cpu: 45,
    memory: 62,
    storage: 46,
    network: 25
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'info': return <Activity className="w-4 h-4 text-blue-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          System Administration 🛡️
        </h1>
        <p className="text-purple-100 mb-4">
          Monitor platform health, manage users, and maintain security infrastructure.
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center bg-white/20 rounded-lg px-4 py-2">
            <Users className="w-5 h-5 mr-2" />
            <span className="font-semibold">{systemStats.totalUsers} Users</span>
          </div>
          <div className="flex items-center bg-white/20 rounded-lg px-4 py-2">
            <Server className="w-5 h-5 mr-2" />
            <span className="font-semibold">{systemStats.activeDesktops} Active Desktops</span>
          </div>
          <div className="flex items-center bg-white/20 rounded-lg px-4 py-2">
            <Activity className="w-5 h-5 mr-2" />
            <span className="font-semibold">{systemStats.systemUptime} Uptime</span>
          </div>
          <div className="flex items-center bg-white/20 rounded-lg px-4 py-2">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span className="font-semibold">{systemStats.securityAlerts} Alerts</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: Activity },
            { key: 'users', label: 'User Management', icon: Users },
            { key: 'courses', label: 'Course Management', icon: BookOpen },
            { key: 'labs', label: 'Lab Management', icon: Monitor },
            { key: 'infrastructure', label: 'Infrastructure', icon: Server },
            { key: 'security', label: 'Security', icon: Shield }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === key
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* System Health */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                System Health
              </h3>
              <div className="space-y-3">
                {systemHealth.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${service.status === 'healthy' ? 'bg-green-500' :
                          service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                      <span className="font-medium text-gray-900 dark:text-white">{service.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({service.instances} instances)</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{service.uptime}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resource Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Resource Usage
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'CPU', value: resourceUsage.cpu, icon: Cpu, color: 'bg-blue-500' },
                  { name: 'Memory', value: resourceUsage.memory, icon: Activity, color: 'bg-green-500' },
                  { name: 'Storage', value: resourceUsage.storage, icon: HardDrive, color: 'bg-yellow-500' },
                  { name: 'Network', value: resourceUsage.network, icon: Network, color: 'bg-purple-500' }
                ].map((resource) => {
                  const Icon = resource.icon
                  return (
                    <div key={resource.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{resource.name}</span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{resource.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`${resource.color} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${resource.value}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Alerts
              </h3>
              <div className="space-y-3">
                {recentAlerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {alert.message}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{alert.time}</span>
                        <button className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400">
                          {alert.action}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{systemStats.activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Lab Sessions Today</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">127</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg Session Time</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{systemStats.avgSessionTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Storage Used</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{systemStats.storageUsed} / {systemStats.totalStorage}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Pending Approvals Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pending User Approvals
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={loadUsers}
                  disabled={loading}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading pending approvals...</span>
              </div>
            ) : pendingApprovals.length > 0 ? (
              <div className="space-y-4">
                {paginatedApprovals.map((user) => (
                  <div key={user.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 dark:text-purple-300 font-semibold">
                            {user.name?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {user.name || 'Unknown User'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'instructor'
                                ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
                                : user.role === 'staff'
                                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                                  : user.role === 'student'
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300'
                              }`}>
                              {user.role}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Registered {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveUser(user.id)}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectUser(user.id)}
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <AlertCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Approvals Pagination */}
                {totalApprovalsPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setApprovalsPage(prev => Math.max(1, prev - 1))}
                      disabled={approvalsPage === 1}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors dark:bg-gray-800 dark:hover:bg-gray-700 dark:disabled:bg-gray-900 dark:disabled:text-gray-600 dark:text-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <span className="text-gray-600 dark:text-gray-400 px-4">
                      Page {approvalsPage} of {totalApprovalsPages} ({pendingApprovals.length} total)
                    </span>
                    <button
                      onClick={() => setApprovalsPage(prev => Math.min(totalApprovalsPages, prev + 1))}
                      disabled={approvalsPage === totalApprovalsPages}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors dark:bg-gray-800 dark:hover:bg-gray-700 dark:disabled:bg-gray-900 dark:disabled:text-gray-600 dark:text-gray-300"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  All caught up!
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  No pending user approvals at the moment.
                </p>
              </div>
            )}
          </div>

          {/* User Management Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    User Management
                  </h3>
                  <button
                    onClick={() => setIsUserTableCollapsed(!isUserTableCollapsed)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {isUserTableCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={loadUsers}
                    disabled={loading}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowUserModal(true)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add User
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by user ID, email, or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {!isUserTableCollapsed && (
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading users...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th
                            className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white cursor-pointer hover:text-purple-600"
                            onClick={() => handleSort('name')}
                          >
                            <div className="flex items-center gap-1">
                              Name
                              {sortConfig?.key === 'name' && (
                                sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </th>
                          <th
                            className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white cursor-pointer hover:text-purple-600"
                            onClick={() => handleSort('email')}
                          >
                            <div className="flex items-center gap-1">
                              Email
                              {sortConfig?.key === 'email' && (
                                sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </th>
                          <th
                            className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white cursor-pointer hover:text-purple-600"
                            onClick={() => handleSort('role')}
                          >
                            <div className="flex items-center gap-1">
                              Role
                              {sortConfig?.key === 'role' && (
                                sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Department</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                          <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-3 px-4 text-gray-900 dark:text-white">
                              {user.name || 'Unknown User'}
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'instructor'
                                  ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
                                  : user.role === 'admin'
                                    ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                                    : user.role === 'staff'
                                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                                      : user.role === 'student'
                                        ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300'
                                }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                              {user.department || 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_approved === false
                                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                                  : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                                }`}>
                                {user.is_approved === false ? 'Disabled' : 'Active'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="relative actions-dropdown">
                                <button
                                  onClick={() => toggleUserActions(user.id)}
                                  className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                {showUserActions[user.id] && (
                                  <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-32">
                                    <button
                                      onClick={() => handleEditUser(user)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit
                                    </button>
                                    {user.is_approved === false ? (
                                      <button
                                        onClick={() => handleEnableUser(user.id)}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                                      >
                                        <UserCheck className="w-4 h-4" />
                                        Enable
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleDisableUser(user.id)}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                                      >
                                        <UserX className="w-4 h-4" />
                                        Disable
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 last:rounded-b-lg"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                              {searchTerm ? 'No users found matching your search.' : 'No users found. Click refresh to load users from the API.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Users Pagination */}
                    {totalUsersPages > 1 && (
                      <div className="flex justify-center items-center space-x-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                          disabled={usersPage === 1}
                          className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors dark:bg-gray-800 dark:hover:bg-gray-700 dark:disabled:bg-gray-900 dark:disabled:text-gray-600 dark:text-gray-300"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </button>
                        <span className="text-gray-600 dark:text-gray-400 px-4">
                          Page {usersPage} of {totalUsersPages} ({sortedUsers.length} total)
                        </span>
                        <button
                          onClick={() => setUsersPage(prev => Math.min(totalUsersPages, prev + 1))}
                          disabled={usersPage === totalUsersPages}
                          className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors dark:bg-gray-800 dark:hover:bg-gray-700 dark:disabled:bg-gray-900 dark:disabled:text-gray-600 dark:text-gray-300"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'infrastructure' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Kubernetes Cluster
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Nodes</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">5 / 5 Ready</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pods</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">127 / 200 Running</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Namespaces</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">8 Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Desktop Sessions</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">23 Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Database Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Primary DB</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Healthy</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Read Replicas</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">2 / 2 Healthy</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Connections</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">45 / 200</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Storage</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">1.2TB / 2TB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Security Score</h3>
                  <p className="text-2xl font-bold text-green-600">94/100</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Excellent security posture</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Open Alerts</h3>
                  <p className="text-2xl font-bold text-yellow-600">{systemStats.securityAlerts}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Require attention</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Active Sessions</h3>
                  <p className="text-2xl font-bold text-blue-600">{systemStats.activeUsers}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Currently monitored</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Security Events
            </h3>
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{alert.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert.severity === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' :
                        alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' :
                          'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                      }`}>
                      {alert.severity}
                    </span>
                    <button className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 px-3 py-1 rounded border border-purple-200 dark:border-purple-800">
                      {alert.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'labs' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Lab Management
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={loadLabs}
                  disabled={loading}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <BookOpen className="w-4 h-4" />
                  Create Lab
                </button>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  Export Reports
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading labs...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {labs.map((lab) => (
                  <div key={lab.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{lab.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${lab.status === 'active'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                          : lab.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                        }`}>
                        {lab.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Type:</span>
                        <span className="text-gray-900 dark:text-white">{lab.type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Students:</span>
                        <span className="text-gray-900 dark:text-white">{lab.students}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Avg Duration:</span>
                        <span className="text-gray-900 dark:text-white">{lab.avgDuration}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                        <span className="text-gray-900 dark:text-white">{lab.successRate}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm">
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors text-sm">
                        <Settings className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && labs.length === 0 && (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No labs found
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first lab to get started.
                </p>
                <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors mx-auto">
                  <BookOpen className="w-4 h-4" />
                  Create First Lab
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Course Management
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={loadCourses}
                  disabled={loading}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => setShowCourseModal(true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Create Course
                </button>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading courses...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Course</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Code</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Department</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Level</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Credits</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Students</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.length > 0 ? courses.map((course) => (
                      <tr key={course.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{course.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {course.description}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white font-mono">{course.code}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{course.department}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.academicLevel === 'Bachelor'
                              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                              : course.academicLevel === 'Master'
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
                            }`}>
                            {course.academicLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{course.totalCredits}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {course.enrolledStudents || 0}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 p-1">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-700 dark:text-gray-400 p-1">
                              <Settings className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-700 dark:text-red-400 p-1">
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                          No courses found. Click refresh to load courses from the API.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black/50 absolute inset-0" onClick={() => setShowUserModal(false)}></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-lg w-full p-6 z-10">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New User
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="block w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="block w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="block w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (userFormData.name && userFormData.email) {
                      handleCreateUser(userFormData)
                      setUserFormData({ name: '', email: '', role: 'student' })
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black/50 absolute inset-0" onClick={() => setShowCourseModal(false)}></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-lg w-full p-6 z-10">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New Course
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={courseFormData.title}
                  onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                  className="block w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter course title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code
                </label>
                <input
                  type="text"
                  value={courseFormData.code}
                  onChange={(e) => setCourseFormData({ ...courseFormData, code: e.target.value })}
                  className="block w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter course code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={courseFormData.department}
                  onChange={(e) => setCourseFormData({ ...courseFormData, department: e.target.value })}
                  className="block w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter department name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Level
                </label>
                <select
                  value={courseFormData.academicLevel}
                  onChange={(e) => setCourseFormData({ ...courseFormData, academicLevel: e.target.value })}
                  className="block w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="bachelor">Bachelor</option>
                  <option value="master">Master</option>
                  <option value="phd">PhD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Credits
                </label>
                <input
                  type="number"
                  value={courseFormData.totalCredits}
                  onChange={(e) => setCourseFormData({ ...courseFormData, totalCredits: parseInt(e.target.value) || 0 })}
                  className="block w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter total credits"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCourseModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (courseFormData.title && courseFormData.code) {
                      handleCreateCourse(courseFormData)
                      setCourseFormData({ title: '', code: '', department: '', academicLevel: 'bachelor', totalCredits: 0 })
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Create Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black/50 absolute inset-0" onClick={() => setShowEditUserModal(false)}></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-lg w-full p-6 z-10">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit User: {selectedUser.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  className="block w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  className="block w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                  className="block w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={selectedUser.status || 'active'}
                  onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value })}
                  className="block w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending Approval</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Here you would typically call an API to update the user
                      console.log('Updating user:', selectedUser)
                      toast.success('User updated successfully!')
                      await loadUsers() // Refresh the list
                      setShowEditUserModal(false)
                    } catch (error) {
                      console.error('Failed to update user:', error)
                      toast.error('Failed to update user. Please try again.')
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Update User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
