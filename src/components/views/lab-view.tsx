'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronRight, Monitor, AlertTriangle, ArrowLeft, Clock, Award, BookOpen, GraduationCap, Play, Send } from 'lucide-react'
import { useApp } from '@/lib/hooks/use-app'
import { labAPI } from '@/lib/api/labs'

export default function LabView() {
  const { navigate, currentView } = useApp()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [currentLab, setCurrentLab] = useState<any>(null)
  const [currentModule, setCurrentModule] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(new Set())

  // Get lab and module data from the URL/state
  const labId = currentView.params?.labId
  const moduleId = currentView.params?.moduleId

  // Fetch lab data when component mounts
  useEffect(() => {
    const fetchLabData = async () => {
      if (!labId) {
        setError('No lab ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log('🔍 FRONTEND - Fetching lab data for ID:', labId)
        const lab = await labAPI.getLab(parseInt(labId))
        console.log('🔍 FRONTEND - Lab data received:', {
          id: lab.id,
          title: lab.title,
          tasksCount: lab.tasks?.length || 0,
          tasks: lab.tasks?.map(t => ({ id: t.id, title: t.title, questionsCount: t.questions?.length || 0 }))
        })
        setCurrentLab(lab)
        setCurrentModule({
          id: lab.module_id,
          title: lab.module_title,
          pathId: 'default-path' // This should come from the API later
        })
      } catch (err) {
        console.error('🔍 FRONTEND - Error fetching lab:', err)
        setError(err instanceof Error ? err.message : 'Failed to load lab')
      } finally {
        setLoading(false)
      }
    }

    fetchLabData()
  }, [labId])

  // Handle answer input change
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  // Handle answer submission
  const submitAnswer = async (questionId: string, expectedAnswer: string) => {
    const userAnswer = answers[questionId]
    if (!userAnswer?.trim()) {
      alert('Please enter an answer before submitting.')
      return
    }

    // Simple answer checking (in a real system, this would be server-side)
    const isCorrect = userAnswer.trim().toLowerCase() === expectedAnswer.toLowerCase()
    
    if (isCorrect) {
      setSubmittedQuestions(prev => {
        const newSet = new Set(prev)
        newSet.add(questionId)
        return newSet
      })
      alert('Correct! Well done!')
    } else {
      alert('Not quite right. Try again!')
    }
  }

  // Initialize expanded sections for tasks
  useEffect(() => {
    if (currentLab?.tasks) {
      const initialExpanded: Record<string, boolean> = {}
      // Expand all tasks by default
      currentLab.tasks.forEach((task: any) => {
        initialExpanded[`task-${task.id}`] = true
      })
      setExpandedSections(initialExpanded)
    }
  }, [currentLab])

  if (!currentLab || !currentModule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Lab Not Found</h2>
          <p className="text-gray-600 mb-4">The requested lab could not be found.</p>
          <button
            onClick={() => navigate('dashboard')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading lab...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Error Loading Lab</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('dashboard')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // No lab data
  if (!currentLab) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Lab Not Found</h2>
          <p className="text-gray-600 mb-4">The requested lab could not be found.</p>
          <button
            onClick={() => navigate('dashboard')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <button
            onClick={() => navigate('dashboard')}
            className="hover:text-gray-700 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <button
            onClick={() => navigate('module', { moduleId: currentModule.id })}
            className="hover:text-gray-700 transition-colors"
          >
            {currentModule.title}
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">{currentLab.title}</span>
        </div>

        {/* Lab Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold">{currentLab.title}</h1>
              </div>

              <p className="text-indigo-100 text-lg leading-relaxed mb-4">
                {currentLab.description}
              </p>

              <div className="flex items-center gap-6 text-indigo-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{currentLab.estimated_minutes} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span>{currentLab.points_possible} points</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  <span>{currentLab.lab_type || 'Practical Lab'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Lab Content Overview */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">Lab Overview</h2>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 text-lg leading-relaxed">
                {currentLab.description}
              </p>
            </div>
          </div>
        </div>

        {/* Lab Tasks */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">Lab Tasks</h2>
          </div>

          {currentLab.tasks && currentLab.tasks.length > 0 ? (
            <div className="space-y-6">
              {currentLab.tasks.map((task: any, taskIndex: number) => (
                <div key={task.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 cursor-pointer"
                    onClick={() => toggleSection(`task-${task.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 rounded-lg p-2">
                          <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Task {taskIndex + 1}: {task.title || 'Untitled Task'}
                        </h3>
                      </div>
                      <ChevronUp className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections[`task-${task.id}`] ? 'rotate-180' : ''
                        }`} />
                    </div>
                  </div>

                  {expandedSections[`task-${task.id}`] && (
                    <div className="p-6">
                      {/* Task Description */}
                      {task.description && (
                        <div className="mb-6">
                          <h4 className="text-md font-semibold text-gray-900 mb-3">Description</h4>
                          <div className="prose prose-gray max-w-none">
                            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                              {String(task.description)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Task Questions */}
                      {task.questions && task.questions.length > 0 && (
                        <div>
                          <h4 className="text-md font-semibold text-gray-900 mb-4">Questions</h4>
                          <div className="space-y-4">
                            {task.questions.map((question: any, questionIndex: number) => (
                              <div key={question.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-start justify-between mb-3">
                                  <h5 className="text-sm font-semibold text-gray-900">
                                    Question {questionIndex + 1}: {question.title || 'Untitled Question'}
                                  </h5>
                                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                                    {question.points || 0} pts
                                  </span>
                                </div>
                                
                                {question.description && (
                                  <div className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
                                    {String(question.description)}
                                  </div>
                                )}

                                {/* Answer Input Fields */}
                                <div className="mt-4 space-y-3">
                                  {question.type === 'flag' && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Answer:
                                      </label>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={answers[`question-${question.id}`] || ''}
                                          onChange={(e) => handleAnswerChange(`question-${question.id}`, e.target.value)}
                                          placeholder="Enter your flag answer..."
                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                          disabled={submittedQuestions.has(`question-${question.id}`)}
                                        />
                                        <button
                                          onClick={() => submitAnswer(`question-${question.id}`, question.flag)}
                                          disabled={submittedQuestions.has(`question-${question.id}`)}
                                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                          <Send className="w-4 h-4" />
                                          {submittedQuestions.has(`question-${question.id}`) ? 'Submitted' : 'Submit'}
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {question.type === 'text' && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Answer:
                                      </label>
                                      <div className="flex gap-2">
                                        <textarea
                                          value={answers[`question-${question.id}`] || ''}
                                          onChange={(e) => handleAnswerChange(`question-${question.id}`, e.target.value)}
                                          placeholder="Enter your answer..."
                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                          rows={3}
                                          disabled={submittedQuestions.has(`question-${question.id}`)}
                                        />
                                        <button
                                          onClick={() => submitAnswer(`question-${question.id}`, question.flag || 'No expected answer')}
                                          disabled={submittedQuestions.has(`question-${question.id}`)}
                                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 h-fit"
                                        >
                                          <Send className="w-4 h-4" />
                                          {submittedQuestions.has(`question-${question.id}`) ? 'Submitted' : 'Submit'}
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {question.type === 'multiple-choice' && question.multipleChoiceOptions && Array.isArray(question.multipleChoiceOptions) && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select your answer:
                                      </label>
                                      <div className="space-y-2 mb-3">
                                        {question.multipleChoiceOptions.map((option: string, optionIndex: number) => (
                                          <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`question-${question.id}`}
                                              value={option}
                                              checked={answers[`question-${question.id}`] === option}
                                              onChange={(e) => handleAnswerChange(`question-${question.id}`, e.target.value)}
                                              disabled={submittedQuestions.has(`question-${question.id}`)}
                                              className="text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">
                                              {String.fromCharCode(65 + optionIndex)}) {String(option)}
                                            </span>
                                          </label>
                                        ))}
                                      </div>
                                      <button
                                        onClick={() => submitAnswer(`question-${question.id}`, question.flag || question.multipleChoiceOptions[0])}
                                        disabled={submittedQuestions.has(`question-${question.id}`)}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                                      >
                                        <Send className="w-4 h-4" />
                                        {submittedQuestions.has(`question-${question.id}`) ? 'Submitted' : 'Submit'}
                                      </button>
                                    </div>
                                  )}

                                  {submittedQuestions.has(`question-${question.id}`) && (
                                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                        <div className="ml-3">
                                          <p className="text-sm font-medium text-green-800">
                                            Answer submitted successfully!
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {question.type === 'flag' && (
                                  <div className="mt-3 text-sm text-gray-600">
                                    <p>Expected format: <code className="bg-gray-200 px-1 rounded">flag{'{answer}'}</code></p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No tasks provided yet.</p>
                <p className="text-gray-400 text-sm mt-2">
                  Tasks will be available when the lab is ready.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
