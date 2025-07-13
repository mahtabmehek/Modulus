// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (
  process.env.NODE_ENV === 'production'
    ? 'https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api'
    : 'http://localhost:3001/api'
)

export interface Lab {
  id: number
  module_id: number
  title: string
  description?: string
  instructions?: string
  order_index: number
  is_published: boolean
  estimated_minutes: number
  points_possible: number
  max_attempts: number
  created_at: string
  updated_at: string
  module_title?: string
  course_id?: number
  course_title?: string
}

export interface CreateLabData {
  module_id: number
  title: string
  description?: string
  instructions?: string
  order_index?: number
  estimated_minutes?: number
  points_possible?: number
  max_attempts?: number
  is_published?: boolean
}

class LabAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  async getLabs(moduleId?: number): Promise<Lab[]> {
    const url = moduleId
      ? `${API_BASE_URL}/labs?module_id=${moduleId}`
      : `${API_BASE_URL}/labs`

    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch labs: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  }

  async getLab(id: number): Promise<Lab> {
    const response = await fetch(`${API_BASE_URL}/labs/${id}`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch lab: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
  }

  async createLab(lab: CreateLabData): Promise<Lab> {
    const response = await fetch(`${API_BASE_URL}/labs`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(lab)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create lab')
    }

    const data = await response.json()
    return data.data
  }

  async updateLab(id: number, lab: Partial<CreateLabData>): Promise<Lab> {
    const response = await fetch(`${API_BASE_URL}/labs/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(lab)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update lab')
    }

    const data = await response.json()
    return data.data
  }

  async deleteLab(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/labs/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete lab')
    }
  }
}

export const labAPI = new LabAPI()
