export type UserRole = 'student' | 'instructor' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  level: number
  levelName: string
  badges: string[]
  streakDays: number
  totalPoints: number
  joinedAt: Date
  lastActive: Date
  preferences: UserPreferences
  isApproved?: boolean
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: Date
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: {
    email: boolean
    push: boolean
    announcements: boolean
    labUpdates: boolean
  }
}

export interface LearningPath {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  estimatedHours: number
  modules: Module[]
  prerequisites: string[]
  isPublished: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Module {
  id: string
  pathId: string
  title: string
  description: string
  order: number
  labs: Lab[]
  isLocked: boolean
  prerequisites: string[]
  estimatedHours: number
}

export interface Lab {
  id: string
  moduleId: string
  title: string
  description: string
  content: string
  type: 'Mandatory' | 'Challenge' | 'Coursework'
  difficulty: 'Easy' | 'Medium' | 'Hard'
  estimatedTime: number
  points: number
  icon: string
  order: number
  isPublished: boolean
  hasDesktop: boolean
  desktopConfig?: DesktopConfig
  tasks: Task[]
  resources: Resource[]
  questions: Question[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  title: string
  content: string
  order: number
  questions: Question[]
  documents: Document[]
}

export interface Question {
  id: string
  text: string
  type: 'text' | 'multiple-choice' | 'code' | 'file-upload'
  answer: string | string[]
  hint?: string
  points: number
  explanation?: string
  options?: string[] // for multiple-choice
}

export interface Resource {
  id: string
  name: string
  type: 'pdf' | 'video' | 'link' | 'download'
  url: string
  description?: string
  size?: number
}

export interface Document {
  id: string
  name: string
  url: string
  type: string
  size: number
}

export interface DesktopConfig {
  id: string
  name: string
  image: string
  cpu: number
  memory: number
  storage: number
  os: 'ubuntu' | 'kali' | 'windows' | 'centos'
  hasGui: boolean
  exposedPorts: number[]
  environment: Record<string, string>
  persistentVolumes: string[]
}

export interface UserProgress {
  userId: string
  labId: string
  status: 'not-started' | 'in-progress' | 'completed' | 'submitted'
  score: number
  timeSpent: number
  attempts: number
  lastAttempt: Date
  completedTasks: string[]
  answers: Record<string, any>
  desktopSession?: DesktopSession
}

export interface DesktopSession {
  id: string
  userId: string
  labId: string
  token: string
  status: 'starting' | 'running' | 'stopped' | 'error'
  createdAt: Date
  expiresAt: Date
  lastActive: Date
  ipAddress?: string
  vnc_port?: number
  ssh_port?: number
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: string
  criteria: BadgeCriteria
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface BadgeCriteria {
  type: 'labs_completed' | 'streak_days' | 'points_earned' | 'path_completed'
  value: number
  pathId?: string
  difficulty?: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'error'
  priority: 'low' | 'medium' | 'high'
  targetAudience: UserRole[]
  isPublished: boolean
  publishedAt?: Date
  expiresAt?: Date
  createdBy: string
  createdAt: Date
}

export interface ViewState {
  type: 'landing' | 'login' | 'register' | 'approval-pending' | 'dashboard' | 'path' | 'module' | 'lab' | 'desktop' | 'profile'
  params?: {
    pathId?: string
    moduleId?: string
    labId?: string
    sessionId?: string
    [key: string]: any
  }
}

export interface AppData {
  users: User[]
  learningPaths: LearningPath[]
  modules: Module[]
  labs: Lab[]
  badges: Badge[]
  announcements: Announcement[]
}

export interface CompletionStats {
  totalLabs: number
  completedLabs: number
  totalMandatory: number
  completedMandatory: number
  completionPercent: number
  badges: number
  currentStreak: number
  totalPoints: number
}
