// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface Course {
    id: number
    title: string
    code: string
    description: string
    department: string
    academicLevel: string
    duration: string
    totalCredits: number
    enrolledAt?: string
    enrollmentStatus?: string
    completionPercentage?: number
    modules: Module[]
}

export interface Module {
    id: number
    title: string
    description: string
    orderIndex: number
    labs: Lab[]
    completedLabs: number
    totalLabs: number
}

export interface Lab {
    id: number
    title: string
    description: string
    difficulty: string
    estimatedDuration: number
    orderIndex: number
    status: 'not_started' | 'in_progress' | 'completed'
    completedAt?: string
    score?: number
}

export interface CourseResponse {
    success: boolean
    course: Course | null
}

// Get current user's assigned course
export async function getMyCourse(): Promise<CourseResponse> {
    try {
        const token = localStorage.getItem('modulus_token')
        if (!token) {
            throw new Error('No authentication token found')
        }

        const response = await fetch(`${API_BASE_URL}/courses/my-course`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication required')
            }
            if (response.status === 403) {
                throw new Error('Access denied')
            }
            throw new Error(`Failed to fetch course: ${response.status}`)
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error fetching my course:', error)
        throw error
    }
}

// Get all courses (for admin/staff)
export async function getCourses(): Promise<Course[]> {
    try {
        const token = localStorage.getItem('modulus_token')
        if (!token) {
            throw new Error('No authentication token found')
        }

        const response = await fetch(`${API_BASE_URL}/courses`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication required')
            }
            throw new Error(`Failed to fetch courses: ${response.status}`)
        }

        const data = await response.json()
        return data.courses || []
    } catch (error) {
        console.error('Error fetching courses:', error)
        throw error
    }
}

// Get course by ID with modules
export async function getCourseById(id: number): Promise<Course> {
    try {
        const token = localStorage.getItem('modulus_token')
        if (!token) {
            throw new Error('No authentication token found')
        }

        const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication required')
            }
            if (response.status === 404) {
                throw new Error('Course not found')
            }
            throw new Error(`Failed to fetch course: ${response.status}`)
        }

        const data = await response.json()
        return data.course
    } catch (error) {
        console.error('Error fetching course:', error)
        throw error
    }
}
