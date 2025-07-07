# 🔗 Frontend Integration Guide for Authentication Backend

## Overview
Your Modulus LMS frontend already has a complete authentication UI, but it's currently using mock data. This guide shows how to connect it to the real backend authentication API.

## Authentication Backend Endpoints

### Base URL: `http://modulus-alb-2046761654.eu-west-2.elb.amazonaws.com/api`

### Available Endpoints:

#### 1. **Validate Access Code**
```typescript
POST /api/auth/validate-access-code
Content-Type: application/json

Body:
{
  "accessCode": "mahtabmehek1337"
}

Response (Success):
{
  "valid": true,
  "message": "Access code is valid",
  "allowedRoles": ["student", "instructor"]
}

Response (Error):
{
  "valid": false,
  "error": "Invalid or expired access code"
}
```

#### 2. **User Registration**
```typescript
POST /api/auth/register
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "User Name",
  "accessCode": "mahtabmehek1337",
  "role": "student" // or "instructor"
}

Response (Success):
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "role": "student",
    "isApproved": true,
    "joinedAt": "2025-01-07T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "requiresApproval": false
}
```

#### 3. **User Login**
```typescript
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response (Success):
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "role": "student",
    "isApproved": true,
    "joinedAt": "2025-01-07T...",
    "lastActive": "2025-01-07T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 4. **Get Current User**
```typescript
GET /api/auth/me
Authorization: Bearer {token}

Response (Success):
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "role": "student",
    "isApproved": true,
    "joinedAt": "2025-01-07T...",
    "lastActive": "2025-01-07T...",
    "level": 1,
    "levelName": "Beginner",
    "badges": [],
    "streakDays": 0,
    "totalPoints": 0
  }
}
```

#### 5. **Change Password**
```typescript
PUT /api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}

Response (Success):
{
  "message": "Password changed successfully"
}
```

## Frontend Integration Steps

### 1. Update API Configuration

Create or update `src/lib/api/config.ts`:
```typescript
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://modulus-alb-2046761654.eu-west-2.elb.amazonaws.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
}

export const getAuthHeaders = (token?: string) => ({
  ...API_CONFIG.headers,
  ...(token && { Authorization: `Bearer ${token}` })
})
```

### 2. Create API Service Functions

Create `src/lib/api/auth.ts`:
```typescript
import { API_CONFIG, getAuthHeaders } from './config'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  accessCode: string
  role?: 'student' | 'instructor'
}

export interface ValidateAccessCodeRequest {
  accessCode: string
}

export class AuthAPI {
  private static async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(error.error || error.message || 'Request failed')
    }

    return response.json()
  }

  static async validateAccessCode(data: ValidateAccessCodeRequest) {
    return this.request('/auth/validate-access-code', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async register(data: RegisterRequest) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async login(data: LoginRequest) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async getCurrentUser(token: string) {
    return this.request('/auth/me', {
      method: 'GET',
      headers: getAuthHeaders(token),
    })
  }

  static async changePassword(data: { currentPassword: string; newPassword: string }, token: string) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: getAuthHeaders(token),
    })
  }

  static async logout(token: string) {
    return this.request('/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(token),
    })
  }
}
```

### 3. Update Frontend Store (use-app.ts)

Update the `validateInviteCode` function in `src/lib/hooks/use-app.ts`:

```typescript
// Replace the mock validateInviteCode function with:
validateInviteCode: async (code: string) => {
  try {
    const response = await AuthAPI.validateAccessCode({ accessCode: code })
    if (response.valid) {
      // Return mock invite structure that frontend expects
      return {
        id: 'auth-invite',
        code,
        name: 'New User',
        email: '',
        role: 'student',
        permissions: [],
        createdBy: 'system',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isUsed: false
      }
    }
    return null
  } catch (error) {
    console.error('Access code validation error:', error)
    return null
  }
},

