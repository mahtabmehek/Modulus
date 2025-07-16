# Modulus LMS - Complete Project Documentation
*Generated: July 16, 2025 - Comprehensive Technical Reference*

## 📋 **Project Overview**

### **System Architecture**
- **Project Name**: Modulus LMS (Learning Management System)
- **Repository**: mahtabmehek/Modulus (GitHub)
- **Branch**: master
- **Environment**: Development workspace at `c:\Users\mahta\Desktop\Modulus\Main`

### **Technology Stack**
- **Frontend**: Next.js 15.3.4 with TypeScript
- **Backend**: AWS Lambda (Node.js 18.x runtime)
- **Database**: AWS RDS Aurora (MySQL-compatible)
- **API**: AWS API Gateway
- **Authentication**: Custom JWT system (Cognito migration planned)
- **Monitoring**: AWS CloudWatch
- **Deployment**: AWS (eu-west-2 region)

---

## 🔧 **Infrastructure Details**

### **AWS Resources**
```
Account ID: 376129881409
Region: eu-west-2 (London)
User: modulus-github
```

#### **Lambda Configuration**
- **Function Name**: modulus-backend
- **Runtime**: Node.js 18.x (nodejs:18.v76)
- **Memory**: 1128 MB allocated
- **Typical Usage**: 109-111 MB (~10% utilization)
- **Performance**: 59-632ms response times
- **Timeout**: Standard Lambda limits
- **Log Group**: `/aws/lambda/modulus-backend`

#### **API Gateway**
- **API Name**: modulus-api
- **Type**: REST API
- **Endpoints**: CRUD operations for user/course management
- **Integration**: Lambda proxy integration
- **CORS**: Configured for frontend access

#### **RDS Database**
- **Engine**: Aurora MySQL-compatible
- **Cluster**: modulus-cluster
- **Instance**: modulus-instance
- **Connection**: Via RDS Data API
- **Tables**: Users, Courses, Enrollments, etc.

#### **CloudWatch Monitoring**
- **Log Retention**: Standard CloudWatch settings
- **Metrics**: Lambda duration, memory, error rates
- **Alerts**: Not currently configured

---

## 💻 **Frontend Details**

### **Next.js Application**
```
Framework: Next.js 15.3.4
Language: TypeScript
Port: localhost:3000
Build System: npm
```

#### **Key Components**
- **Staff Dashboard** (`staff-dashboard.tsx`):
  - User management interface
  - Course code assignment system
  - CRUD operations for user data
  - Fixed useEffect for proper data loading
  - Replaced department field with course code dropdown

#### **API Integration**
- **Base URL**: Production AWS API Gateway endpoint
- **Authentication**: JWT token-based
- **Client**: Custom API client for backend communication
- **Error Handling**: Implemented for failed requests

#### **Development Server**
- **Command**: `npm run dev`
- **Status**: Available as VS Code task
- **Background Process**: Can run continuously

---

## 🛠 **Development Environment**

### **Workspace Structure**
```
Main/
├── src/
│   ├── components/
│   │   └── staff-dashboard.tsx
│   ├── api/
│   └── pages/
├── monitoring scripts/
│   ├── modulus-monitor-simple.ps1
│   ├── modulus-monitor-stream.ps1
│   ├── modulus-monitor-robust.ps1
│   ├── aws-setup-fixed.ps1
│   └── current-status.ps1
├── deployment scripts/
├── package.json
└── configuration files
```

### **AWS CLI Configuration**
- **Credentials**: Configured for modulus-github user
- **Region**: eu-west-2
- **Status**: Active and functional
- **Permissions**: Full access to Lambda, API Gateway, RDS, CloudWatch

---

## 📊 **Monitoring System**

### **PowerShell Monitoring Scripts**

#### **modulus-monitor-simple.ps1**
- **Purpose**: Basic log monitoring with JSON parsing
- **Status**: Functional but encounters JSON truncation
- **Features**: Error detection, color-coded output
- **Issue**: Large responses cause parsing errors

#### **modulus-monitor-stream.ps1**
- **Purpose**: Stream-based monitoring with text output
- **Status**: Working with timestamp conversion issues
- **Features**: Real-time log streaming, performance metrics
- **Improvements**: Better error handling

#### **modulus-monitor-robust.ps1**
- **Purpose**: Enhanced monitoring with temporary file handling
- **Status**: Created but still has JSON issues
- **Features**: File-based processing, comprehensive logging

#### **aws-setup-fixed.ps1**
- **Purpose**: AWS connectivity testing and setup
- **Status**: Fully functional
- **Features**: Connection validation, service testing

### **Monitoring Capabilities**
- **Real-time Log Streaming**: 20-30 second intervals
- **Performance Tracking**: Duration, memory usage
- **Error Detection**: Automatic highlighting of issues
- **Request Tracking**: START/END lifecycle monitoring
- **Color-Coded Output**: Visual categorization
- **Background Processing**: Continuous monitoring

