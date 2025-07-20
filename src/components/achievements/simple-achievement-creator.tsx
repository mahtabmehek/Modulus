'use client'

import { useState, useEffect } from 'react'
import { X, Trophy, Save } from 'lucide-react'
import { achievementsAPI } from '@/lib/api/achievements'
import toast from 'react-hot-toast'

interface Lab {
  id: number
  title: string
  description?: string
  module_title?: string
}

interface SimpleAchievementCreatorProps {
  isOpen: boolean
  onClose: () => void
  onAchievementCreated: () => void
}

export function SimpleAchievementCreator({ isOpen, onClose, onAchievementCreated }: SimpleAchievementCreatorProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🏆',
    selectedLabs: [] as number[]
  })

  const [labs, setLabs] = useState<Lab[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [labsLoading, setLabsLoading] = useState(true)

  const commonIcons = ['🏆', '🎖️', '🥇', '🥈', '🥉', '🎯', '⭐', '🌟', '💎', '👑', '🎊', '🎉', '🔥', '⚡', '🚀', '💪']

  useEffect(() => {
    if (isOpen) {
      loadLabs()
    }
  }, [isOpen])

  const loadLabs = async () => {
    try {
      setLabsLoading(true)
      const token = localStorage.getItem('modulus_token')
      const response = await fetch('http://localhost:3001/api/labs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setLabs(data.data || [])
      }
    } catch (error) {
      console.error('Error loading labs:', error)
      toast.error('Failed to load labs')
    } finally {
      setLabsLoading(false)
    }
  }

  const handleLabToggle = (labId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedLabs: prev.selectedLabs.includes(labId)
        ? prev.selectedLabs.filter(id => id !== labId)
        : [...prev.selectedLabs, labId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.selectedLabs.length === 0) {
      toast.error('Please select at least one lab')
      return
    }

    setIsSubmitting(true)

    try {
      // Generate achievement key from name
      const achievementKey = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

      // Create description based on selected labs
      const selectedLabNames = labs
        .filter(lab => formData.selectedLabs.includes(lab.id))
        .map(lab => lab.title)

      const description = formData.description ||
        `Complete ${selectedLabNames.length === 1 ? 'the lab' : 'all labs'}: ${selectedLabNames.join(', ')}`

      const achievementData = {
        achievement_key: achievementKey,
        name: formData.name,
        description: description,
        icon: formData.icon,
        category: 'progress',
        rarity: (formData.selectedLabs.length === 1 ? 'common' :
          formData.selectedLabs.length <= 3 ? 'uncommon' : 'rare') as 'common' | 'uncommon' | 'rare',
        points: 50,
        criteria: {
          type: 'labs_completed' as const,
          value: formData.selectedLabs.length,
          labs: formData.selectedLabs
        },
        is_active: true,
        is_hidden: false,
        unlock_order: 0
      }

      const response = await achievementsAPI.createAchievement(achievementData)

      if (response.success) {
        toast.success('Achievement created successfully!')
        onAchievementCreated()
        handleClose()
      } else {
        throw new Error('Failed to create achievement')
      }
    } catch (error) {
      console.error('Error creating achievement:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create achievement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      icon: '🏆',
      selectedLabs: []
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Create Lab Achievement
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Achievement Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Achievement Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Cybersecurity Expert"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Auto-generated based on selected labs"
              rows={2}
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Badge Icon
            </label>
            <div className="grid grid-cols-8 gap-2">
              {commonIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`
                    w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition-colors
                    ${formData.icon === icon
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }
                  `}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Lab Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Labs to Complete *
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto">
              {labsLoading ? (
                <div className="p-4 text-center text-gray-500">Loading labs...</div>
              ) : labs.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No labs available</div>
              ) : (
                labs.map((lab) => (
                  <label
                    key={lab.id}
                    className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedLabs.includes(lab.id)}
                      onChange={() => handleLabToggle(lab.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{lab.title}</div>
                      {lab.module_title && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{lab.module_title}</div>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Selected: {formData.selectedLabs.length} lab(s)
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || formData.selectedLabs.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Achievement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
