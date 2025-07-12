import { useState, useEffect, useCallback, useRef } from 'react'
import { awsMetricsService, AWSResourceConfig, AlertData } from '../aws/metrics'
import { SystemMetrics, InfrastructureHealth } from '../aws/cloudwatch'
import { isAWSConfigured, validateAWSEnvironment } from '../aws/config'

export interface UseAWSMetricsOptions {
  refreshInterval?: number // in milliseconds
  enableRealtime?: boolean
  retryOnError?: boolean
  maxRetries?: number
}

export interface AWSMetricsState {
  systemMetrics: SystemMetrics | null
  infrastructureHealth: InfrastructureHealth | null
  alerts: AlertData[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  isConfigured: boolean
  configValidation: {
    isValid: boolean
    missingVars: string[]
    warnings: string[]
  }
}

export interface UseAWSMetricsReturn extends AWSMetricsState {
  refreshMetrics: () => Promise<void>
  clearError: () => void
  updateConfig: (config: Partial<AWSResourceConfig>) => void
}

const DEFAULT_OPTIONS: Required<UseAWSMetricsOptions> = {
  refreshInterval: 30000, // 30 seconds
  enableRealtime: true,
  retryOnError: true,
  maxRetries: 3
}

export function useAWSMetrics(options: UseAWSMetricsOptions = {}): UseAWSMetricsReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const [state, setState] = useState<AWSMetricsState>({
    systemMetrics: null,
    infrastructureHealth: null,
    alerts: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
    isConfigured: isAWSConfigured(),
    configValidation: validateAWSEnvironment()
  })

  const retryCountRef = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const updateState = useCallback((updates: Partial<AWSMetricsState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const clearError = useCallback(() => {
    updateState({ error: null })
    retryCountRef.current = 0
  }, [updateState])

  const fetchMetrics = useCallback(async (): Promise<void> => {
    try {
      updateState({ isLoading: true, error: null })

      // Check if AWS is configured
      if (!state.isConfigured) {
        throw new Error('AWS is not properly configured. Please check your environment variables.')
      }

      // Fetch all metrics in parallel
      const [systemMetrics, infrastructureHealth, alerts] = await Promise.all([
        awsMetricsService.getSystemMetrics(),
        awsMetricsService.getInfrastructureHealth(),
        awsMetricsService.getRealtimeAlerts()
      ])

      updateState({
        systemMetrics,
        infrastructureHealth,
        alerts,
        lastUpdated: new Date(),
        isLoading: false,
        error: null
      })

      retryCountRef.current = 0
    } catch (error) {
      console.error('Error fetching AWS metrics:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Retry logic
      if (opts.retryOnError && retryCountRef.current < opts.maxRetries) {
        retryCountRef.current++
        console.log(`Retrying AWS metrics fetch (attempt ${retryCountRef.current}/${opts.maxRetries})`)
        
        // Exponential backoff
        const delay = Math.pow(2, retryCountRef.current) * 1000
        setTimeout(() => fetchMetrics(), delay)
        
        updateState({ 
          isLoading: false,
          error: `Retrying... (${retryCountRef.current}/${opts.maxRetries}): ${errorMessage}`
        })
      } else {
        updateState({
          isLoading: false,
          error: `Failed to fetch metrics: ${errorMessage}`
        })
      }
    }
  }, [state.isConfigured, opts.retryOnError, opts.maxRetries, updateState])

  const refreshMetrics = useCallback(async (): Promise<void> => {
    await fetchMetrics()
  }, [fetchMetrics])

  const updateConfig = useCallback((config: Partial<AWSResourceConfig>) => {
    // This would update the AWS configuration
    console.log('Updating AWS configuration:', config)
    
    // Refresh configuration validation
    const newValidation = validateAWSEnvironment()
    const newIsConfigured = isAWSConfigured()
    
    updateState({
      isConfigured: newIsConfigured,
      configValidation: newValidation
    })

    // If configuration is now valid, fetch metrics
    if (newIsConfigured && !state.isConfigured) {
      fetchMetrics()
    }
  }, [state.isConfigured, updateState, fetchMetrics])

  // Initial fetch and setup interval
  useEffect(() => {
    if (state.isConfigured) {
      fetchMetrics()

      if (opts.enableRealtime && opts.refreshInterval > 0) {
        intervalRef.current = setInterval(fetchMetrics, opts.refreshInterval)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [state.isConfigured, opts.enableRealtime, opts.refreshInterval, fetchMetrics])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    ...state,
    refreshMetrics,
    clearError,
    updateConfig
  }
}

// Hook for specific metric types
export function useAWSSystemMetrics(options?: UseAWSMetricsOptions) {
  const { systemMetrics, isLoading, error, refreshMetrics, clearError } = useAWSMetrics(options)
  
  return {
    metrics: systemMetrics,
    isLoading,
    error,
    refresh: refreshMetrics,
    clearError
  }
}

export function useAWSInfrastructureHealth(options?: UseAWSMetricsOptions) {
  const { infrastructureHealth, isLoading, error, refreshMetrics, clearError } = useAWSMetrics(options)
  
  return {
    health: infrastructureHealth,
    isLoading,
    error,
    refresh: refreshMetrics,
    clearError
  }
}

export function useAWSAlerts(options?: UseAWSMetricsOptions) {
  const { alerts, isLoading, error, refreshMetrics, clearError } = useAWSMetrics(options)
  
  return {
    alerts,
    isLoading,
    error,
    refresh: refreshMetrics,
  }
}
