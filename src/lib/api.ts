// API configuration and utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (
  process.env.NODE_ENV === 'production' 
    ? 'https://2wd44vvcnypx57l3g32zo4dnoy0bkmwi.lambda-url.eu-west-2.on.aws/api'
    : 'http://localhost:3001/api'
)

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
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token)
      } else {
        localStorage.removeItem('auth_token')
      }
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

    if (this.token) {
      (headers as Record<string, string>).Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      // Throw the entire error object so frontend can access errorType and message
      const error = new Error(errorData.message || `HTTP ${response.status}`)
      // Attach the error data to the error object
      Object.assign(error, errorData)
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
  async getPendingApprovals(): Promise<{ pendingApprovals: any[] }> {
    return this.request('/auth/admin/pending-approvals')
  }

  async approveUser(userId: number): Promise<{ message: string; user: any }> {
    return this.request('/auth/admin/approve-user', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
  }

  async rejectUser(userId: number): Promise<{ message: string; user: any }> {
    return this.request('/auth/admin/reject-user', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
  }

  async getAllUsers(): Promise<{ users: any[] }> {
    return this.request('/auth/admin/users')
  }

  async createUser(userData: {
    name: string
    email: string
    password: string
    role: string
  }): Promise<{ message: string; user: any }> {
    return this.request('/auth/admin/create-user', {
      method: 'POST',
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
