'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Square, Clock, Users, Monitor, Container, Code, Cpu } from 'lucide-react'
import { labAPI, Lab } from '@/lib/api/labs'
import { useApp } from '@/lib/hooks/use-app'

interface LabsListProps {
  moduleId?: number
  showCreateButton?: boolean
}

export default function LabsList({ moduleId, showCreateButton = false }: LabsListProps) {
  const { navigate, user } = useApp()
  const [labs, setLabs] = useState<Lab[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startingLab, setStartingLab] = useState<number | null>(null)

  const loadLabs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await labAPI.getLabs(moduleId)
      setLabs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load labs')
    } finally {
      setLoading(false)
    }
  }, [moduleId])

  useEffect(() => {
    loadLabs()
  }, [loadLabs])

  const handleStartLab = async (labId: number) => {
    try {
      setStartingLab(labId)
      
      // Navigate directly to lab view for content-based labs
      navigate('lab', { 
        labId: labId.toString(),
        moduleId: moduleId?.toString() || '1'
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open lab')
    } finally {
      setStartingLab(null)
    }
  }

  const getLabTypeIcon = () => {
    // Generic lab icon for content-based labs
    return <Monitor className="w-5 h-5" />
  }

  const getLabTypeColor = () => {
    // Generic color for all labs
    return 'bg-blue-100 text-blue-800'
  }

  // For now, assume admin permissions - will be replaced with real auth
  const canCreateLab = true

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-24 w-full"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Labs</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button 
                onClick={loadLabs}
                className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Labs</h2>
          <p className="text-gray-600 mt-1">
            {moduleId ? 'Module labs' : 'All available labs'}
          </p>
        </div>
        {showCreateButton && canCreateLab && (
          <button
            onClick={() => navigate('lab-creation')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Lab
          </button>
        )}
      </div>

      {labs.length === 0 ? (
        <div className="text-center py-12">
          <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Labs Available</h3>
          <p className="text-gray-600">
            {moduleId 
              ? 'No labs have been created for this module yet.'
              : 'No labs are available at the moment.'
            }
          </p>
          {canCreateLab && (
            <button
              onClick={() => navigate('lab-creation')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create First Lab
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {labs.map((lab) => (
            <div
              key={lab.id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${getLabTypeColor()}`}>
                      {getLabTypeIcon()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{lab.title}</h3>
                      {lab.module_title && (
                        <p className="text-sm text-gray-500">Module: {lab.module_title}</p>
                      )}
                    </div>
                  </div>
                  
                  {lab.description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">{lab.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {lab.points_possible > 0 && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {lab.points_possible} points
                      </div>
                    )}
                    {lab.estimated_minutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {lab.estimated_minutes} min
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${getLabTypeColor()}`}>
                        Lab Content
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleStartLab(lab.id)}
                    disabled={startingLab === lab.id}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors min-w-[120px] justify-center"
                  >
                    {startingLab === lab.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Start Lab
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => navigate('lab', { 
                      labId: lab.id.toString(),
                      moduleId: lab.module_id.toString()
                    })}
                    className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
