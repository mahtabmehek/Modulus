import { UserRole, UserPermissions, RolePermissions } from '@/types'

export const rolePermissions: RolePermissions = {
  student: {
    canEditUserData: false,
    canCreateUsers: false,
    canCreateCourses: false,
    canCreateLearningPaths: false,
    canCreateModules: false,
    canCreateLabs: false,
    canManageInvites: false,
    canResetOwnPassword: true,
    canEditOwnProfile: false, // Can only change preferences, not email/name
    canAccessDashboard: true,
  },
  instructor: {
    canEditUserData: false,
    canCreateUsers: false,
    canCreateCourses: false,
    canCreateLearningPaths: false,
    canCreateModules: true, // Can create modules within existing courses
    canCreateLabs: true,
    canManageInvites: false,
    canResetOwnPassword: true,
    canEditOwnProfile: false, // Can only change preferences, not email/name
    canAccessDashboard: true,
  },
  staff: {
    canEditUserData: true, // Can edit instructor and student data
    canCreateUsers: true, // Can create instructor and student accounts
    canCreateCourses: true, // Primary responsibility - creating courses
    canCreateLearningPaths: true,
    canCreateModules: false, // Instructors handle module content
    canCreateLabs: false, // Instructors handle lab content
    canManageInvites: true,
    canResetOwnPassword: true,
    canEditOwnProfile: true, // Staff can edit their own profile
    canAccessDashboard: true,
  },
  admin: {
    canEditUserData: true,
    canCreateUsers: true,
    canCreateCourses: true,
    canCreateLearningPaths: true,
    canCreateModules: true,
    canCreateLabs: true,
    canManageInvites: true,
    canResetOwnPassword: true,
    canEditOwnProfile: true,
    canAccessDashboard: true,
  },
}

export function getUserPermissions(role: UserRole): UserPermissions {
  return rolePermissions[role]
}

export function canUserPerformAction(role: UserRole, action: keyof UserPermissions): boolean {
  return rolePermissions[role][action]
}

export function canEditUserData(currentUserRole: UserRole, targetUserRole: UserRole): boolean {
  const permissions = getUserPermissions(currentUserRole)
  
  // Admin can edit anyone
  if (currentUserRole === 'admin') {
    return true
  }
  
  // Staff can edit instructors and students, but not other staff or admins
  if (currentUserRole === 'staff') {
    return targetUserRole === 'instructor' || targetUserRole === 'student'
  }
  
  // Instructors and students cannot edit any user data
  return false
}

export function canCreateCourse(role: UserRole): boolean {
  return canUserPerformAction(role, 'canCreateCourses')
}

export function canCreateModule(role: UserRole): boolean {
  return canUserPerformAction(role, 'canCreateModules')
}

export function canManageUsers(role: UserRole): boolean {
  return canUserPerformAction(role, 'canCreateUsers')
}

export function canViewUserProfile(currentUserRole: UserRole, targetUserRole: UserRole): boolean {
  // Everyone can view their own profile
  if (currentUserRole === targetUserRole) {
    return true
  }
  
  // Admin can view anyone's profile
  if (currentUserRole === 'admin') {
    return true
  }
  
  // Staff can view instructor and student profiles
  if (currentUserRole === 'staff') {
    return targetUserRole === 'instructor' || targetUserRole === 'student'
  }
  
  // Instructors and students can only view their own profiles
  return false
}

export function canCreateUser(currentUserRole: UserRole, targetUserRole: UserRole): boolean {
  const permissions = getUserPermissions(currentUserRole)
  
  if (!permissions.canCreateUsers) {
    return false
  }
  
  // Admin can create anyone
  if (currentUserRole === 'admin') {
    return true
  }
  
  // Staff can create instructors and students, but not other staff or admins
  if (currentUserRole === 'staff') {
    return targetUserRole === 'instructor' || targetUserRole === 'student'
  }
  
  return false
}
