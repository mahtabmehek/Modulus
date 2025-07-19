// User adapter to convert between API user and App user types
import { User, UserRole } from '@/types'

export interface CognitoAuthUser {
    id: string;
    username: string;
    email: string;
    name: string;
    role: string;
    isApproved: boolean;
    emailVerified: boolean;
    attributes: Record<string, any>;
}

export function adaptCognitoUserToAppUser(cognitoUser: CognitoAuthUser): User {
    return {
        id: cognitoUser.id,
        email: cognitoUser.email,
        name: cognitoUser.name || cognitoUser.username,
        role: (cognitoUser.role as UserRole) || 'student',
        avatar: cognitoUser.attributes?.picture || undefined,
        level: 1, // Default level for new users
        levelName: 'Beginner',
        badges: [],
        streakDays: 0,
        totalPoints: 0,
        joinedAt: new Date(),
        lastActive: new Date(),
        preferences: {
            theme: 'light',
            language: 'en',
            notifications: {
                email: true,
                push: true,
                announcements: true,
                labUpdates: true
            }
        },
        isApproved: cognitoUser.isApproved,
        approvalStatus: cognitoUser.isApproved ? 'approved' : 'pending',
        status: cognitoUser.isApproved ? 'approved' : 'pending',
        department: cognitoUser.attributes?.department || undefined
    }
}
