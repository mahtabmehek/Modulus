'use client'

import { useState } from 'react'
import { useApp } from '@/lib/hooks/use-app'
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
  Download
} from 'lucide-react'

export function AdminDashboard() {
  const { user } = useApp()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'infrastructure' | 'security'>('overview')

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
            { key: 'infrastructure', label: 'Infrastructure', icon: Server },
            { key: 'security', label: 'Security', icon: Shield }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === key
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
                      <div className={`w-3 h-3 rounded-full ${
                        service.status === 'healthy' ? 'bg-green-500' :
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                User Management
              </h3>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <UserPlus className="w-4 h-4" />
                  Add User
                </button>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Joined</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{user.name}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'instructor' 
                            ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.joinedAt}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-700 dark:text-gray-400">
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      alert.severity === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' :
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
    </div>
  )
}