// Replace the mock setupUserAccount function with:
setupUserAccount: async (data: InviteSetupData) => {
  try {
    const response = await AuthAPI.register({
      email: data.email,
      password: data.password,
      name: data.name,
      accessCode: data.inviteCode,
      role: data.role || 'student'
    })

    // Store token in localStorage
    localStorage.setItem('authToken', response.token)

    // Convert API response to frontend User type
    const user: User = {
      id: response.user.id.toString(),
      email: response.user.email,
      name: response.user.name,
      role: response.user.role,
      level: response.user.level || 1,
      levelName: response.user.levelName || 'Beginner',
      badges: response.user.badges || [],
      streakDays: response.user.streakDays || 0,
      totalPoints: response.user.totalPoints || 0,
      joinedAt: new Date(response.user.joinedAt),
      lastActive: new Date(response.user.lastActive || response.user.joinedAt),
      isApproved: response.user.isApproved,
      approvalStatus: response.user.isApproved ? 'approved' : 'pending',
      preferences: {
        theme: 'system',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          announcements: true,
          labUpdates: true,
        },
      },
    }

    // Update store state
    set({ user, isAuthenticated: true })
    return user
  } catch (error) {
    console.error('User registration error:', error)
    throw error
  }
},
```

### 4. Add Login Function

Add a new login function to the store:

```typescript
// Add this to the AppStore interface
login: (email: string, password: string) => Promise<User>

// Add this to the store implementation
login: async (email: string, password: string) => {
  try {
    const response = await AuthAPI.login({ email, password })

    // Store token
    localStorage.setItem('authToken', response.token)

    // Convert to frontend User type
    const user: User = {
      id: response.user.id.toString(),
      email: response.user.email,
      name: response.user.name,
      role: response.user.role,
      level: response.user.level || 1,
      levelName: response.user.levelName || 'Beginner',
      badges: response.user.badges || [],
      streakDays: response.user.streakDays || 0,
      totalPoints: response.user.totalPoints || 0,
      joinedAt: new Date(response.user.joinedAt),
      lastActive: new Date(response.user.lastActive),
      isApproved: response.user.isApproved,
      approvalStatus: response.user.isApproved ? 'approved' : 'pending',
      preferences: {
        theme: 'system',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          announcements: true,
          labUpdates: true,
        },
      },
    }

    set({ user, isAuthenticated: true })
    return user
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
},
```

### 5. Token Persistence and Auto-Login

Add token restoration on app load:

```typescript
// Add this to initialize the store (in useEffect or app startup)
const initializeAuth = async () => {
  const token = localStorage.getItem('authToken')
  if (token) {
    try {
      const response = await AuthAPI.getCurrentUser(token)
      
      // Convert to frontend User type and set authenticated state
      const user: User = {
        id: response.user.id.toString(),
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
        level: response.user.level || 1,
        levelName: response.user.levelName || 'Beginner',
        badges: response.user.badges || [],
        streakDays: response.user.streakDays || 0,
        totalPoints: response.user.totalPoints || 0,
        joinedAt: new Date(response.user.joinedAt),
        lastActive: new Date(response.user.lastActive),
        isApproved: response.user.isApproved,
        approvalStatus: response.user.isApproved ? 'approved' : 'pending',
        preferences: {
          theme: 'system',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            announcements: true,
            labUpdates: true,
          },
        },
      }

      set({ user, isAuthenticated: true })
    } catch (error) {
      // Token is invalid, remove it
      localStorage.removeItem('authToken')
      set({ user: null, isAuthenticated: false })
    }
  }
}
```

### 6. Update Logout Function

```typescript
logout: () => {
  const token = localStorage.getItem('authToken')
  if (token) {
    AuthAPI.logout(token).catch(console.error)
  }
  localStorage.removeItem('authToken')
  set({ user: null, isAuthenticated: false })
},
```

## Environment Variables

Add to your `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://modulus-alb-2046761654.eu-west-2.elb.amazonaws.com/api
```

## Testing the Integration

1. **Access Code**: Use `mahtabmehek1337`
2. **Register a new user** through the frontend
3. **Login with the created user**
4. **Navigate through the application** with real authentication

## Notes

- **JWT Token**: Stored in localStorage and sent as Bearer token
- **Access Code**: Required for registration (`mahtabmehek1337`)
- **Student vs Instructor**: Students are auto-approved, instructors need admin approval
- **Error Handling**: All API calls should include proper error handling
- **Token Expiration**: Tokens expire in 24 hours (configurable)

## Next Steps

After implementing this integration:
1. **Test all authentication flows**
2. **Add real course/lab data APIs**
3. **Implement file upload/download**
4. **Add real progress tracking**
5. **Connect desktop environment APIs**

Your frontend UI is already complete - this just connects it to real backend data!
