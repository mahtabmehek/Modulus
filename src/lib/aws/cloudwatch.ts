import { 
  GetMetricStatisticsCommand,
  GetMetricStatisticsCommandInput,
  GetMetricStatisticsCommandOutput,
  ListMetricsCommand,
  ListMetricsCommandInput,
  Dimension,
  Statistic
} from '@aws-sdk/client-cloudwatch'
import { awsClients } from './config'

export interface MetricQuery {
  namespace: string
  metricName: string
  dimensions?: Dimension[]
  statistic: Statistic
  period: number // in seconds
  startTime: Date
  endTime: Date
}

export interface MetricDataPoint {
  timestamp: Date
  value: number
  unit: string
}

export interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalInstructors: number
  activeDesktops: number
  totalLabs: number
  completedLabSessions: number
  systemUptime: string
  securityAlerts: number
  avgSessionTime: string
  storageUsed: string
  totalStorage: string
  cpuUtilization: number
  memoryUtilization: number
  networkIn: number
  networkOut: number
  diskUtilization: number
}

export interface InfrastructureHealth {
  webServers: ServiceHealth
  database: ServiceHealth
  kubernetes: ServiceHealth
  loadBalancer: ServiceHealth
  containerRegistry: ServiceHealth
  fileStorage: ServiceHealth
}

export interface ServiceHealth {
  name: string
  status: 'healthy' | 'warning' | 'critical'
  uptime: string
  instances: number
  lastCheck: Date
  metrics?: {
    cpuUsage?: number
    memoryUsage?: number
    errorRate?: number
    latency?: number
  }
}

class CloudWatchService {
  private cloudWatch = awsClients.getCloudWatchClient()

  /**
   * Get a single metric from CloudWatch
   */
  async getMetric(query: MetricQuery): Promise<MetricDataPoint[]> {
    try {
      const params: GetMetricStatisticsCommandInput = {
        Namespace: query.namespace,
        MetricName: query.metricName,
        Dimensions: query.dimensions,
        StartTime: query.startTime,
        EndTime: query.endTime,
        Period: query.period,
        Statistics: [query.statistic]
      }

      const command = new GetMetricStatisticsCommand(params)
      const response: GetMetricStatisticsCommandOutput = await this.cloudWatch.send(command)

      return (response.Datapoints || []).map(datapoint => ({
        timestamp: datapoint.Timestamp!,
        value: datapoint[query.statistic] || 0,
        unit: datapoint.Unit || ''
      }))
    } catch (error) {
      console.error('Error fetching CloudWatch metric:', error)
      return []
    }
  }

  /**
   * Get multiple metrics in parallel
   */
  async getMetrics(queries: MetricQuery[]): Promise<Map<string, MetricDataPoint[]>> {
    const results = new Map<string, MetricDataPoint[]>()
    
    try {
      const promises = queries.map(async (query) => {
        const key = `${query.namespace}:${query.metricName}`
        const data = await this.getMetric(query)
        return { key, data }
      })

      const responses = await Promise.all(promises)
      responses.forEach(({ key, data }) => {
        results.set(key, data)
      })
    } catch (error) {
      console.error('Error fetching multiple metrics:', error)
    }

    return results
  }

  /**
   * Get EKS cluster metrics
   */
  async getEKSMetrics(clusterName: string): Promise<{
    nodeCount: number
    podCount: number
    cpuUtilization: number
    memoryUtilization: number
    failedPods: number
  }> {
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 5 * 60 * 1000) // Last 5 minutes

