export type UserRole = 'student' | 'instructor' | 'staff' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  studentId?: string
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

export interface Course {
  id: string
  title: string
  description: string
  code: string // e.g., "BSC-IT", "MSC-CS"
  level: 'Bachelor' | 'Master' | 'Doctorate'
  duration: number // in years
  totalCredits: number
  department: string
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface LearningPath {
  id: string
  courseId: string
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
  deadline?: Date
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
  isCompleted?: boolean
  completedQuestions?: string[] // IDs of completed questions
  completedFlags?: string[] // Submitted flags for this task
  totalFlags?: number // Total expected flags for this task
  hasFlags?: boolean // Whether this task requires flags
}

export interface Question {
  id: string
  text: string
  type: 'text' | 'multiple-choice' | 'code' | 'file-upload' | 'flag'
  answer: string | string[] // Can be multiple flags
  hint?: string
  points: number
  explanation?: string
  options?: string[] // for multiple-choice
  isRequired?: boolean // Some questions might be optional
  isCompleted?: boolean
  submittedAnswer?: string
  flags?: string[] // For challenges with multiple flags
  flagCount?: number // Expected number of flags
  acceptsPartialFlags?: boolean // Whether partial flag submission is allowed
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

export interface LabSession {
  id: string
  userId: string
  labId: string
  labName: string
  startTime: Date
  endTime: Date
  lastInteraction: Date
  remainingMinutes: number
  isActive: boolean
  canExtend: boolean
  vmIP?: string
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
  type: 'login' | 'dashboard' | 'path' | 'module' | 'lab' | 'desktop' | 'profile' | 'lab-creation' | 'course-creation' | 'course-edit' | 'course-overview' | 'user-creation' | 'user-edit' | 'user-overview' | 'user-profile'
  params?: {
    pathId?: string
    moduleId?: string
    labId?: string
    sessionId?: string
    courseId?: string
    userId?: string
    [key: string]: any
  }
}

export interface AppData {
  users: User[]
  courses: Course[]
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

export interface UserPermissions {
  canEditUserData: boolean
  canCreateUsers: boolean
  canCreateCourses: boolean
  canCreateLearningPaths: boolean
  canCreateModules: boolean
  canCreateLabs: boolean
  canManageInvites: boolean
  canResetOwnPassword: boolean
  canEditOwnProfile: boolean
  canAccessDashboard: boolean
}

export interface RolePermissions {
  student: UserPermissions
  instructor: UserPermissions
  staff: UserPermissions
  admin: UserPermissions
}
