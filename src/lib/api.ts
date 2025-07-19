// API configuration and utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface ApiError {
  message: string
  errors?: Array<{
    type: string
    msg: string
    path: string
    location: string
  }>
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('modulus_token')
    }
  }

  setToken(token: string | null) {
    console.log('🎯 SETTING TOKEN:', {
      newToken: token ? `${token.substring(0, 30)}...` : 'null',
      oldToken: this.token ? `${this.token.substring(0, 30)}...` : 'null'
    })

    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('modulus_token', token)
        console.log('✅ Token saved to localStorage')
      } else {
        localStorage.removeItem('modulus_token')
        console.log('🗑️ Token removed from localStorage')
      }

      // Verify it was saved
      const savedToken = localStorage.getItem('modulus_token')
      console.log('🔍 Verification - Token in localStorage:', savedToken ? `${savedToken.substring(0, 30)}...` : 'null')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    console.log('🔍 API Request Debug:', {
      endpoint,
      method: options.method || 'GET',
      hasToken: !!this.token,
      tokenPreview: this.token ? `${this.token.substring(0, 20)}...` : 'No token',
      url,
      bodyPreview: options.body ? JSON.stringify(JSON.parse(options.body as string), null, 2).substring(0, 100) + '...' : 'No body'
    })

    if (this.token) {
      (headers as Record<string, string>).Authorization = `Bearer ${this.token}`
      console.log('🔑 Authorization header set:', `Bearer ${this.token.substring(0, 30)}...`)
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    console.log('📡 API Response Debug:', {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ API Error Details:', errorData)
      
      // Create a custom error that includes response data
      const error = new Error(errorData.message || `HTTP ${response.status}`) as any
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      }
      throw error
    }

    return response.json()
  }

  // Authentication endpoints
  async validateAccessCode(accessCode: string): Promise<{ valid: boolean; message: string; allowedRoles: string[] }> {
    return this.request('/auth/validate-access-code', {
      method: 'POST',
      body: JSON.stringify({ accessCode }),
    })
  }

  async register(userData: {
    name: string
    email: string
    password: string
    accessCode: string
    role?: string
  }): Promise<{ message: string; user: any; token: string }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async login(credentials: {
    email: string
    password: string
  }): Promise<{ message: string; user: any; token: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async changePassword(passwordData: {
    currentPassword: string
    newPassword: string
  }): Promise<{ message: string }> {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    })
  }

  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string; resetLink?: string }> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  }

  async checkSession(): Promise<{ user: any; valid: boolean }> {
    return this.request('/auth/session')
  }

  async getUserProfile(userId: string): Promise<{ user: any }> {
    return this.request(`/users/${userId}`)
  }

  async updateUserProfile(userId: string, userData: any): Promise<{ user: any }> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.request('/health')
  }

  // Admin endpoints
  async getPendingApprovals(): Promise<{ users: any[], total: number, message: string }> {
    return this.request('/admin/pending-users')
  }

  async approveUser(userId: number): Promise<{ message: string; user: any }> {
    return this.request(`/admin/approve-user/${userId}`, {
      method: 'POST'
    })
  }

  async rejectUser(userId: number): Promise<{ message: string; deletedUser: any }> {
    return this.request(`/admin/reject-user/${userId}`, {
      method: 'DELETE'
    })
  }

  async getAllUsers(): Promise<{ users: any[], total: number }> {
    return this.request('/admin/test-users')
  }

  async createUser(userData: {
    name: string
    email: string
    password: string
    role: string
    courseCode?: string | null
  }): Promise<{ message: string; user: any }> {
    return this.request('/auth/admin/create-user', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async updateUser(userId: string, userData: {
    name: string
    email: string
    role: string
    courseCode?: string | null
  }): Promise<{ message: string; user: any }> {
    return this.request(`/auth/admin/update-user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  async disableUser(userId: number): Promise<{ message: string; user: any }> {
    return this.request('/auth/admin/disable-user', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
  }

  async enableUser(userId: number): Promise<{ message: string; user: any }> {
    return this.request('/auth/admin/enable-user', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    return this.request('/auth/admin/delete-user', {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    })
  }

  // Course endpoints
  async getCourses(): Promise<{ courses: any[] }> {
    return this.request('/courses')
  }

  async getCourse(courseId: string): Promise<{ course: any }> {
    return this.request(`/courses/${courseId}`)
  }

  async createCourse(courseData: {
    title: string
    code: string
    description: string
    department: string
    academicLevel: string
    duration: number
    totalCredits: number
  }): Promise<{ message: string; course: any }> {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    })
  }

  async updateCourse(courseId: string, courseData: any): Promise<{ message: string; course: any }> {
    return this.request(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    })
  }

  async deleteCourse(courseId: string): Promise<{ message: string; course: any }> {
    return this.request(`/courses/${courseId}`, {
      method: 'DELETE',
    })
  }

  // Lab endpoints
  async getLabs(): Promise<{ success: boolean; data: any[] }> {
    return this.request('/labs', {
      method: 'GET',
    })
  }

  async createLab(labData: {
    name: string
    type: string
    description: string
    instructions: string
    estimatedDuration: number
    difficulty: string
    module_id: number
  }): Promise<{ message: string; lab: any }> {
    return this.request('/labs', {
      method: 'POST',
      body: JSON.stringify(labData),
    })
  }

  async updateLab(labId: string, labData: any): Promise<{ message: string; lab: any }> {
    return this.request(`/labs/${labId}`, {
      method: 'PUT',
      body: JSON.stringify(labData),
    })
  }

  async deleteLab(labId: string): Promise<{ message: string }> {
    return this.request(`/labs/${labId}`, {
      method: 'DELETE',
    })
  }

  async reorderTasks(labId: string, tasks: { id: string; order_index: number }[]): Promise<{ message: string }> {
    return this.request(`/labs/${labId}/tasks/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ tasks }),
    })
  }

  async reorderQuestions(taskId: string, questions: { id: string; order_index: number }[]): Promise<{ message: string }> {
    return this.request(`/labs/tasks/${taskId}/questions/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ questions }),
    })
  }

  // Desktop Session Management
  desktop = {
    // Create new desktop session
    createSession: async (labId: string) => {
      return this.request<{
        success: boolean;
        session: {
          sessionId: string;
          vncUrl: string;
          webUrl: string;
          status: string;
          persistenceType: string;
          labId: string;
        };
      }>('/desktop/create', {
        method: 'POST',
        body: JSON.stringify({ labId })
      });
    },

    // Get current active session
    getCurrentSession: async () => {
      return this.request<{
        success: boolean;
        session: {
          sessionId: string;
          vncUrl: string;
          webUrl: string;
          status: string;
          persistenceType: string;
          labId: string;
          createdAt: string;
        };
      }>('/desktop/session');
    },

    // Terminate current session
    terminateSession: async () => {
      return this.request<{
        success: boolean;
        result: {
          status: string;
          dataPersisted: boolean;
          persistenceType: string;
        };
      }>('/desktop/terminate', {
        method: 'DELETE'
      });
    },

    // Extend session timeout
    extendSession: async () => {
      return this.request<{
        success: boolean;
        message: string;
      }>('/desktop/extend', {
        method: 'POST',
        body: JSON.stringify({})
      });
    },

    // Get user backup history
    getBackups: async () => {
      return this.request<{
        success: boolean;
        backups: Array<{
          filename: string;
          date: string;
          size: number;
          key: string;
        }>;
      }>('/desktop/backups');
    },

    // Get desktop system status
    getStatus: async () => {
      return this.request<{
        success: boolean;
        system: {
          activeContainers: number;
          totalContainers: number;
          memoryUsage: {
            total: number;
            used: number;
            free: number;
            percentage: number;
          };
          cpuUsage: number;
          maxContainers: number;
          availableSlots: number;
        };
        userSession: {
          hasSession: boolean;
          isRunning: boolean;
          sessionInfo?: {
            sessionId: string;
            labId: string;
            createdAt: string;
            lastAccessed: string;
            vncPort: number;
            webPort: number;
          };
        };
      }>('/desktop/status');
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
