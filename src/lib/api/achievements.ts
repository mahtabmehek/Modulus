// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Helper function to make API calls with auth token
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('modulus_token')

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Achievement Types
export interface Achievement {
  id: number
  achievement_key: string
  name: string
  description: string
  icon: string
  category: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  points: number
  criteria: AchievementCriteria
  is_active: boolean
  is_hidden: boolean
  unlock_order: number
  created_at: string
  updated_at: string

  // Joined data
  category_name?: string
  category_icon?: string

  // User-specific data (when fetching user achievements)
  earned_at?: string
  progress_value?: number
  is_completed?: boolean
}

export interface AchievementCriteria {
  type: 'labs_completed' | 'streak_days' | 'perfect_labs' | 'speed_completions' |
  'total_points' | 'modules_completed' | 'courses_completed' | 'login_count' |
  'profile_completion' | 'fast_completion' | 'perfect_completion' |
  'category_completion' | 'early_login' | 'late_completion' | 'weekend_activity'
  value: number
  category?: string // for category_completion type
  time_threshold?: number // for time-based achievements
}

export interface AchievementCategory {
  id: number
  category_key: string
  name: string
  description: string
  icon: string
  sort_order: number
  achievement_count: number
  created_at: string
}

export interface UserAchievementStats {
  user_id: number
  labs_completed: number
  labs_attempted: number
  total_questions_answered: number
  correct_answers: number
  current_streak_days: number
  longest_streak_days: number
  last_activity_date: string
  first_activity_date: string
  total_points_earned: number
  current_level: number
  level_progress: number
  courses_completed: number
  modules_completed: number
  perfect_labs: number
  speed_completions: number
  help_given: number

  // From users table
  level: number
  level_name: string
  total_points: number
  streak_days: number
}

export interface LeaderboardEntry {
  id: number
  name: string
  level: number
  level_name: string
  total_points: number
  streak_days: number
  achievements_earned: number
  achievement_points: number
  rank: number
}

// API Response Types
export interface AchievementsResponse {
  success: boolean
  data: {
    achievements: Achievement[]
  }
}

export interface UserAchievementsResponse {
  success: boolean
  data: {
    achievements: Achievement[]
    userStats: UserAchievementStats
    summary: {
      totalAchievements: number
      earnedAchievements: number
      totalPointsFromAchievements: number
      completionPercentage: number
    }
  }
}

export interface AchievementCheckResponse {
  success: boolean
  data: {
    newAchievements: Array<{
      awarded_achievement_id: number
      achievement_name: string
    }>
    message: string
  }
}

export interface AchievementCategoriesResponse {
  success: boolean
  data: {
    categories: AchievementCategory[]
  }
}

export interface LeaderboardResponse {
  success: boolean
  data: {
    leaderboard: LeaderboardEntry[]
  }
}

// Achievement API Client
export const achievementsAPI = {
  // Get all available achievements
  getAllAchievements: async (): Promise<AchievementsResponse> => {
    return apiCall('/achievements')
  },

  // Get user's achievements
  getUserAchievements: async (userId: number): Promise<UserAchievementsResponse> => {
    return apiCall(`/achievements/user/${userId}`)
  },

  // Get current user's achievements
  getMyAchievements: async (): Promise<UserAchievementsResponse> => {
    return apiCall('/achievements/my')
  },

  // Check and award new achievements
  checkAchievements: async (userId: number): Promise<AchievementCheckResponse> => {
    return apiCall(`/achievements/check/${userId}`, {
      method: 'POST'
    })
  },

  // Check current user's achievements
  checkMyAchievements: async (): Promise<AchievementCheckResponse> => {
    // This will be handled by getting the user ID from the token on the backend
    return apiCall('/achievements/check/me', {
      method: 'POST'
    })
  },

  // Get achievement categories
  getCategories: async (): Promise<AchievementCategoriesResponse> => {
    return apiCall('/achievements/categories')
  },

  // Get leaderboard
  getLeaderboard: async (limit: number = 10, category: string = 'all'): Promise<LeaderboardResponse> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(category !== 'all' && { category })
    })
    return apiCall(`/achievements/leaderboard?${params}`)
  },

  // Admin: Create achievement
  createAchievement: async (achievement: Partial<Achievement>): Promise<{ success: boolean; data: { achievement: Achievement } }> => {
    return apiCall('/achievements', {
      method: 'POST',
      body: JSON.stringify(achievement)
    })
  },

  // Admin: Update achievement
  updateAchievement: async (achievementId: number, achievement: Partial<Achievement>): Promise<{ success: boolean; data: { achievement: Achievement } }> => {
    return apiCall(`/achievements/${achievementId}`, {
      method: 'PUT',
      body: JSON.stringify(achievement)
    })
  }
}

// Helper functions for UI
export const getRarityColor = (rarity: Achievement['rarity']): string => {
  switch (rarity) {
    case 'common': return 'text-gray-600 bg-gray-100'
    case 'uncommon': return 'text-green-600 bg-green-100'
    case 'rare': return 'text-blue-600 bg-blue-100'
    case 'epic': return 'text-purple-600 bg-purple-100'
    case 'legendary': return 'text-yellow-600 bg-yellow-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

export const getRarityBorder = (rarity: Achievement['rarity']): string => {
  switch (rarity) {
    case 'common': return 'border-gray-300'
    case 'uncommon': return 'border-green-300'
    case 'rare': return 'border-blue-300'
    case 'epic': return 'border-purple-300'
    case 'legendary': return 'border-yellow-300'
    default: return 'border-gray-300'
  }
}

export const formatAchievementDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const calculateProgress = (current: number, target: number): number => {
  return Math.min(Math.round((current / target) * 100), 100)
}

export const getAchievementProgress = (achievement: Achievement, userStats: UserAchievementStats): { current: number; target: number; percentage: number } => {
  const criteria = achievement.criteria
  let current = 0
  const target = criteria.value

  switch (criteria.type) {
    case 'labs_completed':
      current = userStats.labs_completed
      break
    case 'streak_days':
      current = userStats.current_streak_days
      break
    case 'perfect_labs':
      current = userStats.perfect_labs
      break
    case 'speed_completions':
      current = userStats.speed_completions
      break
    case 'total_points':
      current = userStats.total_points_earned
      break
    case 'modules_completed':
      current = userStats.modules_completed
      break
    case 'courses_completed':
      current = userStats.courses_completed
      break
    default:
      current = achievement.progress_value || 0
  }

  return {
    current,
    target,
    percentage: calculateProgress(current, target)
  }
}
