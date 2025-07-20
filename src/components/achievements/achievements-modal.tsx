'use client'

import { useState, useEffect } from 'react'
import { Trophy, Award, Star, Zap, Target, Gift, X, Check, Lock } from 'lucide-react'
import { achievementsAPI, Achievement, UserAchievementsResponse, getRarityColor, getRarityBorder, formatAchievementDate, getAchievementProgress } from '@/lib/api/achievements'

interface AchievementsModalProps {
  isOpen: boolean
  onClose: () => void
  userId?: number
}

export function AchievementsModal({ isOpen, onClose, userId }: AchievementsModalProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    if (isOpen) {
      fetchAchievements()
    }
  }, [isOpen, userId])

  const fetchAchievements = async () => {
    try {
      setLoading(true)
      setError(null)

      let response: UserAchievementsResponse
      if (userId) {
        response = await achievementsAPI.getUserAchievements(userId)
      } else {
        response = await achievementsAPI.getMyAchievements()
      }

      if (response.success) {
        setAchievements(response.data.achievements)
        setUserStats(response.data.userStats)
        setSummary(response.data.summary)
      }
    } catch (err) {
      console.error('Failed to fetch achievements:', err)
      setError(err instanceof Error ? err.message : 'Failed to load achievements')
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { key: 'all', name: 'All', icon: '🏆' },
    { key: 'welcome', name: 'Welcome', icon: '👋' },
    { key: 'progress', name: 'Progress', icon: '📈' },
    { key: 'streak', name: 'Consistency', icon: '🔥' },
    { key: 'skill', name: 'Skills', icon: '🎯' },
    { key: 'speed', name: 'Speed', icon: '⚡' },
    { key: 'perfection', name: 'Perfection', icon: '💎' },
    { key: 'special', name: 'Special', icon: '⭐' }
  ]

  const filteredAchievements = achievements.filter(achievement =>
    selectedCategory === 'all' || achievement.category === selectedCategory
  )

  const earnedAchievements = achievements.filter(a => a.is_completed)
  const unlockedAchievements = achievements.filter(a => !a.is_completed)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Trophy className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Achievements</h2>
                {summary && (
                  <p className="text-blue-100">
                    {summary.earnedAchievements} of {summary.totalAchievements} unlocked ({summary.completionPercentage}%)
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Stats Summary */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.earnedAchievements}</div>
                <div className="text-sm text-blue-100">Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.totalPointsFromAchievements}</div>
                <div className="text-sm text-blue-100">Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{userStats?.current_streak_days || 0}</div>
                <div className="text-sm text-blue-100">Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{userStats?.level || 1}</div>
                <div className="text-sm text-blue-100">Level</div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col h-full max-h-[60vh]">
          {/* Category Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <div className="flex gap-1 p-4 min-w-max">
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category.key
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Achievements List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-2">Failed to load achievements</div>
                <p className="text-gray-500 text-sm">{error}</p>
                <button
                  onClick={fetchAchievements}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Earned Achievements */}
                {earnedAchievements.length > 0 && (selectedCategory === 'all' || earnedAchievements.some(a => a.category === selectedCategory)) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      Earned Achievements
                    </h3>
                    <div className="grid gap-3">
                      {earnedAchievements
                        .filter(achievement => selectedCategory === 'all' || achievement.category === selectedCategory)
                        .map((achievement) => (
                          <AchievementCard
                            key={achievement.id}
                            achievement={achievement}
                            userStats={userStats}
                            isEarned={true}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Locked Achievements */}
                {unlockedAchievements.length > 0 && (selectedCategory === 'all' || unlockedAchievements.some(a => a.category === selectedCategory)) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-gray-400" />
                      Locked Achievements
                    </h3>
                    <div className="grid gap-3">
                      {unlockedAchievements
                        .filter(achievement => selectedCategory === 'all' || achievement.category === selectedCategory)
                        .map((achievement) => (
                          <AchievementCard
                            key={achievement.id}
                            achievement={achievement}
                            userStats={userStats}
                            isEarned={false}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {filteredAchievements.length === 0 && (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No achievements in this category yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface AchievementCardProps {
  achievement: Achievement
  userStats: any
  isEarned: boolean
}

function AchievementCard({ achievement, userStats, isEarned }: AchievementCardProps) {
  const progress = userStats ? getAchievementProgress(achievement, userStats) : { current: 0, target: achievement.criteria.value, percentage: 0 }
  const rarityStyles = getRarityColor(achievement.rarity)
  const borderStyles = getRarityBorder(achievement.rarity)

  return (
    <div className={`p-4 rounded-lg border-2 ${borderStyles} ${isEarned ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800/50 opacity-75'} transition-all duration-300`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`text-3xl ${isEarned ? '' : 'grayscale'} flex-shrink-0`}>
          {achievement.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h4 className={`font-semibold ${isEarned ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
              {achievement.name}
            </h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${rarityStyles}`}>
              {achievement.rarity}
            </span>
            {isEarned && achievement.earned_at && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatAchievementDate(achievement.earned_at)}
              </span>
            )}
          </div>

          <p className={`text-sm mb-3 ${isEarned ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
            {achievement.description}
          </p>

          {/* Progress Bar (for unearned achievements) */}
          {!isEarned && progress.target > 0 && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Progress: {progress.current} / {progress.target}</span>
                <span>{progress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Points */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className={`font-medium ${isEarned ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                {achievement.points} points
              </span>
            </div>
            {isEarned && (
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                <span className="font-medium">Unlocked</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
