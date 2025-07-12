'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useApp } from '@/lib/hooks/use-app'
import { apiClient } from '@/lib/api'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Monitor, 
  Flag, 
  FileText, 
  Upload,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  questions: Question[]
}

interface Question {
  id: string
  type: 'flag' | 'text' | 'file-upload' | 'multiple-choice'
  title: string
  description: string
  flag?: string
  isOptional: boolean
  points: number
  images?: string[]
  attachments?: string[]
  multipleChoiceOptions?: {
    option: string
    isCorrect: boolean
  }[]
  hints?: string[]
}

export default function LabCreationView() {
  const { navigate } = useApp()
  
  const [labData, setLabData] = useState({
    title: '',
    description: '',
    // Academic organization
    academicCategory: 'computing' as string,
    course: '',
    module: '',
    labType: 'mandatory' as 'mandatory' | 'challenge',
    // Technical details
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    category: 'programming' as string, // subcategory within academic field
    estimatedTime: 60,
    vmImage: '',
    vmResources: {
      cpu: 2,
      memory: 4,
      storage: 20
    },
    prerequisites: [] as string[],
    learningObjectives: [] as string[],
    tags: [] as string[]
  })

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'task-1',
      title: 'Initial Setup',
      description: 'Set up your environment and explore the lab infrastructure.',
      questions: [
        {
          id: 'q-1',
          type: 'flag',
          title: 'Find the initial flag',
          description: 'Locate the flag hidden in the welcome message.',
          flag: 'MODULUS{w3lc0m3_t0_th3_l4b}',
          isOptional: false,
          points: 10
        }
      ]
    }
  ])

  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const addTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: `Task ${tasks.length + 1}`,
      description: '',
      questions: []
    }
    setTasks([...tasks, newTask])
  }

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ))
  }

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  const addQuestion = (taskId: string) => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type: 'flag',
      title: 'New Question',
      description: '',
      isOptional: false,
      points: 10,
      images: [],
      attachments: [],
      hints: []
    }
    
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, questions: [...task.questions, newQuestion] }
        : task
    ))
  }

  const updateQuestion = (taskId: string, questionId: string, updates: Partial<Question>) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? {
            ...task,
            questions: task.questions.map(q => 
              q.id === questionId ? { ...q, ...updates } : q
            )
          }
        : task
    ))
  }

  const handleImageUpload = (taskId: string, questionId: string, files: FileList | null) => {
    if (!files) return
    
    // Simulate file upload - in real app, upload to cloud storage
    const imageUrls = Array.from(files).map(file => URL.createObjectURL(file))
    
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? {
            ...task,
            questions: task.questions.map(q => 
              q.id === questionId 
                ? { ...q, images: [...(q.images || []), ...imageUrls] }
                : q
            )
          }
        : task
    ))
  }

  const handleAttachmentUpload = (taskId: string, questionId: string, files: FileList | null) => {
    if (!files) return
    
    // Simulate file upload - in real app, upload to cloud storage
    const attachmentUrls = Array.from(files).map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size
    }))
    
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? {
            ...task,
            questions: task.questions.map(q => 
              q.id === questionId 
                ? { ...q, attachments: [...(q.attachments || []), ...attachmentUrls.map(a => a.url)] }
                : q
            )
          }
        : task
    ))
  }

  const addMultipleChoiceOption = (taskId: string, questionId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? {
            ...task,
            questions: task.questions.map(q => 
              q.id === questionId 
                ? { 
                    ...q, 
                    multipleChoiceOptions: [
                      ...(q.multipleChoiceOptions || []),
                      { option: '', isCorrect: false }
                    ]
                  }
                : q
            )
          }
        : task
    ))
  }

  const deleteQuestion = (taskId: string, questionId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, questions: task.questions.filter(q => q.id !== questionId) }
        : task
    ))
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // Create the lab using the API
      const response = await apiClient.createLab({
        name: labData.title,
        type: labData.type,
        description: labData.description,
        instructions: tasks.map(task => `${task.title}: ${task.description}`).join('\n'),
        estimatedDuration: labData.estimatedDuration,
        difficulty: labData.difficulty,
        module_id: 1 // Default module ID - should be selected by user
      })
      
      console.log('Lab created:', response)
      alert('✅ Lab created successfully!')
      navigate('dashboard')
    } catch (error) {
      console.error('Failed to save lab:', error)
      alert('❌ Failed to save lab. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const academicCategories = [
    'computing',
    'engineering',
    'mathematics',
    'sciences',
    'medicine',
    'business',
    'humanities',
    'social-sciences',
    'arts',
    'law'
  ]

  const getSubcategories = (academicCategory: string) => {
    const subcategoryMap: Record<string, string[]> = {
      'computing': [
        'programming',
        'algorithms',
        'data-structures',
        'cybersecurity',
        'web-development',
        'mobile-development',
        'artificial-intelligence',
        'machine-learning',
        'database-systems',
        'software-engineering',
        'computer-networks',
        'operating-systems'
      ],
      'engineering': [
        'mechanical',
        'electrical',
        'civil',
        'chemical',
        'aerospace',
        'biomedical',
        'environmental',
        'industrial',
        'materials',
        'nuclear'
      ],
      'mathematics': [
        'calculus',
        'algebra',
        'statistics',
        'discrete-math',
        'differential-equations',
        'linear-algebra',
        'number-theory',
        'geometry',
        'topology',
        'analysis'
      ],
      'sciences': [
        'physics',
        'chemistry',
        'biology',
        'earth-sciences',
        'astronomy',
        'environmental-science',
        'biochemistry',
        'genetics',
        'microbiology',
        'ecology'
      ],
      'medicine': [
        'anatomy',
        'physiology',
        'pathology',
        'pharmacology',
        'clinical-skills',
        'diagnostics',
        'surgery',
        'internal-medicine',
        'pediatrics',
        'psychiatry'
      ],
      'business': [
        'accounting',
        'finance',
        'marketing',
        'management',
        'economics',
        'operations',
        'strategy',
        'entrepreneurship',
        'human-resources',
        'international-business'
      ],
      'humanities': [
        'literature',
        'philosophy',
        'history',
        'linguistics',
        'cultural-studies',
        'theology',
        'classics',
        'comparative-literature',
        'rhetoric',
        'ethics'
      ],
      'social-sciences': [
        'psychology',
        'sociology',
        'anthropology',
        'political-science',
        'economics',
        'geography',
        'international-relations',
        'criminology',
        'social-work',
        'public-policy'
      ],
      'arts': [
        'visual-arts',
        'music',
        'theater',
        'film-studies',
        'creative-writing',
        'photography',
        'sculpture',
        'painting',
        'digital-arts',
        'art-history'
      ],
      'law': [
        'constitutional-law',
        'criminal-law',
        'civil-law',
        'corporate-law',
        'international-law',
        'environmental-law',
        'intellectual-property',
        'family-law',
        'tax-law',
        'human-rights'
      ]
    }
    return subcategoryMap[academicCategory] || []
  }

  const courses = [
    'BSc Computer Science Year 1',
    'BSc Computer Science Year 2', 
    'BSc Computer Science Year 3',
    'MSc Computer Science',
    'BSc Engineering Year 1',
    'BSc Engineering Year 2',
    'BSc Engineering Year 3',
    'MSc Engineering',
    'BSc Mathematics Year 1',
    'BSc Mathematics Year 2',
    'BSc Mathematics Year 3',
    'MSc Mathematics',
    'BSc Sciences Year 1',
    'BSc Sciences Year 2',
    'BSc Sciences Year 3',
    'MSc Sciences',
    'MBBS Year 1',
    'MBBS Year 2',
    'MBBS Year 3',
    'MBBS Year 4',
    'MBBS Year 5',
    'BSc Business Year 1',
    'BSc Business Year 2',
    'BSc Business Year 3',
    'MBA'
  ]

  const categories = getSubcategories(labData.academicCategory)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('dashboard')}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <div className="h-6 border-l border-gray-300 dark:border-gray-600"></div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Lab
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving || !labData.title.trim()}
                className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Lab
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
          {/* Academic Organization */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Academic Organization
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Academic Field *
                  </label>
                  <select
                    value={labData.academicCategory}
                    onChange={(e) => setLabData({ 
                      ...labData, 
                      academicCategory: e.target.value,
                      category: getSubcategories(e.target.value)[0] || ''
                    })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {academicCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.split('-').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course *
                  </label>
                  <select
                    value={labData.course}
                    onChange={(e) => setLabData({ ...labData, course: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Course</option>
                    {courses.filter(course => 
                      course.toLowerCase().includes(labData.academicCategory) ||
                      (labData.academicCategory === 'computing' && course.includes('Computer Science')) ||
                      (labData.academicCategory === 'medicine' && course.includes('MBBS')) ||
                      (labData.academicCategory === 'business' && (course.includes('Business') || course.includes('MBA')))
                    ).map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Module
                  </label>
                  <input
                    type="text"
                    value={labData.module}
                    onChange={(e) => setLabData({ ...labData, module: e.target.value })}
                    placeholder="e.g., Module 3: Data Structures"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lab Type *
                  </label>
                  <select
                    value={labData.labType}
                    onChange={(e) => setLabData({ ...labData, labType: e.target.value as 'mandatory' | 'challenge' })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="mandatory">Mandatory</option>
                    <option value="challenge">Challenge</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject Area
                </label>
                <select
                  value={labData.category}
                  onChange={(e) => setLabData({ ...labData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Lab Basic Information */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Basic Information
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lab Title *
                  </label>
                  <input
                    type="text"
                    value={labData.title}
                    onChange={(e) => setLabData({ ...labData, title: e.target.value })}
                    placeholder="e.g., SQL Injection Fundamentals"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={labData.description}
                    onChange={(e) => setLabData({ ...labData, description: e.target.value })}
                    placeholder="Describe what students will learn in this lab..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={labData.difficulty}
                      onChange={(e) => setLabData({ ...labData, difficulty: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estimated Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={labData.estimatedTime}
                      onChange={(e) => setLabData({ ...labData, estimatedTime: parseInt(e.target.value) || 0 })}
                      min="15"
                      max="480"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* VM Configuration */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Monitor className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Virtual Machine Configuration
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    VM Image
                  </label>
                  <input
                    type="text"
                    value={labData.vmImage}
                    onChange={(e) => setLabData({ ...labData, vmImage: e.target.value })}
                    placeholder="e.g., ubuntu-20.04-security or custom-vulnhub-image"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Resource Requirements
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">CPU Cores</label>
                      <input
                        type="number"
                        value={labData.vmResources.cpu}
                        onChange={(e) => setLabData({
                          ...labData,
                          vmResources: { ...labData.vmResources, cpu: parseInt(e.target.value) || 1 }
                        })}
                        min="1"
                        max="8"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Memory (GB)</label>
                      <input
                        type="number"
                        value={labData.vmResources.memory}
                        onChange={(e) => setLabData({
                          ...labData,
                          vmResources: { ...labData.vmResources, memory: parseInt(e.target.value) || 1 }
                        })}
                        min="1"
                        max="32"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Storage (GB)</label>
                      <input
                        type="number"
                        value={labData.vmResources.storage}
                        onChange={(e) => setLabData({
                          ...labData,
                          vmResources: { ...labData.vmResources, storage: parseInt(e.target.value) || 10 }
                        })}
                        min="10"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Tasks and Questions */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Lab Tasks & Questions
                </h2>
                <button
                  onClick={addTask}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </button>
              </div>

              <div className="space-y-6">
                {tasks.map((task, taskIndex) => (
                  <div key={task.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Task {taskIndex + 1}
                      </h3>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Task Title
                        </label>
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => updateTask(task.id, { title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Task Description
                        </label>
                        <textarea
                          value={task.description}
                          onChange={(e) => updateTask(task.id, { description: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      {/* Questions */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Questions
                          </label>
                          <button
                            onClick={() => addQuestion(task.id)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Question
                          </button>
                        </div>

                        {task.questions.map((question, questionIndex) => (
                          <div key={question.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Question {questionIndex + 1}
                              </span>
                              <div className="flex items-center space-x-2">
                                <select
                                  value={question.type}
                                  onChange={(e) => updateQuestion(task.id, question.id, { type: e.target.value as any })}
                                  className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                >
                                  <option value="flag">Flag</option>
                                  <option value="text">Text Answer</option>
                                  <option value="multiple-choice">Multiple Choice</option>
                                  <option value="file-upload">File Upload</option>
                                </select>
                                <button
                                  onClick={() => deleteQuestion(task.id, question.id)}
                                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <div>
                                <input
                                  type="text"
                                  value={question.title}
                                  onChange={(e) => updateQuestion(task.id, question.id, { title: e.target.value })}
                                  placeholder="Question title"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                />
                              </div>
                              <div className="flex space-x-2">
                                <input
                                  type="number"
                                  value={question.points}
                                  onChange={(e) => updateQuestion(task.id, question.id, { points: parseInt(e.target.value) || 0 })}
                                  placeholder="Points"
                                  min="0"
                                  className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                />
                                <label className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <input
                                    type="checkbox"
                                    checked={question.isOptional}
                                    onChange={(e) => updateQuestion(task.id, question.id, { isOptional: e.target.checked })}
                                    className="mr-1"
                                  />
                                  Optional
                                </label>
                              </div>
                            </div>

                            <textarea
                              value={question.description}
                              onChange={(e) => updateQuestion(task.id, question.id, { description: e.target.value })}
                              placeholder="Question description/instructions"
                              rows={2}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white mb-3"
                            />

                            {/* Media and Attachments */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  Images
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => handleImageUpload(task.id, question.id, e.target.files)}
                                  className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                />
                                {question.images && question.images.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {question.images.map((img, idx) => (
                                      <Image key={idx} src={img} alt="Question" width={48} height={48} className="w-12 h-12 object-cover rounded border" />
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  Attachments
                                </label>
                                <input
                                  type="file"
                                  multiple
                                  onChange={(e) => handleAttachmentUpload(task.id, question.id, e.target.files)}
                                  className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                />
                                {question.attachments && question.attachments.length > 0 && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {question.attachments.length} file(s) attached
                                  </div>
                                )}
                              </div>
                            </div>

                            {question.type === 'flag' && (
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  Expected Flag
                                </label>
                                <input
                                  type="text"
                                  value={question.flag || ''}
                                  onChange={(e) => updateQuestion(task.id, question.id, { flag: e.target.value })}
                                  placeholder="MODULUS{example_flag_here}"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                />
                              </div>
                            )}

                            {question.type === 'multiple-choice' && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="block text-xs text-gray-600 dark:text-gray-400">
                                    Answer Options
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => addMultipleChoiceOption(task.id, question.id)}
                                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    + Add Option
                                  </button>
                                </div>
                                {question.multipleChoiceOptions?.map((option, optionIdx) => (
                                  <div key={optionIdx} className="flex items-center gap-2 mb-1">
                                    <input
                                      type="checkbox"
                                      checked={option.isCorrect}
                                      onChange={(e) => {
                                        const newOptions = [...(question.multipleChoiceOptions || [])]
                                        newOptions[optionIdx].isCorrect = e.target.checked
                                        updateQuestion(task.id, question.id, { multipleChoiceOptions: newOptions })
                                      }}
                                      className="flex-shrink-0"
                                    />
                                    <input
                                      type="text"
                                      value={option.option}
                                      onChange={(e) => {
                                        const newOptions = [...(question.multipleChoiceOptions || [])]
                                        newOptions[optionIdx].option = e.target.value
                                        updateQuestion(task.id, question.id, { multipleChoiceOptions: newOptions })
                                      }}
                                      placeholder="Answer option"
                                      className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Lab Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Lab Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Field:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {labData.academicCategory.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                  <span className={`text-sm font-medium ${
                    labData.labType === 'mandatory' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-purple-600 dark:text-purple-400'
                  }`}>
                    {labData.labType.charAt(0).toUpperCase() + labData.labType.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tasks:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{tasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Questions:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {tasks.reduce((total, task) => total + task.questions.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Points:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {tasks.reduce((total, task) => 
                      total + task.questions.reduce((taskTotal, question) => taskTotal + question.points, 0), 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Time:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{labData.estimatedTime}min</span>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Lab Creation Tips
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>• Define clear learning objectives</li>
                <li>• Use progressive difficulty levels</li>
                <li>• Include diverse question types</li>
                <li>• Add visual aids and attachments</li>
                <li>• Provide helpful hints and feedback</li>
                <li>• Test thoroughly before publishing</li>
              </ul>
            </div>

            {/* Resource Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Resource Requirements</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">CPU:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {labData.vmResources.cpu} cores
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Memory:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {labData.vmResources.memory}GB RAM
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Storage:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {labData.vmResources.storage}GB disk
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cost per hour:</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      $0.{(labData.vmResources.cpu * 2 + labData.vmResources.memory * 0.5).toFixed(0).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
