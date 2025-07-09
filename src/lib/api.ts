// API configuration and utilities
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://modulus-backend-1734346092.eu-west-2.elb.amazonaws.com/api'
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
      throw new Error(errorData.message || `HTTP ${response.status}`)
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
}

export const apiClient = new ApiClient(API_BASE_URL)
