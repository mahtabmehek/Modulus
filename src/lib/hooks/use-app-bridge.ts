'use client';

import { useAuth } from '@/components/providers/local-auth-provider';
import { User, ViewState, UserProgress, DesktopSession, LabSession } from '@/types';

// Bridge interface that makes useAuth compatible with useApp
export interface UseAppReturn {
    user: User | null;
    isAuthenticated: boolean;
    currentView: ViewState;
    userProgress: UserProgress[];
    desktopSessions: DesktopSession[];
    labSessions: LabSession[];
    currentLabSession: LabSession | null;

    // Actions
    setUser: (user: User | null) => void;
    logout: () => Promise<void>;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
    register: (name: string, email: string, password: string, role: string, accessCode: string) => Promise<{ success: boolean; error?: any }>;
    navigate: (type: ViewState['type'], params?: ViewState['params']) => void;
    updateProgress: (progress: UserProgress) => void;
    createDesktopSession: (labId: string) => Promise<DesktopSession>;
    terminateDesktopSession: (sessionId: string) => void;
    initializeFromUrl: () => void;
    initialize: () => void;
    checkSession: () => Promise<boolean>;

    // Lab session actions
    startLabSession: (labId: string) => Promise<LabSession>;
    extendLabSession: (sessionId: string) => boolean;
    endLabSession: (sessionId: string) => void;
    updateLabInteraction: (sessionId: string) => void;
    getCurrentLabSession: () => LabSession | null;
    cleanupExpiredSessions: () => void;
}

// Convert LocalAuthUser to User type
function convertAuthUserToUser(authUser: any): User | null {
    if (!authUser) return null;

    return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name || `${authUser.firstName} ${authUser.lastName}`.trim(),
        studentId: authUser.id, // Use ID as student ID for now
        role: authUser.role as any,
        avatar: undefined,
        level: 1,
        levelName: 'Beginner',
        badges: [],
        streakDays: 0,
        totalPoints: 0,
        joinedAt: new Date(),
        lastActive: new Date(),
        preferences: {
            theme: 'system',
            language: 'en',
            notifications: {
                email: true,
                push: true,
                announcements: true,
                labUpdates: true
            }
        },
        isApproved: authUser.isVerified,
        approvalStatus: authUser.isVerified ? 'approved' : 'pending',
        status: authUser.isVerified ? 'approved' : 'pending',
        department: 'General'
    };
}

/**
 * Bridge hook that adapts useAuth to work with components expecting useApp
 * This allows old components to work with the new authentication system
 */
export function useApp(): UseAppReturn {
    const { user: authUser, isAuthenticated, signIn, signOut, signUp } = useAuth();

    const user = convertAuthUserToUser(authUser);

    // Mock current view - in real implementation, this could be managed with URL routing
    const currentView: ViewState = {
        type: isAuthenticated ? 'dashboard' : 'login'
    };

    // Mock implementations for features not yet implemented in the current system
    const mockArrays = {
        userProgress: [] as UserProgress[],
        desktopSessions: [] as DesktopSession[],
        labSessions: [] as LabSession[],
        currentLabSession: null as LabSession | null
    };

    const adaptedLogin = async (email: string, password: string) => {
        try {
            await signIn(email, password);
            return { success: true };
        } catch (error: any) {
            return { success: false, error };
        }
    };

    const adaptedRegister = async (name: string, email: string, password: string, role: string, accessCode: string) => {
        try {
            const [firstName, ...lastNameParts] = name.split(' ');
            const lastName = lastNameParts.join(' ');

            await signUp({
                email,
                password,
                firstName,
                lastName,
                role,
                accessCode
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error };
        }
    };

    const adaptedLogout = async () => {
        await signOut();
    };

    // Navigation function - in a real app, this would integrate with Next.js router
    const navigate = (type: ViewState['type'], params?: ViewState['params']) => {
        console.log('Navigate to:', type, params);
        // For now, just log. In real implementation, this would handle routing
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('view', type);
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    url.searchParams.set(key, String(value));
                });
            }
            window.history.pushState({ view: { type, params } }, '', url.toString());
        }
    };

    // Mock implementations for unimplemented features
    const mockFunctions = {
        setUser: (user: User | null) => {
            console.log('setUser called:', user);
        },
        updateProgress: (progress: UserProgress) => {
            console.log('updateProgress called:', progress);
        },
        createDesktopSession: async (labId: string): Promise<DesktopSession> => {
            console.log('createDesktopSession called:', labId);
            return {
                id: `session-${Date.now()}`,
                labId,
                userId: user?.id || '',
                token: `token-${Date.now()}`,
                status: 'starting',
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
                lastActive: new Date(),
                ipAddress: '127.0.0.1'
            };
        },
        terminateDesktopSession: (sessionId: string) => {
            console.log('terminateDesktopSession called:', sessionId);
        },
        initializeFromUrl: () => {
            console.log('initializeFromUrl called');
        },
        initialize: () => {
            console.log('initialize called');
        },
        checkSession: async (): Promise<boolean> => {
            return isAuthenticated;
        },
        startLabSession: async (labId: string): Promise<LabSession> => {
            console.log('startLabSession called:', labId);
            return {
                id: `lab-session-${Date.now()}`,
                labId,
                userId: user?.id || '',
                labName: `Lab ${labId}`,
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600000), // 1 hour from now
                lastInteraction: new Date(),
                remainingMinutes: 60,
                isActive: true,
                canExtend: true
            };
        },
        extendLabSession: (sessionId: string): boolean => {
            console.log('extendLabSession called:', sessionId);
            return true;
        },
        endLabSession: (sessionId: string) => {
            console.log('endLabSession called:', sessionId);
        },
        updateLabInteraction: (sessionId: string) => {
            console.log('updateLabInteraction called:', sessionId);
        },
        getCurrentLabSession: (): LabSession | null => {
            return mockArrays.currentLabSession;
        },
        cleanupExpiredSessions: () => {
            console.log('cleanupExpiredSessions called');
        }
    };

    return {
        user,
        isAuthenticated,
        currentView,
        ...mockArrays,
        login: adaptedLogin,
        logout: adaptedLogout,
        register: adaptedRegister,
        navigate,
        ...mockFunctions
    };
}
