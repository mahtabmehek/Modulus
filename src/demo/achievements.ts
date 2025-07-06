export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  earned: boolean
  earnedDate?: Date
  points: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

export interface UserProgress {
  currentStreak: number
  longestStreak: number
  totalPoints: number
  level: number
  nextLevelPoints: number
  achievementsUnlocked: number
  totalAchievements: number
}

export const achievements: Achievement[] = [
  {
    id: 'first-login',
    name: 'Welcome to Modulus',
    description: 'Complete your first login',
    icon: '👋',
    earned: true,
    earnedDate: new Date('2024-01-15'),
    points: 10,
    rarity: 'common'
  },
  {
    id: 'first-lab',
    name: 'Lab Explorer',
    description: 'Complete your first lab',
    icon: '🔬',
    earned: true,
    earnedDate: new Date('2024-01-16'),
    points: 50,
    rarity: 'common'
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    earned: true,
    earnedDate: new Date('2024-01-22'),
    points: 100,
    rarity: 'uncommon'
  },
  {
    id: 'network-ninja',
    name: 'Network Ninja',
    description: 'Complete all networking labs',
    icon: '🥷',
    earned: false,
    points: 200,
    rarity: 'rare'
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a lab in under 10 minutes',
    icon: '⚡',
    earned: true,
    earnedDate: new Date('2024-01-20'),
    points: 150,
    rarity: 'uncommon'
  },
  {
    id: 'ctf-master',
    name: 'CTF Master',
    description: 'Win your first CTF competition',
    icon: '🏆',
    earned: false,
    points: 500,
    rarity: 'legendary'
  }
]

export const userProgress: UserProgress = {
  currentStreak: 12,
  longestStreak: 18,
  totalPoints: 1250,
  level: 8,
  nextLevelPoints: 1500,
  achievementsUnlocked: 4,
  totalAchievements: achievements.length
}

export const getStreakEmoji = (streak: number): string => {
  if (streak >= 30) return '🔥'
  if (streak >= 14) return '⚡'
  if (streak >= 7) return '🌟'
  if (streak >= 3) return '💫'
  return '✨'
}

export const getLevelInfo = (level: number) => {
  const titles = [
    'Newbie', 'Apprentice', 'Explorer', 'Practitioner', 'Specialist',
    'Expert', 'Master', 'Elite', 'Champion', 'Legend'
  ]
  
  return {
    title: titles[Math.min(level - 1, titles.length - 1)] || 'Legend',
    color: level >= 8 ? 'text-purple-600' : level >= 5 ? 'text-blue-600' : 'text-green-600'
  }
}
