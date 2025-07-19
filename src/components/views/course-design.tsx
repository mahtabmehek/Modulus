'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { ArrowLeft, Plus, Trash2, BookOpen, Layers, Users, Save, Eye, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Module {
    id: string
    title: string
    description: string
    order_index: number
    labs: Lab[]
}

interface Lab {
    id: number
    title: string
    description?: string
    icon_url?: string
    tags?: string[]
}

interface Course {
    id?: number
    title: string
    description: string
    modules: Module[]
}

interface DatabaseCourse {
    id: number
    title: string
    code: string
    description?: string
}

export default function CourseDesignView() {
    const { navigate, currentView } = useApp()
    const [courseData, setCourseData] = useState<Course>({
        title: '',
        description: '',
        modules: []
    })
    const [availableLabs, setAvailableLabs] = useState<Lab[]>([])
    const [availableCourses, setAvailableCourses] = useState<DatabaseCourse[]>([])
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
    const [moduleSearchTerms, setModuleSearchTerms] = useState<{[moduleId: string]: string}>({})
    const [filteredLabs, setFilteredLabs] = useState<Lab[]>([])
    const [loading, setLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Helper functions for per-module search
    const getModuleSearchTerm = (moduleId: string): string => {
        return moduleSearchTerms[moduleId] || ''
    }

    const setModuleSearchTerm = (moduleId: string, term: string) => {
        setModuleSearchTerms(prev => ({
            ...prev,
            [moduleId]: term
        }))
    }

    const getFilteredLabsForModule = (moduleId: string): Lab[] => {
        const searchTerm = getModuleSearchTerm(moduleId)
        if (!searchTerm.trim()) {
            return availableLabs
        }

        return availableLabs.filter(lab =>
            lab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lab.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lab.tags && lab.tags.some(tag =>
                tag.toLowerCase().includes(searchTerm.toLowerCase())
            ))
        )
    }

    // Load available labs and courses when component mounts
    useEffect(() => {
        loadAvailableLabs()
        loadAvailableCourses()
    }, [])

    // Check for courseId parameter and load course data for editing
    useEffect(() => {
        const courseId = currentView.params?.courseId
        if (courseId) {
            loadCourseForEditing(parseInt(courseId))
        }
    }, [currentView.params?.courseId])

    // Auto-populate course data when course code is selected
    useEffect(() => {
        if (selectedCourseId && availableCourses.length > 0) {
            const selectedCourse = availableCourses.find(course => course.id === selectedCourseId)
            if (selectedCourse) {
                setCourseData(prevData => ({
                    ...prevData,
                    title: selectedCourse.title,
                    description: selectedCourse.description || ''
                }))
            }
        }
    }, [selectedCourseId, availableCourses])

    const loadAvailableLabs = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('modulus_token')

            if (!token) {
                console.error('No token found')
                return
            }

            const response = await fetch('http://localhost:3001/api/labs', {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (response.ok) {
                const data = await response.json()
                setAvailableLabs(data.data || [])
            }
        } catch (error) {
            console.error('Error loading labs:', error)
            toast.error('Failed to load available labs')
        } finally {
            setLoading(false)
        }
    }

    const loadAvailableCourses = async () => {
        try {
            console.log('🔄 Loading available courses...')
            const token = localStorage.getItem('modulus_token')

            console.log('🔑 Token status:', token ? 'Found' : 'Not found')

            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            }

            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            console.log('� Making API request to /api/courses...')
            const response = await fetch('http://localhost:3001/api/courses', {
                headers
            })

            console.log('📡 API Response status:', response.status)
            if (response.ok) {
                const data = await response.json()
                console.log('📊 API Response data:', data)
                console.log('📋 Courses found:', data.courses?.length || 0)
                setAvailableCourses(data.courses || [])
            } else {
                console.error('❌ API request failed:', response.status, response.statusText)
                const errorText = await response.text()
                console.error('❌ Error response:', errorText)
            }
        } catch (error) {
            console.error('❌ Error loading courses:', error)
            toast.error('Failed to load available courses')
        }
    }

    const loadCourseForEditing = async (courseId: number) => {
        try {
            console.log('🔄 Loading course for editing:', courseId)
            setLoading(true)

            const token = localStorage.getItem('modulus_token')
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            }

            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            const response = await fetch(`http://localhost:3001/api/courses/${courseId}`, {
                headers
            })

            if (response.ok) {
                const data = await response.json()
                console.log('📊 Loaded course data:', data)

                // Set the selected course ID
                setSelectedCourseId(courseId)

                // Update course data for editing
                setCourseData({
                    id: data.course.id,
                    title: data.course.title,
                    description: data.course.description || '',
                    modules: data.course.modules || []
                })

                toast.success('Course loaded for editing')
            } else {
                console.error('❌ Failed to load course:', response.status)
                toast.error('Failed to load course data')
            }
        } catch (error) {
            console.error('❌ Error loading course for editing:', error)
            toast.error('Failed to load course data')
        } finally {
            setLoading(false)
        }
    }

    const addModule = () => {
        const newModule: Module = {
            id: `module-${Date.now()}`,
            title: '',
            description: '',
            order_index: courseData.modules.length,
            labs: []
        }
        setCourseData({
            ...courseData,
            modules: [...courseData.modules, newModule]
        })
    }

    const updateModule = (moduleId: string, updates: Partial<Module>) => {
        setCourseData({
            ...courseData,
            modules: courseData.modules.map(module =>
                module.id === moduleId ? { ...module, ...updates } : module
            )
        })
    }

    const deleteModule = (moduleId: string) => {
        setCourseData({
            ...courseData,
            modules: courseData.modules.filter(module => module.id !== moduleId)
        })
    }

    const addLabToModule = (moduleId: string, lab: Lab) => {
        // Check if the lab is already assigned to any module
        const isLabAlreadyAssigned = courseData.modules.some(module => 
            module.labs.some(moduleLab => moduleLab.id === lab.id)
        )

        if (isLabAlreadyAssigned) {
            toast.error(`Lab "${lab.title}" is already assigned to another module`)
            return
        }

        setCourseData({
            ...courseData,
            modules: courseData.modules.map(module =>
                module.id === moduleId
                    ? { ...module, labs: [...module.labs, lab] }
                    : module
            )
        })
        toast.success(`Lab "${lab.title}" added to module`)
    }

    const removeLabFromModule = (moduleId: string, labId: number) => {
        setCourseData({
            ...courseData,
            modules: courseData.modules.map(module =>
                module.id === moduleId
                    ? { ...module, labs: module.labs.filter(lab => lab.id !== labId) }
                    : module
            )
        })
    }

    const handleSave = async () => {
        if (!courseData.title.trim()) {
            toast.error('Please enter a course title')
            return
        }

        if (!selectedCourseId) {
            toast.error('Please select a course code')
            return
        }

        setIsSaving(true)
        try {
            console.log('Saving course with modules:', {
                courseId: selectedCourseId,
                modules: courseData.modules
            })

            const token = localStorage.getItem('modulus_token')
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            }

            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            // Prepare the data to send
            const saveData = {
                courseId: selectedCourseId,
                modules: courseData.modules.map(module => ({
                    id: module.id,
                    title: module.title,
                    description: module.description,
                    order_index: module.order_index,
                    labs: module.labs.map(lab => ({
                        id: lab.id,
                        title: lab.title,
                        description: lab.description
                    }))
                }))
            }

            console.log('Sending save data:', saveData)

            // For now, we'll create a new endpoint to save course modules
            const response = await fetch(`http://localhost:3001/api/courses/${selectedCourseId}/modules`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(saveData)
            })

            if (response.ok) {
                const result = await response.json()
                console.log('Save successful:', result)
                toast.success('Course design saved successfully!')
                setTimeout(() => {
                    navigate('dashboard')
                }, 1000)
            } else {
                const errorData = await response.json()
                console.error('Save failed:', errorData)
                toast.error(errorData.error || 'Failed to save course')
            }
        } catch (error) {
            console.error('Error saving course:', error)
            toast.error('Failed to save course')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate('dashboard')}
                    className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Course'}
                </button>
            </div>

            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {courseData.id ? 'Edit Course' : 'Design a Course'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Create a structured course with modules and labs
                </p>
            </div>

            {/* Course Information */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Course Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Course Title *
                        </label>
                        <input
                            type="text"
                            value={courseData.title}
                            readOnly
                            placeholder={selectedCourseId ? "Title will be populated when course code is selected" : "Select a course code first"}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Course Code *
                        </label>
                        <select
                            value={selectedCourseId || ''}
                            onChange={(e) => setSelectedCourseId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                        >
                            <option value="">Select a course code</option>
                            {availableCourses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.code} - {course.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 mt-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Course Description
                        </label>
                        <textarea
                            value={courseData.description}
                            readOnly
                            placeholder={selectedCourseId ? "Description will be populated when course code is selected" : "Select a course code first"}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed resize-none"
                        />
                    </div>
                </div>
            </section>

            {/* Modules */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <Layers className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                        Course Modules
                    </h2>
                    <button
                        onClick={addModule}
                        className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Module
                    </button>
                </div>

                {courseData.modules.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No modules added yet</p>
                        <p className="text-sm">Add your first module to get started</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {courseData.modules.map((module, index) => (
                            <div
                                key={module.id}
                                className="border border-gray-200 dark:border-gray-600 rounded-lg p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                        Module {index + 1}
                                    </h3>
                                    <button
                                        onClick={() => deleteModule(module.id)}
                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Module Title
                                        </label>
                                        <input
                                            type="text"
                                            value={module.title}
                                            onChange={(e) => updateModule(module.id, { title: e.target.value })}
                                            placeholder="Enter module title"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Module Description
                                        </label>
                                        <input
                                            type="text"
                                            value={module.description}
                                            onChange={(e) => updateModule(module.id, { description: e.target.value })}
                                            placeholder="Enter module description"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                {/* Module Labs */}
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                                        Labs in this Module ({module.labs.length})
                                    </h4>

                                    {module.labs.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                            {module.labs.map((lab) => (
                                                <div
                                                    key={lab.id}
                                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        {lab.icon_url ? (
                                                            <img
                                                                src={lab.icon_url}
                                                                alt={lab.title}
                                                                className="w-8 h-8 rounded object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                                                                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {lab.title}
                                                            </p>
                                                            {lab.tags && lab.tags.length > 0 && (
                                                                <div className="flex gap-1 mt-1">
                                                                    {lab.tags.slice(0, 2).map((tag, tagIndex) => (
                                                                        <span
                                                                            key={tagIndex}
                                                                            className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
                                                                        >
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeLabFromModule(module.id, lab.id)}
                                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Search Labs */}
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Search Labs by Name or Tag
                                        </h5>

                                        {/* Search Input */}
                                        <div className="relative mb-3">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={getModuleSearchTerm(module.id)}
                                                onChange={(e) => setModuleSearchTerm(module.id, e.target.value)}
                                                placeholder="Search by lab name or tag..."
                                                className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                            {getModuleSearchTerm(module.id) && (
                                                <button
                                                    onClick={() => setModuleSearchTerm(module.id, '')}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Search Results */}
                                        {loading ? (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Loading labs...</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                                {getFilteredLabsForModule(module.id)
                                                    .filter(lab => {
                                                        // Check if lab is already assigned to ANY module in the course
                                                        return !courseData.modules.some(anyModule => 
                                                            anyModule.labs.some(moduleLab => moduleLab.id === lab.id)
                                                        )
                                                    })
                                                    .map((lab) => (
                                                        <button
                                                            key={lab.id}
                                                            onClick={() => addLabToModule(module.id, lab)}
                                                            className="flex items-center space-x-3 p-2 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                                                        >
                                                            {lab.icon_url ? (
                                                                <img
                                                                    src={lab.icon_url}
                                                                    alt={lab.title}
                                                                    className="w-6 h-6 rounded object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                                                                    <BookOpen className="w-3 h-3 text-blue-600 dark:text-blue-300" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                    {lab.title}
                                                                </p>
                                                                {lab.tags && lab.tags.length > 0 && (
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                        {lab.tags.slice(0, 2).join(', ')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        </button>
                                                    ))}
                                            </div>
                                        )}

                                        {/* No results message */}
                                        {getModuleSearchTerm(module.id) && getFilteredLabsForModule(module.id).filter(lab => {
                                            return !courseData.modules.some(anyModule => 
                                                anyModule.labs.some(moduleLab => moduleLab.id === lab.id)
                                            )
                                        }).length === 0 && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                                No available labs found matching "{getModuleSearchTerm(module.id)}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
