'use client'

import { useState } from 'react'
import { X, Trophy, Save, Plus } from 'lucide-react'
import { achievementsAPI, Achievement, AchievementCriteria } from '@/lib/api/achievements'
import toast from 'react-hot-toast'

interface AchievementCreatorProps {
  isOpen: boolean
  onClose: () => void
  onAchievementCreated: (achievement: Achievement) => void
}

export function AchievementCreator({ isOpen, onClose, onAchievementCreated }: AchievementCreatorProps) {
  const [formData, setFormData] = useState({
    achievement_key: '',
    name: '',
    description: '',
    icon: '🏆',
    category: 'progress',
    rarity: 'common' as Achievement['rarity'],
    points: 10,
    criteria: {
      type: 'labs_completed' as AchievementCriteria['type'],
      value: 1
    },
    is_active: true,
    is_hidden: false,
    unlock_order: 0
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = [
    { value: 'welcome', label: 'Welcome', icon: '👋' },
    { value: 'progress', label: 'Progress', icon: '📈' },
    { value: 'mastery', label: 'Mastery', icon: '🏆' },
    { value: 'consistency', label: 'Consistency', icon: '🔥' },
    { value: 'exploration', label: 'Exploration', icon: '🔍' },
    { value: 'perfection', label: 'Perfection', icon: '💎' },
    { value: 'special', label: 'Special', icon: '⭐' },
    { value: 'skill', label: 'Skills', icon: '🎯' },
    { value: 'speed', label: 'Speed', icon: '⚡' },
    { value: 'streak', label: 'Streak', icon: '🔥' }
  ]

  const rarities = [
    { value: 'common', label: 'Common', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    { value: 'uncommon', label: 'Uncommon', color: 'text-green-600', bgColor: 'bg-green-100' },
    { value: 'rare', label: 'Rare', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { value: 'epic', label: 'Epic', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { value: 'legendary', label: 'Legendary', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
  ]

  const criteriaTypes = [
    { value: 'labs_completed', label: 'Labs Completed' },
    { value: 'modules_completed', label: 'Modules Completed' },
    { value: 'courses_completed', label: 'Courses Completed' },
    { value: 'correct_answers', label: 'Correct Answers' },
    { value: 'streak_days', label: 'Streak Days' },
    { value: 'perfect_labs', label: 'Perfect Labs' },
    { value: 'login_count', label: 'Login Count' },
    { value: 'speed_completions', label: 'Speed Completions' },
    { value: 'category_completion', label: 'Category Completion' }
  ]

  const commonIcons = ['🏆', '🎯', '⭐', '💎', '🔥', '⚡', '📈', '🎉', '👑', '🌟', '💪', '🚀', '🎊', '🏅', '🥇']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Generate achievement key from name if not provided
      const achievementKey = formData.achievement_key || 
        formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

      const achievementData = {
        ...formData,
        achievement_key: achievementKey,
        criteria: formData.criteria
      }

      const response = await achievementsAPI.createAchievement(achievementData)
      
      if (response.success) {
        toast.success('Achievement created successfully!')
        onAchievementCreated(response.data.achievement)
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
      achievement_key: '',
      name: '',
      description: '',
      icon: '🏆',
      category: 'progress',
      rarity: 'common',
      points: 10,
      criteria: {
        type: 'labs_completed' as AchievementCriteria['type'],
        value: 1
      },
      is_active: true,
      is_hidden: false,
      unlock_order: 0
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Create Achievement
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Achievement Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., First Lab Complete"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Achievement Key (auto-generated)
              </label>
              <input
                type="text"
                value={formData.achievement_key}
                onChange={(e) => setFormData({ ...formData, achievement_key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., first_lab_complete"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Describe what the student needs to do to earn this achievement"
              rows={3}
              required
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
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
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-center"
                placeholder="🏆"
              />
            </div>
          </div>

          {/* Category and Rarity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rarity
              </label>
              <select
                value={formData.rarity}
                onChange={(e) => setFormData({ ...formData, rarity: e.target.value as Achievement['rarity'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {rarities.map((rarity) => (
                  <option key={rarity.value} value={rarity.value}>
                    {rarity.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Points and Criteria */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Points
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Criteria Type
              </label>
              <select
                value={formData.criteria.type}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  criteria: { ...formData.criteria, type: e.target.value as AchievementCriteria['type'] }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {criteriaTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Value
              </label>
              <input
                type="number"
                value={formData.criteria.value}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  criteria: { ...formData.criteria, value: parseInt(e.target.value) || 1 }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                min="1"
                required
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_hidden}
                onChange={(e) => setFormData({ ...formData, is_hidden: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Hidden</span>
            </label>
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
              disabled={isSubmitting}
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
