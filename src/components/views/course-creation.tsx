'use client'

import { useState } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { ArrowLeft, Save } from 'lucide-react'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

export function CourseCreationView() {
  const { navigate } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    level: 'Bachelor' as 'Bachelor' | 'Master' | 'Doctorate',
    duration: 3,
    totalCredits: 360,
    department: '',
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Transform formData to match API expectations
      const courseData = {
        title: formData.title,
        code: formData.code,
        description: formData.description,
        department: formData.department,
        academicLevel: formData.level, // Transform level to academicLevel
        duration: formData.duration,
        totalCredits: formData.totalCredits
      }
      
      console.log('Creating course:', courseData)
      const response = await apiClient.createCourse(courseData)
      console.log('Course created successfully:', response)
      toast.success('Course created successfully!')
      navigate('dashboard')
    } catch (error) {
      console.error('Failed to create course:', error)
      setError(error instanceof Error ? error.message : 'Failed to create course')
    } finally {
      setLoading(false)
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
              <h1 className="text-3xl font-bold text-foreground">Create New Course</h1>
              <p className="text-muted-foreground">Add a new academic program to the system</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Creating...' : 'Create Course'}</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-lg p-8 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Course Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Bachelor of Science in Computer Science"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
              />
            </div>

            {/* Course Code */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Course Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                placeholder="e.g., BSC-CS"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
              />
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Academic Level *
              </label>
              <select
                value={formData.level}
                onChange={(e) => handleInputChange('level', e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
              >
                <option value="Bachelor">Bachelor&apos;s Degree</option>
                <option value="Master">Master&apos;s Degree</option>
                <option value="Doctorate">Doctorate</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Duration (Years) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="10"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
              />
            </div>

            {/* Total Credits */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Total Credits *
              </label>
              <input
                type="number"
                required
                min="60"
                max="1000"
                value={formData.totalCredits}
                onChange={(e) => handleInputChange('totalCredits', parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
              />
            </div>

            {/* Department */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Department *
              </label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="e.g., School of Computing"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Course Description *
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide a comprehensive description of the course program, its objectives, and what students will learn..."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-foreground resize-none"
              />
            </div>
          </div>

          {/* Course Structure Guidelines */}
          <div className="mt-8 p-6 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-4">Course Structure Guidelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-foreground mb-2">Bachelor&apos;s Degree:</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Typical duration: 3-4 years</li>
                  <li>Total credits: 300-480</li>
                  <li>Foundation and advanced modules</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Master&apos;s Degree:</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Typical duration: 1-2 years</li>
                  <li>Total credits: 120-240</li>
                  <li>Specialized and research modules</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mt-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => navigate('dashboard')}
              disabled={loading}
              className="px-6 py-3 border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Create Course'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