---

## 🔍 **Current System Status**

### **Backend Health (Last Verified: July 16, 2025)**
```
✅ Status: ACTIVE
✅ Lambda Functions: RUNNING
✅ Performance: 59-632ms response times
✅ Memory Usage: 109-111MB / 1128MB (10% utilization)
✅ Error Rate: 0%
✅ Concurrent Processing: Multiple requests handled
✅ Database: Connected and responsive
✅ API Gateway: Operational
```

### **Recent Activity Patterns**
- **Request Lifecycle**: START → INFO → END → REPORT
- **Typical Duration**: 59.04ms - 632.65ms
- **Memory Efficiency**: Consistent 10% usage
- **Error Rate**: Zero errors detected
- **Throughput**: Multiple concurrent Lambda executions

### **Log Examples**
```
START RequestId: 95ab77d8-edbe-403a-9f06-49643f039f7b
INFO: Lambda Event received
END RequestId: 95ab77d8-edbe-403a-9f06-49643f039f7b
REPORT: Duration: 59.04 ms, Memory: 110 MB
```

---

## 🚀 **Deployment Information**

### **Backend Deployment**
- **Method**: AWS Lambda deployment
- **Trigger**: API Gateway integration
- **Environment**: Production-ready
- **Scaling**: Automatic Lambda scaling
- **Availability**: Multi-AZ through Aurora

### **Frontend Deployment**
- **Development**: localhost:3000
- **Production**: Not currently deployed
- **Build Process**: Next.js build system
- **Static Assets**: Standard Next.js optimization

---

## 🔧 **Known Issues & Solutions**

### **Monitoring Issues**
1. **JSON Parsing Errors**
   - **Cause**: Large CloudWatch responses exceed PowerShell parsing limits
   - **Workaround**: Use text output instead of JSON
   - **Status**: Partially resolved with stream monitor

2. **Timestamp Conversion**
   - **Cause**: AWS timestamps too large for Int64
   - **Workaround**: Use try-catch with fallback times
   - **Status**: Managed in current scripts

### **Resolved Issues**
1. **Staff Dashboard CRUD** ✅
   - **Problem**: User data not loading properly
   - **Solution**: Fixed useEffect implementation
   - **Status**: Fully resolved

2. **Course Code Assignment** ✅
   - **Problem**: Department field needed replacement
   - **Solution**: Implemented course code dropdown
   - **Status**: Fully implemented

---

## 📝 **Configuration Details**

### **Environment Variables**
- **AWS Region**: eu-west-2
- **Database**: Aurora cluster connection string
- **API Gateway**: Production endpoint URL
- **Authentication**: JWT secret configuration

### **Dependencies**
```json
{
  "next": "15.3.4",
  "typescript": "latest",
  "aws-sdk": "current",
  "mysql2": "current"
}
```

### **Scripts Available**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

---

## 🔮 **Future Improvements**

### **Planned Enhancements**
1. **Cognito Migration**
   - Replace custom JWT with AWS Cognito
   - Improve authentication security
   - Add social login options

2. **Enhanced Monitoring**
   - CloudWatch dashboards
   - Automated alerting
   - Performance metrics

3. **Production Frontend**
   - S3/CloudFront deployment
   - CI/CD pipeline
   - Environment-specific configs

### **Monitoring Improvements**
1. **Robust JSON Parsing**
   - Implement streaming JSON parser
   - Handle large responses properly
   - Add pagination support

2. **Advanced Analytics**
   - Request performance trends
   - Error rate tracking
   - Capacity planning metrics

---

## 📞 **Support Information**

### **Key Contacts**
- **Developer**: GitHub user workspace
- **AWS Account**: 376129881409
- **Repository**: mahtabmehek/Modulus

### **Troubleshooting**
1. **Backend Issues**: Check CloudWatch logs
2. **Frontend Issues**: Check browser console and Next.js logs
3. **Database Issues**: Verify RDS connectivity
4. **Monitoring Issues**: Use aws-setup-fixed.ps1 for diagnostics

### **Quick Commands**
```powershell
# Test AWS connectivity
.\aws-setup-fixed.ps1

# Start monitoring
.\modulus-monitor-simple.ps1

# Check current status
.\current-status.ps1

# Start development server
npm run dev
```

---

## 📚 **Documentation Status**

**Last Updated**: July 16, 2025  
**Document Version**: 1.0  
**Accuracy**: Verified against live system  
**Next Review**: When significant changes occur

**Note**: This document should be updated whenever:
- New AWS resources are added
- Monitoring scripts are modified
- Frontend components are changed
- Deployment processes are updated
- Performance characteristics change

---

*This documentation provides a complete reference for the Modulus LMS project, including all technical details, configurations, and operational procedures discovered and implemented during development.*
