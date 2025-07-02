'use client'

import { useState } from 'react'
import { Play, Clock, Users, Award, Star, ChevronRight, Monitor, FileText, ExternalLink, Lightbulb, Target, Shield, Search } from 'lucide-react'
import { useApp } from '@/lib/hooks/use-app'

export default function LabView() {
  const { navigate } = useApp()
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // Mock lab data - in real app would come from props or API
  const lab = {
    id: 'lab-network-security',
    title: 'Network Security Fundamentals',
    description: 'Learn the basics of network security through hands-on exercises including port scanning, vulnerability assessment, and network monitoring.',
    difficulty: 'Medium',
    duration: '2-3 hours',
    participants: 1247,
    rating: 4.8,
    objectives: [
      'Understand network scanning techniques',
      'Identify common network vulnerabilities', 
      'Learn basic penetration testing methodology',
      'Practice using security tools like Nmap'
    ],
    tags: ['Network Security', 'Penetration Testing', 'Nmap', 'Vulnerability Assessment'],
    tasks: [
      {
        id: 'task-1',
        title: 'Network Discovery',
        content: 'Use Nmap to discover hosts and services on the target network.',
        completed: false,
        questions: [
          {
            id: 'q1',
            text: 'How many hosts are discovered on the network?',
            type: 'text' as const,
            answer: '5',
            points: 20
          }
        ]
      },
      {
        id: 'task-2', 
        title: 'Vulnerability Assessment',
        content: 'Analyze the discovered services for potential vulnerabilities.',
        completed: false,
        questions: [
          {
            id: 'q2',
            text: 'What is the version of the SSH service running?',
            type: 'text' as const,
            answer: 'OpenSSH 7.4',
            points: 25
          }
        ]
      }
    ],
    resources: [
      {
        id: 'r1',
        name: 'Network Security Guide',
        type: 'pdf' as const,
        url: '/resources/network-security-guide.pdf',
        description: 'Comprehensive guide to network security fundamentals'
      },
      {
        id: 'r2',
        name: 'Nmap Reference',
        type: 'link' as const,
        url: 'https://nmap.org/book/man.html',
        description: 'Official Nmap documentation'
      }
    ],
    hint: 'Start with a basic Nmap scan to discover live hosts'
  }

  const handleStartDesktop = () => {
    navigate('desktop', { labId: lab.id })
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
      case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300'
      case 'Hard': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('dashboard')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← Back to Dashboard
              </button>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Labs {' > '} Network Security {' > '} {lab.title}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lab Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {lab.title}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {lab.description}
                  </p>
                </div>
                <button
                  onClick={handleStartDesktop}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <Monitor className="w-5 h-5" />
                  <span>Start Desktop</span>
                </button>
              </div>

              {/* Lab Stats */}
              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(lab.difficulty)}`}>
                    {lab.difficulty}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{lab.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{lab.participants.toLocaleString()} participants</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{lab.rating}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {lab.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Learning Objectives
              </h2>
              <ul className="space-y-2">
                {lab.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tasks */}
            <div className="space-y-4">
              {lab.tasks.map((task, index) => (
                <div key={task.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      {task.title}
                    </h3>
                    {task.completed && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <Award className="w-5 h-5" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {task.content}
                  </p>

                  {/* Questions */}
                  <div className="space-y-4">
                    {task.questions.map((question) => (
                      <div key={question.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {question.text}
                          </h4>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {question.points} points
                          </span>
                        </div>
                        
                        <input
                          type="text"
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder="Enter your answer..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        
                        <div className="flex items-center justify-between mt-3">
                          <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center space-x-1">
                            <Lightbulb className="w-4 h-4" />
                            <span>Need a hint?</span>
                          </button>
                          
                          <div className="flex items-center space-x-2">
                            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                              Skip
                            </button>
                            <button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                              <Award className="w-4 h-4" />
                              <span>Submit</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Progress
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Overall</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">25%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full w-1/4"></div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tasks completed</span>
                    <span className="font-medium">1/4</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Points earned</span>
                    <span className="font-medium">20/100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time spent</span>
                    <span className="font-medium">45 min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Resources
              </h3>
              <div className="space-y-3">
                {lab.resources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {resource.type === 'pdf' ? (
                        <FileText className="w-5 h-5 text-red-600" />
                      ) : (
                        <ExternalLink className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {resource.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {resource.description}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Hint */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-200 text-sm">
                    Lab Hint
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                    {lab.hint}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
