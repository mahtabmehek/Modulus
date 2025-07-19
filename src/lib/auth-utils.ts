// Incognito-compatible authentication utilities
import bcrypt from 'bcryptjs';

export interface User {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name: string;
    role: string;
    isApproved: boolean;
    hashedPassword: string;
    emailVerified: boolean;
    verificationCode?: string;
    resetCode?: string;
    resetCodeExpiry?: number;
    createdAt: number;
}

const STORAGE_KEYS = {
    USERS: 'modulus_users',
    CURRENT_USER: 'modulus_current_user',
    AUTH_TOKEN: 'modulus_auth_token'
};

// Generate a random ID
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Generate a random verification code
export function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Storage utilities that work in incognito mode
export const storage = {
    get: (key: string): any => {
        try {
            if (typeof window === 'undefined') return null;
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch {
            return null;
        }
    },

    set: (key: string, value: any): void => {
        try {
            if (typeof window === 'undefined') return;
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Silently fail in incognito if localStorage is restricted
        }
    },

    remove: (key: string): void => {
        try {
            if (typeof window === 'undefined') return;
            localStorage.removeItem(key);
        } catch {
            // Silently fail in incognito if localStorage is restricted
        }
    }
};

// User management
export class UserManager {
    private static users: User[] = [];
    private static initialized = false;

    static init() {
        if (this.initialized) return;
        this.users = storage.get(STORAGE_KEYS.USERS) || [];
        this.initialized = true;
    }

    static saveUsers() {
        storage.set(STORAGE_KEYS.USERS, this.users);
    }

    static addUser(user: User) {
        this.init();
        this.users.push(user);
        this.saveUsers();
    }

    static findUserByUsername(username: string): User | null {
        this.init();
        return this.users.find(u => u.username === username) || null;
    }

    static findUserByEmail(email: string): User | null {
        this.init();
        return this.users.find(u => u.email === email) || null;
    }

    static updateUser(userId: string, updates: Partial<User>) {
        this.init();
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...updates };
            this.saveUsers();
            return this.users[userIndex];
        }
        return null;
    }

    static getAllUsers(): User[] {
        this.init();
        return [...this.users];
    }
}

// Authentication functions
export const authUtils = {
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    },

    async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    },

    generateAuthToken(userId: string): string {
        return btoa(`${userId}:${Date.now()}:${Math.random()}`);
    },

    parseAuthToken(token: string): { userId: string; timestamp: number } | null {
        try {
            const decoded = atob(token);
            const [userId, timestamp] = decoded.split(':');
            return { userId, timestamp: parseInt(timestamp) };
        } catch {
            return null;
        }
    },

    isTokenValid(token: string): boolean {
        const parsed = this.parseAuthToken(token);
        if (!parsed) return false;

        // Token expires after 7 days
        const expiryTime = parsed.timestamp + (7 * 24 * 60 * 60 * 1000);
        return Date.now() < expiryTime;
    }
};

// Demo users for development
// Real users are managed through local authentication
// All users authenticated through local JWT system
