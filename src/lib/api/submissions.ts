// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Helper function to make API calls with auth token
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('modulus_token')

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export interface Submission {
  id: number
  user_id: number
  lab_id: number
  task_id: number
  question_id: number
  submitted_answer: string
  is_correct: boolean
  points_earned: number
  submitted_at: string
  updated_at: string
  // Joined data
  question_title?: string
  question_type?: string
  task_title?: string
}

export interface LabCompletion {
  id: number
  user_id: number
  lab_id: number
  started_at: string
  completed_at?: string
  is_completed: boolean
  total_questions: number
  correct_submissions: number
  total_points_possible: number
  points_earned: number
  completion_percentage: number
  // Joined data
  user_name?: string
  user_email?: string
  lab_title?: string
}

export interface SubmissionResponse {
  success: boolean
  data: {
    submissionId: number
    isCorrect: boolean
    pointsEarned: number
    submittedAt: string
    feedback: string
  }
}

export interface LabSubmissionsResponse {
  success: boolean
  data: {
    submissions: Submission[]
    completion: LabCompletion | null
  }
}

export interface QuestionSubmissionResponse {
  success: boolean
  data: {
    hasSubmission: boolean
    submission: Submission | null
  }
}

export interface LabAnalyticsResponse {
  success: boolean
  data: {
    completions: LabCompletion[]
    statistics: {
      total_users: number
      correct_submissions: number
      total_submissions: number
      avg_success_rate: number
    }
  }
}

export const submissionsAPI = {
  // Submit an answer for a question
  submitAnswer: async (data: {
    labId: number
    taskId: number
    questionId: number
    submittedAnswer: string
  }): Promise<SubmissionResponse> => {
    return apiCall('/submissions', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Get user's submissions for a specific lab
  getLabSubmissions: async (labId: number): Promise<LabSubmissionsResponse> => {
    return apiCall(`/submissions/lab/${labId}`)
  },

  // Check if user has submitted for a specific question
  getQuestionSubmission: async (questionId: number): Promise<QuestionSubmissionResponse> => {
    return apiCall(`/submissions/question/${questionId}`)
  },

  // Get submissions for any user (instructor/admin only)
  getUserLabSubmissions: async (userId: number, labId: number): Promise<LabSubmissionsResponse> => {
    return apiCall(`/submissions/user/${userId}/lab/${labId}`)
  },

  // Get all submissions for a lab (instructor/admin only)
  getLabAnalytics: async (labId: number): Promise<LabAnalyticsResponse> => {
    return apiCall(`/submissions/lab/${labId}/all`)
  }
}
