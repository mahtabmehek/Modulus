'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronRight, X, Monitor, AlertTriangle } from 'lucide-react'
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
        const lab = await labAPI.getLab(parseInt(labId))
        setCurrentLab(lab)
        setCurrentModule({
          id: lab.module_id,
          title: lab.module_title,
          pathId: 'default-path' // This should come from the API later
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lab')
      } finally {
        setLoading(false)
      }
    }

    fetchLabData()
  }, [labId])

  // Initialize expanded sections - simplified for content-only labs
  useEffect(() => {
    // For now, we'll create a simple expanded state
    // Later this can be enhanced when we add interactive tasks
    setExpandedSections({ content: true })
  }, [currentLab])

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

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading lab...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Lab</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => navigate('dashboard')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center max-w-md">
          <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Lab Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested lab could not be found.</p>
          <button
            onClick={() => navigate('dashboard')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
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
            {/* Simple lab content navigation */}
            <div 
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} ${isSidebarCollapsed ? 'p-2' : 'p-3'} rounded-lg transition-colors cursor-pointer ${
                expandedSections.content
                  ? 'bg-red-600 text-white' 
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                if (isSidebarCollapsed) {
                  setIsSidebarCollapsed(false)
                }
                toggleSection('content')
              }}
              title={isSidebarCollapsed ? 'Lab Instructions' : undefined}
            >
              <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : 'space-x-3'}`}>
                {isSidebarCollapsed ? (
                  <div className="w-8 h-8 flex items-center justify-center bg-muted rounded text-sm">
                    📋
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">📋</span>
                      <div>
                        <span className="text-sm font-medium">Lab Instructions</span>
                        <div className="text-xs opacity-75">
                          {currentLab.estimated_minutes} min • {currentLab.points_possible} points
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
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
              {/* Lab Machine Controls */}
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-2">Lab Virtual Machine</p>
                <p className="text-muted-foreground text-xs">VM deployment functionality will be added here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lab Content */}
        <div className="flex-1 p-6 bg-background min-h-0">
          <div className="h-full">
            {/* Lab Content */}
            <div className="mb-6 bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Lab Overview</h2>
              {currentLab.description && (
                <div className="mb-4">
                  <h3 className="font-medium text-foreground mb-2">Description</h3>
                  <p className="text-muted-foreground">{currentLab.description}</p>
                </div>
              )}
            </div>

            {/* Lab Instructions */}
            {expandedSections.content && (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="bg-muted/50 px-6 py-4 border-b border-border cursor-pointer"
                     onClick={() => toggleSection('content')}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground flex items-center space-x-3">
                      <span>Instructions</span>
                    </h2>
                    <ChevronUp className={`w-5 h-5 text-muted-foreground transition-transform ${
                      expandedSections.content ? 'rotate-180' : ''
                    }`} />
                  </div>
                </div>

                <div className="p-6">
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    {currentLab.instructions ? (
                      <div className="whitespace-pre-wrap">{currentLab.instructions}</div>
                    ) : (
                      <p className="text-muted-foreground italic">No instructions provided yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
