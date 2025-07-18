'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useApp } from '@/lib/hooks/use-app'
import { labAPI } from '@/lib/api/labs'
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
import toast from 'react-hot-toast'

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
  const { navigate, currentView } = useApp()
  // Get editLabId from navigation parameters to enable edit mode
  const editLabId = currentView?.params?.editLabId

  // Debug logging
  console.log('Lab Creation View - editLabId:', editLabId)
  console.log('Lab Creation View - currentView:', currentView)

  const [modules, setModules] = useState<Array<{ id: number, title: string, course_id: number }>>([])
  const [loadingModules, setLoadingModules] = useState(true)

  const [labData, setLabData] = useState({
    title: '',
    description: '',
    icon: '', // Add icon field for lab image/icon
    // Academic organization
    academicCategory: 'computing' as string,
    course: '',
    module: '',
    moduleId: 0, // Will be set when user selects a module
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
          points: 0
        }
      ]
    }
  ])

  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Load modules and lab data for editing
  useEffect(() => {
    loadModules()
    if (editLabId) {
      loadLabForEditing(editLabId)
    }
  }, [editLabId])

  const loadModules = async () => {
    try {
      const token = localStorage.getItem('modulus_token')
      const response = await fetch('http://localhost:3001/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const allModules: Array<{ id: number, title: string, course_id: number }> = []

        // Extract modules from all courses
        data.courses?.forEach((course: any) => {
          if (course.modules) {
            course.modules.forEach((module: any) => {
              allModules.push({
                id: module.id,
                title: module.title,
                course_id: course.id
              })
            })
          }
        })

        setModules(allModules)
      }
    } catch (error) {
      console.error('Error loading modules:', error)
      toast.error('Failed to load modules')
    } finally {
      setLoadingModules(false)
    }
  }

  const loadLabForEditing = async (labId: number) => {
    try {
      const lab = await labAPI.getLab(labId)
      if (lab) {
        setLabData({
          title: lab.title || '',
          description: lab.description || '',
          icon: lab.icon_path || lab.icon_url || '',
          academicCategory: 'computing',
          course: '',
          module: '',
          moduleId: lab.module_id || 1,
          labType: lab.lab_type === 'vm' ? 'mandatory' : 'challenge',
          difficulty: 'beginner',
          category: 'programming',
          estimatedTime: lab.estimated_minutes || 60,
          vmImage: lab.vm_image || '',
          vmResources: {
            cpu: 2,
            memory: 4,
            storage: 20
          },
          prerequisites: lab.required_tools || [],
          learningObjectives: [],
          tags: lab.tags || []
        })
      }
    } catch (error) {
      console.error('Error loading lab for editing:', error)
      toast.error('Failed to load lab data')
    }
  }

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
      points: 0,
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
    // Validate required fields before saving
    if (!labData.title.trim()) {
      toast.error('Lab title is required');
      return;
    }

    if (labData.tags.length === 0) {
      toast.error('At least one tag is required');
      return;
    }

    setIsSaving(true)

    try {
      // Create the lab using the new labs API that matches the database schema
      const labTypeMapping = {
        'mandatory': 'vm',
        'challenge': 'container'
      }

      // Ensure tags are properly formatted as an array of strings
      const cleanTags = labData.tags.filter(tag => tag && tag.trim()).map(tag => tag.trim())

      const labPayload = {
        module_id: 1, // Always use module 1
        title: labData.title.trim(),
        description: labData.description?.trim() || '',
        icon_path: labData.icon || undefined,
        lab_type: labTypeMapping[labData.labType] || 'vm',
        vm_image: labData.vmImage?.trim() || undefined,
        tags: cleanTags,
        points_possible: 0, // Set to 0 since we removed points system
        estimated_minutes: 60, // Default estimated time
        tasks: tasks // Include tasks and questions data
      }

      console.log('Sending lab payload:', labPayload);
      console.log('editLabId:', editLabId);
      console.log('Will use update path:', !!editLabId);

      let response
      if (editLabId) {
        // Update existing lab
        console.log('Updating lab with ID:', editLabId);
        response = await labAPI.updateLab(editLabId, labPayload)
        toast.success('Lab updated successfully!')
      } else {
        // Create new lab
        console.log('Creating new lab');
        response = await labAPI.createLab(labPayload)
        toast.success('Lab created successfully!')
      }

      console.log('Lab saved:', response)
      navigate('dashboard')
    } catch (error: any) {
      console.error('Failed to save lab:', error)

      // More detailed error message
      if (error.response?.data?.details) {
        console.error('Validation errors:', error.response.data.details);
        
        // Handle both array and string details
        if (Array.isArray(error.response.data.details)) {
          toast.error(`Validation failed: ${error.response.data.details.map((d: any) => d.msg || d.message || d).join(', ')}`);
        } else {
          toast.error(`Validation failed: ${error.response.data.details}`);
        }
      } else if (error.response?.data?.error) {
        toast.error(`Error: ${error.response.data.error}`);
      } else if (error.message) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error(`Failed to ${editLabId ? 'update' : 'create'} lab. Please try again.`);
      }
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
                {editLabId ? 'Edit Lab' : 'Create New Lab'}
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
                disabled={isSaving || !labData.title.trim() || labData.tags.length === 0}
                className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editLabId ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editLabId ? 'Update Lab' : 'Save Lab'}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lab Icon/Image
                  </label>
                  <div className="space-y-3">
                    {/* File Upload Input */}
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">Click to upload</span> lab icon
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or GIF (MAX. 2MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                // Show upload progress
                                toast.loading('Uploading icon...', { id: 'icon-upload' });

                                // Upload the file using the file upload API
                                const formData = new FormData();
                                formData.append('icon', file);
                                formData.append('labName', labData.title || 'untitled-lab');

                                const response = await fetch('http://localhost:3001/api/files/upload-lab-files', {
                                  method: 'POST',
                                  body: formData,
                                });

                                if (response.ok) {
                                  const result = await response.json();
                                  if (result.success && result.data.icon) {
                                    setLabData({ ...labData, icon: result.data.icon });
                                    toast.success('Icon uploaded successfully!', { id: 'icon-upload' });
                                  } else {
                                    console.error('Icon upload failed:', result);
                                    toast.error('Failed to upload icon', { id: 'icon-upload' });
                                  }
                                } else {
                                  console.error('Icon upload failed:', response.statusText);
                                  toast.error('Failed to upload icon', { id: 'icon-upload' });
                                }
                              } catch (error) {
                                console.error('Error uploading icon:', error);
                                toast.error('Error uploading icon', { id: 'icon-upload' });
                              }
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Image Preview */}
                    {labData.icon && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-shrink-0">
                          <img
                            src={labData.icon}
                            alt="Lab icon preview"
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Preview</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">This is how your icon will appear</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLabData({ ...labData, icon: '' })}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags & Keywords *
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {labData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {tag}
                        <button
                          onClick={() => {
                            const newTags = labData.tags.filter((_, i) => i !== index)
                            setLabData({ ...labData, tags: newTags })
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="tagInput"
                      placeholder="Enter a tag and press Enter"
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const input = e.target as HTMLInputElement
                          const tag = input.value.trim()
                          if (tag && !labData.tags.includes(tag)) {
                            setLabData({ ...labData, tags: [...labData.tags, tag] })
                            input.value = ''
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('tagInput') as HTMLInputElement
                        const tag = input.value.trim()
                        if (tag && !labData.tags.includes(tag)) {
                          setLabData({ ...labData, tags: [...labData.tags, tag] })
                          input.value = ''
                        }
                      }}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Add relevant tags to help categorize and search for this lab
                  </p>
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
                    Public Image URL
                  </label>
                  <input
                    type="text"
                    value={labData.vmImage}
                    onChange={(e) => setLabData({ ...labData, vmImage: e.target.value })}
                    placeholder="e.g., ubuntu-20.04-security or custom-vulnhub-image"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
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
          </div>
        </div>
      </div>
    </div>
  )
}
