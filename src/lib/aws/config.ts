import { 
  CloudWatchClient,
  CloudWatchClientConfig 
} from '@aws-sdk/client-cloudwatch'
import { EKSClient, EKSClientConfig } from '@aws-sdk/client-eks'
import { RDSClient, RDSClientConfig } from '@aws-sdk/client-rds'
import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3'
import { EC2Client, EC2ClientConfig } from '@aws-sdk/client-ec2'
import { 
  ElasticLoadBalancingV2Client,
  ElasticLoadBalancingV2ClientConfig 
} from '@aws-sdk/client-elastic-load-balancing-v2'

// AWS Configuration interface
export interface AWSConfig {
  region: string
  credentials?: {
    accessKeyId: string
    secretAccessKey: string
    sessionToken?: string
  }
}

// Environment-based AWS configuration
export const getAWSConfig = (): AWSConfig => {
  const config: AWSConfig = {
    region: process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || 'us-east-1'
  }

  // Only add credentials if running server-side
  if (typeof window === 'undefined') {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    const sessionToken = process.env.AWS_SESSION_TOKEN

    if (accessKeyId && secretAccessKey) {
      config.credentials = {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken && { sessionToken })
      }
    }
  }

  return config
}

// AWS Client factory
class AWSClientFactory {
  private static instance: AWSClientFactory
  private config: AWSConfig
  private clients: Map<string, any> = new Map()

  private constructor() {
    this.config = getAWSConfig()
  }

  public static getInstance(): AWSClientFactory {
    if (!AWSClientFactory.instance) {
      AWSClientFactory.instance = new AWSClientFactory()
    }
    return AWSClientFactory.instance
  }

  public getCloudWatchClient(): CloudWatchClient {
    if (!this.clients.has('cloudwatch')) {
      const clientConfig: CloudWatchClientConfig = {
        region: this.config.region,
        ...(this.config.credentials && { credentials: this.config.credentials })
      }
      this.clients.set('cloudwatch', new CloudWatchClient(clientConfig))
    }
    return this.clients.get('cloudwatch')
  }

  public getEKSClient(): EKSClient {
    if (!this.clients.has('eks')) {
      const clientConfig: EKSClientConfig = {
        region: this.config.region,
        ...(this.config.credentials && { credentials: this.config.credentials })
      }
      this.clients.set('eks', new EKSClient(clientConfig))
    }
    return this.clients.get('eks')
  }

  public getRDSClient(): RDSClient {
    if (!this.clients.has('rds')) {
      const clientConfig: RDSClientConfig = {
        region: this.config.region,
        ...(this.config.credentials && { credentials: this.config.credentials })
      }
      this.clients.set('rds', new RDSClient(clientConfig))
    }
    return this.clients.get('rds')
  }

  public getS3Client(): S3Client {
    if (!this.clients.has('s3')) {
      const clientConfig: S3ClientConfig = {
        region: this.config.region,
        ...(this.config.credentials && { credentials: this.config.credentials })
      }
      this.clients.set('s3', new S3Client(clientConfig))
    }
    return this.clients.get('s3')
  }

  public getEC2Client(): EC2Client {
    if (!this.clients.has('ec2')) {
      const clientConfig: EC2ClientConfig = {
        region: this.config.region,
        ...(this.config.credentials && { credentials: this.config.credentials })
      }
      this.clients.set('ec2', new EC2Client(clientConfig))
    }
    return this.clients.get('ec2')
  }

  public getELBV2Client(): ElasticLoadBalancingV2Client {
    if (!this.clients.has('elbv2')) {
      const clientConfig: ElasticLoadBalancingV2ClientConfig = {
        region: this.config.region,
        ...(this.config.credentials && { credentials: this.config.credentials })
      }
      this.clients.set('elbv2', new ElasticLoadBalancingV2Client(clientConfig))
    }
    return this.clients.get('elbv2')
  }

  public updateConfig(newConfig: Partial<AWSConfig>): void {
    this.config = { ...this.config, ...newConfig }
    // Clear existing clients to force recreation with new config
    this.clients.clear()
  }
}

// Export singleton instance methods
export const awsClients = AWSClientFactory.getInstance()

// Utility to check if AWS is configured
export const isAWSConfigured = (): boolean => {
  const config = getAWSConfig()
  return !!(config.region && config.credentials?.accessKeyId && config.credentials?.secretAccessKey)
}

// Environment variable validation
export const validateAWSEnvironment = (): { 
  isValid: boolean
  missingVars: string[]
  warnings: string[]
} => {
  const requiredVars = ['AWS_REGION']
  const optionalVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']
  
  const missingVars: string[] = []
  const warnings: string[] = []

  // Check required variables
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  })

  // Check optional but recommended variables
  optionalVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(`${varName} not set - will use IAM roles or default credentials`)
    }
  })

  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings
  }
}
