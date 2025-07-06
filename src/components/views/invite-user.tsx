'use client'

import { useState } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { Plus, Copy, Trash2, Send, Mail, Users, Check, X, ArrowLeft } from 'lucide-react'
import { UserRole } from '@/types'

interface NewInvite {
  email: string
  role: UserRole
  name: string
  message: string
}

export function InviteUserView() {
  const { user: currentUser, navigate } = useApp()
  
  // All hooks must be called at the top level
  const [activeTab, setActiveTab] = useState<'create' | 'pending' | 'used'>('create')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newInvite, setNewInvite] = useState<NewInvite>({
    email: '',
    role: 'student',
    name: '',
    message: ''
  })
  const [pendingInvites] = useState([
    {
      id: 'inv-001',
      email: 'john.student@university.edu',
      name: 'John Smith',
      role: 'student' as const,
      invitedBy: 'Admin',
      sentAt: new Date('2024-01-15'),
      expiresAt: new Date('2024-02-15'),
      status: 'pending' as const
    }
  ])
  const [usedInvites] = useState([
    {
      id: 'inv-002',
      email: 'sarah.instructor@university.edu',
      name: 'Sarah Johnson',
      role: 'instructor' as const,
      invitedBy: 'Admin',
      sentAt: new Date('2024-01-10'),
      usedAt: new Date('2024-01-12'),
      status: 'used' as const
    }
  ])
  
  // Check if user has permission to manage invites (after hooks)
  if (!currentUser || !['admin', 'staff'].includes(currentUser.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don&apos;t have permission to manage invites.</p>
          <button
            onClick={() => navigate('dashboard')}
            className="text-red-600 hover:text-red-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Mock data for existing invites
  const mockInvites = [
    {
      id: 'inv-001',
      email: 'john.student@university.edu',
      name: 'John Smith',
      role: 'student' as UserRole,
      code: 'STU-ABC123',
      createdAt: new Date('2025-07-01'),
      expiresAt: new Date('2025-07-15'),
      isUsed: false
    },
    {
      id: 'inv-002',
      email: 'jane.instructor@university.edu',
      name: 'Jane Doe',
      role: 'instructor' as UserRole,
      code: 'INS-XYZ789',
      createdAt: new Date('2025-07-03'),
      expiresAt: new Date('2025-07-17'),
      isUsed: false
    }
  ]

  const [usedInvites] = useState([
    {
      id: 'inv-003',
      email: 'used.student@university.edu',
      name: 'Alice Johnson',
      role: 'student' as UserRole,
      code: 'STU-DEF456',
      createdAt: new Date('2025-06-20'),
      usedAt: new Date('2025-06-22'),
      isUsed: true
    }
  ])

  const handleCreateInvite = () => {
    if (!newInvite.email || !newInvite.name) return

    const inviteCode = `${newInvite.role.toUpperCase().substring(0, 3)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    
    console.log('Creating invite:', {
      ...newInvite,
      code: inviteCode,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    })

    // Reset form
    setNewInvite({
      email: '',
      role: 'student',
      name: '',
      message: ''
    })
    setShowCreateForm(false)
  }

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/invite/${code}`
    navigator.clipboard.writeText(link)
    // You could show a toast notification here
  }

  const availableRoles = () => {
    if (currentUser?.role === 'admin') {
      return [
        { value: 'student', label: 'Student' },
        { value: 'instructor', label: 'Instructor' },
        { value: 'staff', label: 'Staff' },
        { value: 'admin', label: 'Administrator' }
      ]
    }
    if (currentUser?.role === 'staff') {
      return [
        { value: 'student', label: 'Student' },
        { value: 'instructor', label: 'Instructor' }
      ]
    }
    return []
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('dashboard')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Invite Management</h1>
              <p className="text-muted-foreground">Create and manage user invitations</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('user-creation')}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Create User Directly</span>
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Send Invite</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Invites</p>
                <p className="text-2xl font-bold text-foreground">{pendingInvites.length}</p>
              </div>
              <Mail className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Used Invites</p>
                <p className="text-2xl font-bold text-foreground">{usedInvites.length}</p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold text-foreground">{pendingInvites.length + usedInvites.length}</p>
              </div>
              <Send className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-lg border border-border">
          <div className="border-b border-border">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('create')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'create'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Create Invite
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'pending'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Pending ({pendingInvites.length})
              </button>
              <button
                onClick={() => setActiveTab('used')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'used'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Used ({usedInvites.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Create Invite Tab */}
            {activeTab === 'create' && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Send User Invitations</h3>
                  <p className="text-muted-foreground mb-6">
                    Invite new users to join the platform with their designated roles
                  </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Create New Invite
                  </button>
                </div>
              </div>
            )}

            {/* Pending Invites Tab */}
            {activeTab === 'pending' && (
              <div className="space-y-4">
                {pendingInvites.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending invites</p>
                  </div>
                ) : (
                  pendingInvites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-foreground">{invite.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            invite.role === 'instructor' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                            invite.role === 'staff' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {invite.role}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{invite.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Expires: {invite.expiresAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyInviteLink(invite.code)}
                          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy invite link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-500 hover:text-red-700 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Used Invites Tab */}
            {activeTab === 'used' && (
              <div className="space-y-4">
                {usedInvites.length === 0 ? (
                  <div className="text-center py-8">
                    <Check className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No used invites</p>
                  </div>
                ) : (
                  usedInvites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-4 bg-muted rounded-lg opacity-75">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-foreground">{invite.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            invite.role === 'instructor' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {invite.role}
                          </span>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                            Used
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{invite.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Used: {invite.usedAt?.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create Invite Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Create Invite</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleCreateInvite(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={newInvite.name}
                    onChange={(e) => setNewInvite(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 text-foreground"
                    placeholder="Full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={newInvite.email}
                    onChange={(e) => setNewInvite(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 text-foreground"
                    placeholder="email@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                  <select
                    value={newInvite.role}
                    onChange={(e) => setNewInvite(prev => ({ ...prev, role: e.target.value as UserRole }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 text-foreground"
                  >
                    {availableRoles().map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Message (Optional)</label>
                  <textarea
                    rows={3}
                    value={newInvite.message}
                    onChange={(e) => setNewInvite(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 text-foreground resize-none"
                    placeholder="Add a personal message..."
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
