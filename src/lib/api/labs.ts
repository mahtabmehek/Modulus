// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

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
  lab_type?: string
  vm_image?: string
  container_image?: string
  required_tools?: string[]
  network_requirements?: any
  auto_grade?: boolean
  icon_path?: string
  tags?: string[]
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
  lab_type?: string
  vm_image?: string
  container_image?: string
  required_tools?: string[]
  network_requirements?: string
  icon_path?: string
  tags?: string[]
}

class LabAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('modulus_token')
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
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      const errorWithResponse = new Error(error.error || 'Failed to create lab') as any
      errorWithResponse.response = { data: error }
      throw errorWithResponse
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
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      const errorWithResponse = new Error(error.error || 'Failed to update lab') as any
      errorWithResponse.response = { data: error }
      throw errorWithResponse
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
