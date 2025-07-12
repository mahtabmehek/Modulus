'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { ArrowLeft, Save, User, Mail, Shield } from 'lucide-react'
import { UserRole } from '@/types'

export function UserCreationView() {
  const { navigate, user: currentUser } = useApp()
  
  // All hooks must be called at the top level
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userId: '', // Will be auto-generated based on role
    role: 'student' as UserRole,
    department: '',
    joinedAt: new Date().toISOString().split('T')[0],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Initialize User ID when component loads
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      userId: generateUserId(prev.role)
    }))
  }, [])
  // Check if user has permission to create users (after hooks)
  if (!currentUser || !['admin', 'staff'].includes(currentUser.role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don&apos;t have permission to create users.</p>
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // User ID is auto-generated, no validation needed

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      // Call the API to create the user
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        joinedAt: formData.joinedAt
      }

      console.log('Creating user:', userData)
      
      // Here you would make the actual API call
      // const response = await api.createUser(userData)
      
      // For now, just show success and navigate
      alert('User created successfully!')
      navigate('dashboard')
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Failed to create user. Please try again.')
    }
  }

  // Generate User ID based on role selection
  const generateUserId = (role: UserRole) => {
    let prefix = ''
    switch (role) {
      case 'admin': prefix = '1-99'; break
      case 'staff': prefix = '100-499'; break
      case 'instructor': prefix = '500-999'; break
      case 'student': prefix = '1000-4999'; break
    }
    return `Auto-generated (${prefix})`
  }
  // Check if current user can create users of this role
  const canCreateRole = (role: UserRole) => {
    if (currentUser?.role === 'admin') return true
    if (currentUser?.role === 'staff') {
      return role === 'student' || role === 'instructor'
    }
    return false
  }

  // Update User ID when role changes
  const handleRoleChange = (newRole: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      userId: generateUserId(newRole)
    }))
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
              <h1 className="text-3xl font-bold text-foreground">Create New User</h1>
              <p className="text-muted-foreground">Add a new user account to the system</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            <span>Create User</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-lg p-8 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., John Smith"
                  className={`w-full pl-10 pr-4 py-3 bg-background border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground ${
                    errors.name ? 'border-red-500' : 'border-border'
                  }`}
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="e.g., john.smith@university.edu"
                  className={`w-full pl-10 pr-4 py-3 bg-background border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground ${
                    errors.email ? 'border-red-500' : 'border-border'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                User Role *
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
                >
                  {availableRoles().map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* User ID (Auto-generated) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                User ID *
              </label>
              <input
                type="text"
                value={formData.userId || generateUserId(formData.role)}
                readOnly
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed"
                placeholder="Will be auto-generated based on role"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                ID will be automatically assigned from the {formData.role} range
              </p>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="e.g., School of Computing"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
              />
            </div>

            {/* Join Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Join Date
              </label>
              <input
                type="date"
                value={formData.joinedAt}
                onChange={(e) => handleInputChange('joinedAt', e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
              />
            </div>
          </div>

          {/* Account Setup Information */}
          <div className="mt-8 p-6 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-4">Account Setup Information</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• User ID will be automatically assigned from role-based range:</p>
              <p className="ml-4">- Admin: 1-99 | Staff: 100-499 | Instructor: 500-999 | Student: 1000-4999</p>
              <p>• The user will receive an email with login instructions</p>
              <p>• A temporary password will be generated and sent securely</p>
              <p>• The user must change their password on first login</p>
              <p>• Account will be automatically approved based on role permissions</p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => navigate('dashboard')}
              className="px-6 py-3 border border-border text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              <span>Create User</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
