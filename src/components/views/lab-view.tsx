'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronRight, Monitor, AlertTriangle, ArrowLeft, Clock, Award, BookOpen, GraduationCap, Play, Send, Menu, X, List } from 'lucide-react'
import { useApp } from '@/lib/hooks/use-app'
import { labAPI } from '@/lib/api/labs'
import { submissionsAPI } from '@/lib/api/submissions'

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
  const [questionStatus, setQuestionStatus] = useState<Record<string, 'correct' | 'incorrect' | 'pending'>>({})
  const [shakingQuestions, setShakingQuestions] = useState<Set<string>>(new Set())
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

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
        
        // Set the first task as active by default
        if (lab.tasks && lab.tasks.length > 0) {
          setActiveTaskId(lab.tasks[0].id.toString())
        }

        // Load existing submissions for this lab
        await loadExistingSubmissions(labId)
      } catch (err) {
        console.error('🔍 FRONTEND - Error fetching lab:', err)
        setError(err instanceof Error ? err.message : 'Failed to load lab')
      } finally {
        setLoading(false)
      }
    }

    fetchLabData()
  }, [labId])

  // Set up intersection observer for automatic active task detection
  useEffect(() => {
    if (!currentLab?.tasks) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const taskId = entry.target.id.replace('task-', '')
            setActiveTaskId(taskId)
          }
        })
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0.1
      }
    )

    // Observe all task elements
    currentLab.tasks.forEach((task: any) => {
      const element = document.getElementById(`task-${task.id}`)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [currentLab])

  // Handle answer input change
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  // Load existing submissions for this lab
  const loadExistingSubmissions = async (labId: string) => {
    try {
      const response = await submissionsAPI.getLabSubmissions(parseInt(labId))
      if (response.success && response.data.submissions) {
        const existingSubmissions = new Set<string>()
        const existingAnswers: Record<string, string> = {}
        const existingStatus: Record<string, 'correct' | 'incorrect' | 'pending'> = {}

        response.data.submissions.forEach(submission => {
          const questionKey = `question-${submission.question_id}`
          existingSubmissions.add(questionKey)
          existingAnswers[questionKey] = submission.submitted_answer
          existingStatus[questionKey] = submission.is_correct ? 'correct' : 'incorrect'
        })

        setSubmittedQuestions(existingSubmissions)
        setAnswers(existingAnswers)
        setQuestionStatus(existingStatus)
      }
    } catch (error) {
      console.error('Failed to load existing submissions:', error)
    }
  }

  // Handle answer submission with API
  const submitAnswer = async (questionId: string, expectedAnswer: string) => {
    const userAnswer = answers[questionId]
    if (!userAnswer?.trim()) {
      // Trigger shake animation for empty answer
      setShakingQuestions(prev => new Set(prev).add(questionId))
      setTimeout(() => {
        setShakingQuestions(prev => {
          const newSet = new Set(prev)
          newSet.delete(questionId)
          return newSet
        })
      }, 600)
      return
    }

    try {
      // Extract question ID from the questionId string (remove "question-" prefix)
      const actualQuestionId = parseInt(questionId.replace('question-', ''))
      
      // Find the task and lab IDs for this question
      let taskId: number | null = null
      let labIdNum: number | null = null
      
      if (currentLab?.tasks) {
        for (const task of currentLab.tasks) {
          for (const question of task.questions || []) {
            if (question.id === actualQuestionId) {
              taskId = task.id
              labIdNum = parseInt(labId!)
              break
            }
          }
          if (taskId) break
        }
      }

      if (!taskId || !labIdNum) {
        throw new Error('Could not find task or lab for this question')
      }

      // Submit to API
      const response = await submissionsAPI.submitAnswer({
        labId: labIdNum,
        taskId: taskId,
        questionId: actualQuestionId,
        submittedAnswer: userAnswer.trim()
      })

      if (response.success) {
        const isCorrect = response.data.isCorrect
        
        if (isCorrect) {
          setSubmittedQuestions(prev => {
            const newSet = new Set(prev)
            newSet.add(questionId)
            return newSet
          })
          setQuestionStatus(prev => ({
            ...prev,
            [questionId]: 'correct'
          }))
        } else {
          setQuestionStatus(prev => ({
            ...prev,
            [questionId]: 'incorrect'
          }))
          
          // Trigger shake animation
          setShakingQuestions(prev => new Set(prev).add(questionId))
          setTimeout(() => {
            setShakingQuestions(prev => {
              const newSet = new Set(prev)
              newSet.delete(questionId)
              return newSet
            })
            // Reset status back to pending after shake
            setQuestionStatus(prev => ({
              ...prev,
              [questionId]: 'pending'
            }))
          }, 600)
        }
      }
    } catch (error) {
      console.error('Failed to submit answer:', error)
      // Show error state
      setQuestionStatus(prev => ({
        ...prev,
        [questionId]: 'incorrect'
      }))
      
      // Trigger shake animation
      setShakingQuestions(prev => new Set(prev).add(questionId))
      setTimeout(() => {
        setShakingQuestions(prev => {
          const newSet = new Set(prev)
          newSet.delete(questionId)
          return newSet
        })
        // Reset status back to pending after shake
        setQuestionStatus(prev => ({
          ...prev,
          [questionId]: 'pending'
        }))
      }, 600)
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
    
    // Set active task when expanding
    const taskId = sectionId.replace('task-', '')
    if (!expandedSections[sectionId]) {
      setActiveTaskId(taskId)
    }
  }

  // Get submit button styling and text based on question status
  const getSubmitButtonProps = (questionId: string) => {
    const status = questionStatus[questionId] || 'pending'
    const isShaking = shakingQuestions.has(questionId)
    const isSubmitted = submittedQuestions.has(questionId)
    
    let baseClasses = "px-3 py-1.5 rounded-md transition-all duration-300 flex items-center gap-2 font-medium text-sm"
    let statusClasses = ""
    let text = ""
    let disabled = false
    
    if (isSubmitted || status === 'correct') {
      statusClasses = "bg-green-600 hover:bg-green-700 text-white"
      text = "Completed"
      disabled = true
    } else if (status === 'incorrect') {
      statusClasses = "bg-red-600 hover:bg-red-700 text-white"
      text = "Try Again"
    } else {
      statusClasses = "bg-indigo-600 hover:bg-indigo-700 text-white"
      text = "Submit"
    }
    
    // Add shake effect using custom CSS animation
    if (isShaking) {
      statusClasses += " animate-shake"
    }
    
    return {
      className: `${baseClasses} ${statusClasses}`,
      text,
      disabled
    }
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 px-6 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center text-base text-gray-500 dark:text-gray-400 mb-4">
          <button
            onClick={() => navigate('dashboard')}
            className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <button
            onClick={() => navigate('module', { moduleId: currentModule.id })}
            className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Modules
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 dark:text-gray-100 font-medium text-base">{currentLab.title}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Lab Header Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white mb-6">
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
            </div>
          </div>
        </div>

        {/* Unified Lab Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          {/* Lab Overview Section */}
          <div className="p-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Lab Overview</h2>
            </div>
            <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 text-xl leading-relaxed">
                {currentLab.description}
              </p>
            </div>
          </div>

          {/* Lab Tasks Section */}
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Lab Tasks</h2>
            </div>

            {currentLab.tasks && currentLab.tasks.length > 0 ? (
              <div className="space-y-8">
                {currentLab.tasks.map((task: any, taskIndex: number) => (
                  <div key={task.id} id={`task-${task.id}`} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm">
                    <div
                      className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-600 dark:to-gray-500 px-6 py-5 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:from-indigo-100 hover:to-purple-100 dark:hover:from-gray-500 dark:hover:to-gray-400 transition-all duration-200"
                      onClick={() => toggleSection(`task-${task.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                            activeTaskId === task.id 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {taskIndex + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              {task.title || `Task ${taskIndex + 1}`}
                            </h3>
                            <div className="flex items-center gap-4 text-base text-gray-600 dark:text-gray-400">
                              {task.questions && (
                                <span className="flex items-center gap-2">
                                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                  {task.questions.length} question{task.questions.length !== 1 ? 's' : ''}
                                </span>
                              )}
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                {expandedSections[`task-${task.id}`] ? 'Expanded' : 'Click to expand'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {expandedSections[`task-${task.id}`] && (
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                          )}
                          <ChevronUp className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                            expandedSections[`task-${task.id}`] ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </div>
                    </div>

                  {expandedSections[`task-${task.id}`] && (
                    <div className="p-8">
                      {/* Task Description */}
                      {task.description && (
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Description</h4>
                          <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                              {String(task.description)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Task Questions */}
                      {task.questions && task.questions.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Questions</h4>
                          <div className="space-y-8">
                            {task.questions.map((question: any, questionIndex: number) => (
                              <div key={question.id} className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                                <div className="flex items-start justify-between mb-4">
                                  <h5 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                    Question {questionIndex + 1}: {question.title || 'Untitled Question'}
                                  </h5>
                                </div>
                                
                                {question.description && (
                                  <div className="text-base text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap leading-relaxed">
                                    {String(question.description)}
                                  </div>
                                )}

                                {/* Answer Input Fields */}
                                <div className="mt-6 space-y-4">
                                  {question.type === 'flag' && (
                                    <div>
                                      <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Your Answer:
                                      </label>
                                      <div className="flex gap-3">
                                        <input
                                          type="text"
                                          value={answers[`question-${question.id}`] || ''}
                                          onChange={(e) => handleAnswerChange(`question-${question.id}`, e.target.value)}
                                          placeholder="Enter your flag answer..."
                                          className={`flex-1 px-4 py-3 border rounded-lg text-base ${
                                            submittedQuestions.has(`question-${question.id}`)
                                              ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed select-none'
                                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                                          }`}
                                          disabled={submittedQuestions.has(`question-${question.id}`)}
                                          style={submittedQuestions.has(`question-${question.id}`) ? { userSelect: 'none', pointerEvents: 'none' } : {}}
                                        />
                                        {(() => {
                                          const buttonProps = getSubmitButtonProps(`question-${question.id}`)
                                          return (
                                            <button
                                              onClick={() => submitAnswer(`question-${question.id}`, question.flag)}
                                              disabled={buttonProps.disabled}
                                              className={buttonProps.className}
                                            >
                                              <Send className="w-4 h-4" />
                                              {buttonProps.text}
                                            </button>
                                          )
                                        })()}
                                      </div>
                                    </div>
                                  )}

                                  {question.type === 'text' && (
                                    <div>
                                      <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Your Answer:
                                      </label>
                                      <div className="flex gap-3">
                                        <textarea
                                          value={answers[`question-${question.id}`] || ''}
                                          onChange={(e) => handleAnswerChange(`question-${question.id}`, e.target.value)}
                                          placeholder="Enter your answer..."
                                          className={`flex-1 px-4 py-3 border rounded-lg text-base ${
                                            submittedQuestions.has(`question-${question.id}`)
                                              ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed select-none'
                                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                                          }`}
                                          rows={4}
                                          disabled={submittedQuestions.has(`question-${question.id}`)}
                                          style={submittedQuestions.has(`question-${question.id}`) ? { userSelect: 'none', pointerEvents: 'none' } : {}}
                                        />
                                        {(() => {
                                          const buttonProps = getSubmitButtonProps(`question-${question.id}`)
                                          return (
                                            <button
                                              onClick={() => submitAnswer(`question-${question.id}`, question.flag || 'No expected answer')}
                                              disabled={buttonProps.disabled}
                                              className={`${buttonProps.className} h-fit`}
                                            >
                                              <Send className="w-4 h-4" />
                                              {buttonProps.text}
                                            </button>
                                          )
                                        })()}
                                      </div>
                                    </div>
                                  )}

                                  {question.type === 'multiple-choice' && question.multipleChoiceOptions && Array.isArray(question.multipleChoiceOptions) && (
                                    <div>
                                      <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Select your answer:
                                      </label>
                                      <div className="space-y-3 mb-4">
                                        {question.multipleChoiceOptions.map((option: string, optionIndex: number) => (
                                          <label key={optionIndex} className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                                            submittedQuestions.has(`question-${question.id}`)
                                              ? 'cursor-not-allowed bg-gray-50 dark:bg-gray-700'
                                              : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600'
                                          }`}>
                                            <input
                                              type="radio"
                                              name={`question-${question.id}`}
                                              value={option}
                                              checked={answers[`question-${question.id}`] === option}
                                              onChange={(e) => handleAnswerChange(`question-${question.id}`, e.target.value)}
                                              disabled={submittedQuestions.has(`question-${question.id}`)}
                                              className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                            />
                                            <span className={`text-base ${
                                              submittedQuestions.has(`question-${question.id}`)
                                                ? 'text-gray-500 dark:text-gray-400 select-none'
                                                : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                              {String.fromCharCode(65 + optionIndex)}) {String(option)}
                                            </span>
                                          </label>
                                        ))}
                                      </div>
                                      {(() => {
                                        const buttonProps = getSubmitButtonProps(`question-${question.id}`)
                                        return (
                                          <button
                                            onClick={() => submitAnswer(`question-${question.id}`, question.flag || question.multipleChoiceOptions[0])}
                                            disabled={buttonProps.disabled}
                                            className={buttonProps.className}
                                          >
                                            <Send className="w-4 h-4" />
                                            {buttonProps.text}
                                          </button>
                                        )
                                      })()}
                                    </div>
                                  )}
                                </div>

                                {question.type === 'flag' && (
                                  <div className="mt-4 text-base text-gray-600 dark:text-gray-400">
                                    <p>Expected format: <code className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-sm font-mono">flag{'{answer}'}</code></p>
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
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
              <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">No tasks provided yet.</p>
              <p className="text-gray-400 dark:text-gray-500 text-base mt-3">
                Tasks will be available when the lab is ready.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}
