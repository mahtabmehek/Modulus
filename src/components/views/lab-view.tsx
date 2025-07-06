'use client'

import { useState } from 'react'
import { CheckCircle, Users, Monitor, ChevronUp, ChevronRight, Lightbulb, Award, X, Clock, AlertTriangle } from 'lucide-react'
import { useApp } from '@/lib/hooks/use-app'

export default function LabView() {
  const { navigate, appData, currentView, startLabSession, extendLabSession, endLabSession, getCurrentLabSession } = useApp()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submittedFlags, setSubmittedFlags] = useState<Record<string, string[]>>({}) // Track submitted flags per question
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployError, setDeployError] = useState('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set())

  // Get lab and module data from the URL/state
  const labId = currentView.params?.labId
  const moduleId = currentView.params?.moduleId
  
  const currentLab = appData.labs.find(lab => lab.id === labId)
  const currentModule = appData.modules.find(module => module.id === moduleId)
  const currentLabSession = getCurrentLabSession()

  // Initialize expanded sections based on lab tasks
  useState(() => {
    if (currentLab?.tasks) {
      const initialExpanded: Record<string, boolean> = {}
      currentLab.tasks.forEach((task, index) => {
        initialExpanded[task.id] = index === 0 // Expand first task by default
      })
      setExpandedSections(initialExpanded)
    }
  })

  if (!currentLab || !currentModule) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lab not found</h1>
          <button 
            onClick={() => navigate('dashboard')}
            className="text-red-400 hover:text-red-300"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const handleAccessMachine = () => {
    // Handle access user machine
    console.log('Accessing user machine...')
  }

  const handleDeployMachine = async () => {
    if (!currentLab) return
    
    try {
      setIsDeploying(true)
      setDeployError('')
      
      // Check if user already has a session for this lab
      if (currentLabSession && currentLabSession.labId === currentLab.id) {
        // Lab already deployed, do nothing
        return
      }
      
      // Start new lab session
      await startLabSession(currentLab.id)
    } catch (error) {
      setDeployError(error instanceof Error ? error.message : 'Failed to start lab session')
    } finally {
      setIsDeploying(false)
    }
  }

  const handleExtendAccess = () => {
    if (currentLabSession) {
      const success = extendLabSession(currentLabSession.id)
      if (!success) {
        setDeployError('Cannot extend access. Lab may have expired or already been extended.')
      }
    }
  }

  const handleEndLab = () => {
    if (currentLabSession) {
      endLabSession(currentLabSession.id)
    }
  }

  const handleSubmit = (questionId: string) => {
    const answer = answers[questionId]
    if (!answer || !answer.trim()) return

    console.log('Submitting answer for question:', questionId, 'Answer:', answer)
    
    const question = currentLab?.tasks
      .flatMap(task => task.questions)
      .find(q => q.id === questionId)
    
    if (!question) return

    // Handle flag questions
    if (question.type === 'flag') {
      const currentSubmitted = submittedFlags[questionId] || []
      
      // Check if this flag is correct
      let isCorrect = false
      if (Array.isArray(question.answer)) {
        isCorrect = question.answer.some(correctAnswer => 
          answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
        )
      } else {
        isCorrect = answer.toLowerCase().trim() === question.answer.toLowerCase().trim()
      }

      if (isCorrect && !currentSubmitted.includes(answer)) {
        const newSubmitted = [...currentSubmitted, answer]
        setSubmittedFlags(prev => ({
          ...prev,
          [questionId]: newSubmitted
        }))

        // Check if question is complete
        const expectedFlags = question.flagCount || 1
        if (newSubmitted.length >= expectedFlags) {
          setCompletedQuestions(prev => new Set(Array.from(prev).concat([questionId])))
        }
      }
    } else {
      // For non-flag questions, mark as completed if it has an answer
      setCompletedQuestions(prev => new Set(Array.from(prev).concat([questionId])))
    }
    
    // Clear the input after submission
    setAnswers(prev => ({
      ...prev,
      [questionId]: ''
    }))
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const isTaskCompleted = (task: any) => {
    if (!task.questions || task.questions.length === 0) return true
    
    const requiredQuestions = task.questions.filter((q: any) => q.isRequired !== false)
    if (requiredQuestions.length === 0) return true
    
    return requiredQuestions.every((q: any) => {
      if (q.type === 'flag' && q.flagCount && q.flagCount > 1) {
        // For multi-flag questions, check if all flags are submitted
        const submitted = submittedFlags[q.id] || []
        return submitted.length >= q.flagCount
      }
      return completedQuestions.has(q.id)
    })
  }

  const getTaskCompletionStatus = (task: any) => {
    if (!task.questions || task.questions.length === 0) return { completed: 0, total: 0 }
    
    const requiredQuestions = task.questions.filter((q: any) => q.isRequired !== false)
    const completed = requiredQuestions.filter((q: any) => {
      if (q.type === 'flag' && q.flagCount && q.flagCount > 1) {
        const submitted = submittedFlags[q.id] || []
        return submitted.length >= q.flagCount
      }
      return completedQuestions.has(q.id)
    }).length
    
    return { completed, total: requiredQuestions.length }
  }

  const toggleSection = (taskId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left Sidebar - Module Content */}
      <div className={`${isSidebarCollapsed ? 'w-16' : 'w-72'} bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && (
              <h3 className="text-foreground font-medium">Module Content</h3>
            )}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-0' : 'rotate-180'}`} />
              </button>
              {!isSidebarCollapsed && (
                <button 
                  onClick={() => navigate('module', { moduleId: currentModule.id })}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Close lab view"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-4">
          <div className="space-y-2">
            {currentLab.tasks?.map((task) => {
              const completionStatus = getTaskCompletionStatus(task)
              const isCompleted = isTaskCompleted(task)
              
              return (
                <div 
                  key={task.id} 
                  className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} ${isSidebarCollapsed ? 'p-2' : 'p-3'} rounded-lg transition-colors cursor-pointer ${
                    expandedSections[task.id]
                      ? 'bg-red-600 text-white' 
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => {
                    if (isSidebarCollapsed) {
                      setIsSidebarCollapsed(false)
                    }
                    toggleSection(task.id)
                  }}
                  title={isSidebarCollapsed ? `${task.title} (${completionStatus.completed}/${completionStatus.total})` : undefined}
                >
                  <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : 'space-x-3'}`}>
                    {isSidebarCollapsed ? (
                      <div className="w-8 h-8 flex items-center justify-center bg-muted rounded text-sm relative">
                        📋
                        {isCompleted && (
                          <CheckCircle className="w-3 h-3 text-green-500 absolute -top-1 -right-1" />
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">📋</span>
                          <div>
                            <span className="text-sm font-medium">{task.title}</span>
                            {completionStatus.total > 0 && (
                              <div className="text-xs opacity-75">
                                {completionStatus.completed}/{completionStatus.total} completed
                              </div>
                            )}
                          </div>
                        </div>
                        {isCompleted && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            }) || (
              <div className="text-center text-muted-foreground py-4">
                No tasks available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Breadcrumb */}
        <div className="bg-card border-b border-border px-6 py-4">
          <div className="text-sm text-muted-foreground flex items-center space-x-2">
            <button 
              onClick={() => navigate('dashboard')}
              className="hover:text-foreground transition-colors"
            >
              Dashboard
            </button>
            <span>{'>'}</span>
            <button 
              onClick={() => navigate('path', { pathId: currentModule.pathId })}
              className="hover:text-foreground transition-colors"
            >
              Learning Path
            </button>
            <span>{'>'}</span>
            <button 
              onClick={() => navigate('module', { moduleId: currentModule.id })}
              className="hover:text-foreground transition-colors"
            >
              {currentModule.title}
            </button>
            <span>{'>'}</span>
            <span className="text-foreground">{currentLab.title}</span>
          </div>
        </div>

        {/* Lab Header */}
        <div className="bg-card border-b border-border px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {currentLab.title}
              </h1>
              <p className="text-muted-foreground text-lg">
                {currentLab.description}
              </p>
            </div>
            
            <div className="flex items-center space-x-4 ml-6">
              <button 
                onClick={handleAccessMachine}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                <Users className="w-5 h-5" />
                <span>Access User Machine</span>
              </button>
              
              {/* Lab Machine Controls */}
              {!currentLabSession || currentLabSession.labId !== currentLab.id ? (
                <button 
                  onClick={handleDeployMachine}
                  disabled={isDeploying || !!currentLabSession}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  <Monitor className="w-5 h-5" />
                  <span>
                    {isDeploying ? 'Deploying...' : 
                     currentLabSession ? 'Lab Already Active' : 
                     'Deploy Lab Machine'}
                  </span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="bg-green-600 px-4 py-3 rounded-lg font-medium">
                    Lab Active - {currentLabSession.vmIP}
                  </span>
                  {currentLabSession.canExtend && (
                    <button 
                      onClick={handleExtendAccess}
                      className="bg-yellow-600 hover:bg-yellow-700 px-4 py-3 rounded-lg font-medium transition-colors"
                    >
                      Extend Access (+30min)
                    </button>
                  )}
                  <button 
                    onClick={handleEndLab}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    End Lab
                  </button>
                </div>
              )}
            </div>
            
            {/* Error Message */}
            {deployError && (
              <div className="mt-4 p-3 bg-red-600 bg-opacity-20 border border-red-500 rounded-lg">
                <p className="text-red-400 text-sm">{deployError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Lab Content */}
        <div className="flex-1 p-6 bg-background min-h-0">
          <div className="h-full">
            {/* Lab Session Info Panel */}
            {currentLabSession && currentLabSession.labId === currentLab.id && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="font-semibold text-blue-800 dark:text-blue-200">Lab Session Active</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        VM IP: {currentLabSession.vmIP} | 
                        Started: {(() => {
                          try {
                            const startTime = currentLabSession.startTime instanceof Date 
                              ? currentLabSession.startTime 
                              : new Date(currentLabSession.startTime);
                            return startTime.toLocaleTimeString();
                          } catch (e) {
                            return 'N/A';
                          }
                        })()} |
                        {currentLabSession.canExtend ? ' Can extend once' : ' No extensions available'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700 dark:text-blue-300">Session expires at</p>
                    <p className="font-semibold text-blue-800 dark:text-blue-200">
                      {currentLabSession.endTime instanceof Date 
                        ? currentLabSession.endTime.toLocaleTimeString()
                        : new Date(currentLabSession.endTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Lab Overview */}
            <div className="mb-6 bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Lab Overview</h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: currentLab.content || 'No content available.' }} />
              </div>
            </div>

            {/* Tasks Section */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {currentLab.tasks?.map((task, taskIndex) => (
                <div key={task.id}>
                  {/* Task Header */}
                  <div 
                    className="bg-muted/50 px-6 py-4 border-b border-border cursor-pointer"
                    onClick={() => toggleSection(task.id)}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-foreground flex items-center space-x-3">
                        <span>Task {taskIndex + 1}</span>
                        <span>{task.title}</span>
                        {isTaskCompleted(task) && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}

                      </h2>
                      <ChevronUp className={`w-5 h-5 text-muted-foreground transition-transform ${
                        expandedSections[task.id] ? 'rotate-0' : 'rotate-180'
                      }`} />
                    </div>
                  </div>

                  {/* Task Content */}
                  {expandedSections[task.id] && (
                    <div className="p-6 border-b border-border">
                      <div className="prose prose-gray dark:prose-invert max-w-none mb-6">
                        <p className="text-foreground leading-relaxed">
                          {task.content}
                        </p>
                      </div>

                      {/* Questions */}
                      {task.questions && task.questions.length > 0 && (
                        <div className="space-y-6">
                          {task.questions.map((question, questionIndex) => {
                            const isQuestionCompleted = completedQuestions.has(question.id)
                            const submittedFlagsForQuestion = submittedFlags[question.id] || []
                            const expectedFlags = question.flagCount || 1
                            
                            return (
                              <div 
                                key={question.id} 
                                className={`p-4 rounded-lg border transition-colors ${
                                  isQuestionCompleted 
                                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                                    : 'border-border bg-muted/30'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h3 className="font-medium text-foreground mb-2 flex items-center space-x-2">
                                      <span>Question {questionIndex + 1}</span>
                                      {question.type === 'flag' && (
                                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                                          {question.flagCount && question.flagCount > 1 
                                            ? `${submittedFlagsForQuestion.length}/${expectedFlags} flags`
                                            : 'FLAG'
                                          }
                                        </span>
                                      )}
                                      {isQuestionCompleted && (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      )}
                                    </h3>
                                    <p className="text-foreground">{question.text}</p>
                                    {question.hint && (
                                      <div className="mt-2 flex items-center space-x-2 text-sm text-muted-foreground">
                                        <Lightbulb className="w-4 h-4" />
                                        <span>{question.hint}</span>
                                      </div>
                                    )}
                                    
                                    {/* Show submitted flags for multi-flag questions */}
                                    {question.type === 'flag' && submittedFlagsForQuestion.length > 0 && (
                                      <div className="mt-3">
                                        <p className="text-sm font-medium text-foreground mb-2">Submitted flags:</p>
                                        <div className="flex flex-wrap gap-2">
                                          {submittedFlagsForQuestion.map((flag, index) => (
                                            <span 
                                              key={index}
                                              className="bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center space-x-1"
                                            >
                                              <CheckCircle className="w-3 h-3" />
                                              <span>{flag}</span>
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-4 text-right">
                                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                      {question.points} pts
                                    </span>
                                  </div>
                                </div>

                                {/* Question Input */}
                                {question.type === 'text' || question.type === 'flag' ? (
                                  <div className="flex space-x-3">
                                    <input
                                      type="text"
                                      value={answers[question.id] || ''}
                                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                      placeholder={question.type === 'flag' ? 'Enter flag...' : 'Enter your answer...'}
                                      className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                                      disabled={question.type === 'flag' && isQuestionCompleted && !question.acceptsPartialFlags}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSubmit(question.id)
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => handleSubmit(question.id)}
                                      disabled={!answers[question.id]?.trim() || (question.type === 'flag' && isQuestionCompleted && !question.acceptsPartialFlags)}
                                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-medium flex items-center space-x-2"
                                    >
                                      <span>Submit</span>
                                    </button>
                                  </div>
                                ) : question.type === 'file-upload' ? (
                                  <div className="space-y-3">
                                    <input
                                      type="file"
                                      className="block w-full text-sm text-foreground
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-red-50 file:text-red-700
                                        hover:file:bg-red-100
                                        dark:file:bg-red-900/50 dark:file:text-red-300"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                          handleAnswerChange(question.id, file.name)
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => handleSubmit(question.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                                    >
                                      Upload File
                                    </button>
                                  </div>
                                ) : question.type === 'multiple-choice' ? (
                                  <div className="space-y-3">
                                    {question.options?.map((option, optionIndex) => (
                                      <label 
                                        key={optionIndex}
                                        className="flex items-center space-x-3 cursor-pointer"
                                      >
                                        <input
                                          type="radio"
                                          name={question.id}
                                          value={option}
                                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                          className="text-red-600"
                                        />
                                        <span className="text-foreground">{option}</span>
                                      </label>
                                    ))}
                                    <button
                                      onClick={() => handleSubmit(question.id)}
                                      disabled={!answers[question.id]}
                                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-medium mt-3"
                                    >
                                      Submit Answer
                                    </button>
                                  </div>
                                ) : null}
                                
                                <div className="mt-2 text-sm text-muted-foreground">
                                  {question.isRequired !== false && <span className="text-red-500">*Required</span>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* No questions message */}
                      {(!task.questions || task.questions.length === 0) && (
                        <div className="text-center py-8">
                          <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <h4 className="text-green-800 dark:text-green-200 font-medium mb-2">Task Information</h4>
                            <p className="text-green-700 dark:text-green-300 text-sm">
                              This section is for informational purposes. No submission required.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )) || (
                <div className="p-6 text-center text-muted-foreground">
                  No tasks available for this lab.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
