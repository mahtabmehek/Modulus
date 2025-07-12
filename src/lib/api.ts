// API configuration and utilities
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api'
  : 'http://localhost:3001/api'

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

  // Lab endpoints (placeholder for future implementation)
  async getLabs(): Promise<{ labs: any[] }> {
    // For now, return empty array since backend doesn't have lab endpoints yet
    return { labs: [] }
  }

  async createLab(labData: {
    name: string
    type: string
    description: string
    instructions: string
    estimatedDuration: number
    difficulty: string
  }): Promise<{ message: string; lab: any }> {
    // Placeholder for future lab creation API
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
}

export const apiClient = new ApiClient(API_BASE_URL)
