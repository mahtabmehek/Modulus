'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { ArrowLeft, Save, User, Mail, Shield, Settings, Calendar, Award, Camera, Eye, EyeOff, Lock } from 'lucide-react'
import { User as UserType, UserRole } from '@/types'
import { getUserPermissions, canEditUserData } from '@/lib/permissions'
import toast from 'react-hot-toast'

export function ProfileView() {
  const { user: currentUser, navigate } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    department: '',
    preferences: {
      theme: 'system' as 'light' | 'dark' | 'system',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        announcements: true,
        labUpdates: true
      }
    }
  })

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        studentId: currentUser.id?.toString() || '',
        department: currentUser.role === 'student' ? 'Computer Science' : 'Faculty',
        preferences: currentUser.preferences || {
          theme: 'system' as 'light' | 'dark' | 'system',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            announcements: true,
            labUpdates: true
          }
        }
      })
    }
  }, [currentUser])

  // Safety check for user data
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg mb-4">Please log in to view your profile</p>
          <button 
            onClick={() => navigate('login')}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Only show current user's profile for now
  const profileUser = currentUser
  const isOwnProfile = true // Since we only show current user's profile

  if (!currentUser || !profileUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">User not found</h2>
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

  // Show error if user not found
  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">User not found</h1>
          <button
            onClick={() => navigate('dashboard')}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const permissions = getUserPermissions(currentUser?.role)
  const canEdit = isOwnProfile ? permissions?.canEditOwnProfile : canEditUserData(currentUser?.role, profileUser?.role)
  const canResetPassword = isOwnProfile ? permissions?.canResetOwnPassword : canEditUserData(currentUser?.role, profileUser?.role)

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleSave = () => {
    // Here you would typically make an API call to save the changes
    console.log('Saving profile changes:', formData)
    setIsEditing(false)
    // Show success message
  }

  const handlePasswordReset = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    // Here you would typically make an API call to change the password
    console.log('Changing password for user:', profileUser.id)
    setShowPasswordForm(false)
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    // Show success message
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date))
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'instructor': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'student': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return '👑'
      case 'staff': return '🏢'
      case 'instructor': return '👨‍🏫'
      case 'student': return '🎓'
      default: return '👤'
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-6">
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
              <h1 className="text-3xl font-bold text-foreground">
                {isOwnProfile ? 'My Profile' : `${profileUser.name || 'Unknown User'}'s Profile`}
              </h1>
              <p className="text-muted-foreground">
                {isOwnProfile ? 'Manage your account settings' : 'View user information'}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            {canResetPassword && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>Reset Password</span>
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-6 text-center">
              <div className="relative mb-4">
                <div className="w-24 h-24 mx-auto bg-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profileUser.name ? profileUser.name.split(' ').map(n => n[0]).join('') : '?'}
                </div>
                {canEdit && isEditing && (
                  <button className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{profileUser.name || 'Unknown User'}</h2>
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(profileUser.role)}`}>
                <span>{getRoleIcon(profileUser.role)}</span>
                <span className="capitalize">{profileUser.role}</span>
              </div>
              <p className="text-muted-foreground mt-2">User ID: {profileUser.id}</p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{profileUser.level || 1}</div>
                  <div className="text-sm text-muted-foreground">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{profileUser.badges?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Badges</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{profileUser.streakDays || 0}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{(profileUser.totalPoints || 0).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Points</div>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-card rounded-lg border border-border p-6 mt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="text-foreground">{formatDate(profileUser.joinedAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Active</span>
                  <span className="text-foreground">{formatDate(profileUser.lastActive)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Level Name</span>
                  <span className="text-foreground">{profileUser.levelName || 'Beginner'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                {!canEdit && (
                  <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                    <Eye className="w-4 h-4" />
                    <span>Read Only</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name
                  </label>
                  {isEditing && canEdit ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground">
                      {profileUser.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  {isEditing && canEdit ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground">
                      {profileUser.email}
                    </div>
                  )}
                </div>

                {profileUser.studentId && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Student ID
                    </label>
                    {isEditing && canEdit ? (
                      <input
                        type="text"
                        value={formData.studentId}
                        onChange={(e) => handleInputChange('studentId', e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
                      />
                    ) : (
                      <div className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground">
                        {profileUser.studentId}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Role
                  </label>
                  <div className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground capitalize">
                    {profileUser.role}
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences (only for own profile) */}
            {isOwnProfile && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6">Preferences</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Theme
                    </label>
                    <select
                      value={formData.preferences.theme}
                      onChange={(e) => handleInputChange('preferences.theme', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground disabled:bg-muted"
                    >
                      <option value="system">System</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-4">
                      Notifications
                    </label>
                    <div className="space-y-3">
                      {Object.entries(formData.preferences.notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => handleInputChange(`preferences.notifications.${key}`, e.target.checked)}
                              disabled={!isEditing}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Badges & Achievements</h3>
              {profileUser.badges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {profileUser.badges.map((badge, index) => (
                    <div key={index} className="bg-muted rounded-lg p-4 text-center">
                      <div className="text-2xl mb-2">🏆</div>
                      <div className="text-sm font-medium text-foreground">{badge}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No badges earned yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Password Reset Modal */}
        {showPasswordForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  {isOwnProfile ? 'Change Password' : `Reset Password for ${profileUser.name}`}
                </h3>
                <button
                  onClick={() => setShowPasswordForm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                {isOwnProfile && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowPasswordForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordReset}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