    try {
      const queries: MetricQuery[] = [
        {
          namespace: 'AWS/EKS',
          metricName: 'cluster_node_count',
          dimensions: [{ Name: 'ClusterName', Value: clusterName }],
          statistic: 'Average',
          period: 300,
          startTime,
          endTime
        },
        {
          namespace: 'ContainerInsights',
          metricName: 'pod_cpu_utilization',
          dimensions: [
            { Name: 'ClusterName', Value: clusterName },
            { Name: 'Namespace', Value: 'modulus-system' }
          ],
          statistic: 'Average',
          period: 300,
          startTime,
          endTime
        },
        {
          namespace: 'ContainerInsights',
          metricName: 'pod_memory_utilization',
          dimensions: [
            { Name: 'ClusterName', Value: clusterName },
            { Name: 'Namespace', Value: 'modulus-system' }
          ],
          statistic: 'Average',
          period: 300,
          startTime,
          endTime
        }
      ]

      const metrics = await this.getMetrics(queries)
      
      // Extract latest values
      const getLatestValue = (key: string): number => {
        const data = metrics.get(key) || []
        return data.length > 0 ? data[data.length - 1].value : 0
      }

      return {
        nodeCount: getLatestValue('AWS/EKS:cluster_node_count'),
        podCount: getLatestValue('ContainerInsights:pod_count') || 0,
        cpuUtilization: getLatestValue('ContainerInsights:pod_cpu_utilization'),
        memoryUtilization: getLatestValue('ContainerInsights:pod_memory_utilization'),
        failedPods: getLatestValue('ContainerInsights:pod_number_of_container_restarts') || 0
      }
    } catch (error) {
      console.error('Error fetching EKS metrics:', error)
      return {
        nodeCount: 0,
        podCount: 0,
        cpuUtilization: 0,
        memoryUtilization: 0,
        failedPods: 0
      }
    }
  }

  /**
   * Get RDS metrics
   */
  async getRDSMetrics(dbInstanceIdentifier: string): Promise<{
    cpuUtilization: number
    databaseConnections: number
    readLatency: number
    writeLatency: number
    freeStorageSpace: number
  }> {
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 5 * 60 * 1000)

    try {
      const queries: MetricQuery[] = [
        {
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          dimensions: [{ Name: 'DBInstanceIdentifier', Value: dbInstanceIdentifier }],
          statistic: 'Average',
          period: 300,
          startTime,
          endTime
        },
        {
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          dimensions: [{ Name: 'DBInstanceIdentifier', Value: dbInstanceIdentifier }],
          statistic: 'Average',
          period: 300,
          startTime,
          endTime
        },
        {
          namespace: 'AWS/RDS',
          metricName: 'ReadLatency',
          dimensions: [{ Name: 'DBInstanceIdentifier', Value: dbInstanceIdentifier }],
          statistic: 'Average',
          period: 300,
          startTime,
          endTime
        },
        {
          namespace: 'AWS/RDS',
          metricName: 'WriteLatency',
          dimensions: [{ Name: 'DBInstanceIdentifier', Value: dbInstanceIdentifier }],
          statistic: 'Average',
          period: 300,
          startTime,
          endTime
        },
        {
          namespace: 'AWS/RDS',
          metricName: 'FreeStorageSpace',
          dimensions: [{ Name: 'DBInstanceIdentifier', Value: dbInstanceIdentifier }],
          statistic: 'Average',
          period: 300,
          startTime,
          endTime
        }
      ]

      const metrics = await this.getMetrics(queries)
      
      const getLatestValue = (key: string): number => {
        const data = metrics.get(key) || []
        return data.length > 0 ? data[data.length - 1].value : 0
      }

      return {
        cpuUtilization: getLatestValue('AWS/RDS:CPUUtilization'),
        databaseConnections: getLatestValue('AWS/RDS:DatabaseConnections'),
        readLatency: getLatestValue('AWS/RDS:ReadLatency'),
        writeLatency: getLatestValue('AWS/RDS:WriteLatency'),
        freeStorageSpace: getLatestValue('AWS/RDS:FreeStorageSpace')
      }
    } catch (error) {
      console.error('Error fetching RDS metrics:', error)
      return {
        cpuUtilization: 0,
        databaseConnections: 0,
        readLatency: 0,
        writeLatency: 0,
        freeStorageSpace: 0
      }
    }
  }

  /**
   * Get Application Load Balancer metrics
   */
  async getALBMetrics(loadBalancerName: string): Promise<{
    requestCount: number
    targetResponseTime: number
    httpCodeTarget2XX: number
    httpCodeTarget4XX: number
    httpCodeTarget5XX: number
    activeConnectionCount: number
  }> {
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 5 * 60 * 1000)

    try {
      const queries: MetricQuery[] = [
        {
          namespace: 'AWS/ApplicationELB',
          metricName: 'RequestCount',
          dimensions: [{ Name: 'LoadBalancer', Value: loadBalancerName }],
          statistic: 'Sum',
          period: 300,
          startTime,
          endTime
        },
        {
          namespace: 'AWS/ApplicationELB',
          metricName: 'TargetResponseTime',
          dimensions: [{ Name: 'LoadBalancer', Value: loadBalancerName }],
          statistic: 'Average',
          period: 300,
          startTime,
          endTime
        },
        {
          namespace: 'AWS/ApplicationELB',
          metricName: 'HTTPCode_Target_2XX_Count',
          dimensions: [{ Name: 'LoadBalancer', Value: loadBalancerName }],
          statistic: 'Sum',
          period: 300,
          startTime,
          endTime
        },
        {
          namespace: 'AWS/ApplicationELB',
          metricName: 'HTTPCode_Target_4XX_Count',
          dimensions: [{ Name: 'LoadBalancer', Value: loadBalancerName }],
          statistic: 'Sum',
          period: 300,
          startTime,
          endTime
        },
        {
          namespace: 'AWS/ApplicationELB',
          metricName: 'HTTPCode_Target_5XX_Count',
          dimensions: [{ Name: 'LoadBalancer', Value: loadBalancerName }],
          statistic: 'Sum',
          period: 300,
          startTime,
          endTime
        }
      ]

      const metrics = await this.getMetrics(queries)
      
      const getLatestValue = (key: string): number => {
        const data = metrics.get(key) || []
        return data.length > 0 ? data[data.length - 1].value : 0
      }

      return {
        requestCount: getLatestValue('AWS/ApplicationELB:RequestCount'),
        targetResponseTime: getLatestValue('AWS/ApplicationELB:TargetResponseTime'),
        httpCodeTarget2XX: getLatestValue('AWS/ApplicationELB:HTTPCode_Target_2XX_Count'),
        httpCodeTarget4XX: getLatestValue('AWS/ApplicationELB:HTTPCode_Target_4XX_Count'),
        httpCodeTarget5XX: getLatestValue('AWS/ApplicationELB:HTTPCode_Target_5XX_Count'),
        activeConnectionCount: getLatestValue('AWS/ApplicationELB:ActiveConnectionCount') || 0
      }
    } catch (error) {
      console.error('Error fetching ALB metrics:', error)
      return {
        requestCount: 0,
        targetResponseTime: 0,
        httpCodeTarget2XX: 0,
        httpCodeTarget4XX: 0,
        httpCodeTarget5XX: 0,
        activeConnectionCount: 0
      }
    }
  }
}

export const cloudWatchService = new CloudWatchService()
