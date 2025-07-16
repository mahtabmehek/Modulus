# Modulus LMS - Cognito Migration Strategy
*Strategic Plan for Authentication System Migration*

## 🎯 **Migration Overview**

### **Current State Analysis**
- **Authentication**: Custom JWT system
- **User Storage**: RDS Aurora database
- **Frontend**: Next.js with custom auth logic
- **Backend**: Lambda with JWT validation
- **User Management**: Staff dashboard with CRUD operations

### **Target State**
- **Authentication**: AWS Cognito User Pools
- **User Storage**: Cognito + RDS (hybrid approach)
- **Frontend**: Cognito SDK integration
- **Backend**: Cognito JWT validation
- **User Management**: Enhanced with Cognito features

---

## 📋 **Phase 1: Cognito Setup & Configuration**

### **1.1 Cognito User Pool Creation**
```powershell
# Create Cognito infrastructure
aws cognito-idp create-user-pool --pool-name "modulus-lms-users" --policies '{
  "PasswordPolicy": {
    "MinimumLength": 8,
    "RequireUppercase": true,
    "RequireLowercase": true,
    "RequireNumbers": true,
    "RequireSymbols": false
  }
}' --username-configuration '{
  "CaseSensitive": false
}' --schema '[
  {
    "Name": "email",
    "AttributeDataType": "String",
    "Required": true,
    "Mutable": true
  },
  {
    "Name": "given_name",
    "AttributeDataType": "String",
    "Required": true,
    "Mutable": true
  },
  {
    "Name": "family_name",
    "AttributeDataType": "String",
    "Required": true,
    "Mutable": true
  },
  {
    "Name": "custom:course_code",
    "AttributeDataType": "String",
    "Required": false,
    "Mutable": true
  },
  {
    "Name": "custom:role",
    "AttributeDataType": "String",
    "Required": false,
    "Mutable": true
  }
]'
```

### **1.2 App Client Configuration**
```powershell
# Create app client for Next.js frontend
aws cognito-idp create-user-pool-client --user-pool-id <POOL_ID> --client-name "modulus-frontend" --generate-secret false --explicit-auth-flows '[
  "ADMIN_NO_SRP_AUTH",
  "ALLOW_USER_PASSWORD_AUTH",
  "ALLOW_REFRESH_TOKEN_AUTH"
]' --callback-urls '["http://localhost:3000/auth/callback"]' --logout-urls '["http://localhost:3000/auth/logout"]'
```

### **1.3 Identity Pool (Optional)**
```powershell
# For advanced AWS service access
aws cognito-identity create-identity-pool --identity-pool-name "modulus-lms-identity" --allow-unauthenticated-identities false
```

---

## 📋 **Phase 2: Backend Migration**

### **2.1 Lambda Function Updates**

#### **New Dependencies**
```javascript
// package.json additions
{
  "aws-jwt-verify": "^4.0.1",
  "aws-sdk": "^2.1691.0"
}
```

#### **JWT Verification Update**
```javascript
// Replace custom JWT with Cognito verification
const { CognitoJwtVerifier } = require("aws-jwt-verify");

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID,
});

// New auth middleware
const authenticateUser = async (event) => {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    const payload = await verifier.verify(token);
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload['custom:role'],
      courseCode: payload['custom:course_code']
    };
  } catch (error) {
    throw new Error('Authentication failed');
  }
};
```

### **2.2 Database Schema Updates**
```sql
-- Add Cognito integration columns
ALTER TABLE users ADD COLUMN cognito_sub VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN migrated_to_cognito BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN migration_date TIMESTAMP NULL;

-- Create migration tracking table
CREATE TABLE cognito_migration_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  cognito_sub VARCHAR(255),
  migration_status ENUM('pending', 'success', 'failed'),
  migration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  error_message TEXT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 📋 **Phase 3: Frontend Migration**

### **3.1 Dependencies Update**
```json
{
  "aws-amplify": "^6.0.0",
  "@aws-amplify/ui-react": "^6.0.0",
  "@aws-amplify/ui-react-notifications": "^2.0.0"
}
```

### **3.2 Amplify Configuration**
```javascript
// src/lib/aws-config.js
import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      region: 'eu-west-2',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
        username: false
      }
    }
  }
};

Amplify.configure(awsConfig);
```

### **3.3 Authentication Components**
```javascript
// src/components/auth/CognitoAuth.tsx
import { Authenticator } from '@aws-amplify/ui-react';
import { signIn, signOut, getCurrentUser } from 'aws-amplify/auth';

export const AuthWrapper = ({ children }) => {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div>
          <nav>
            <button onClick={signOut}>Sign Out</button>
            <span>Welcome, {user?.attributes?.email}</span>
          </nav>
          {children}
        </div>
      )}
    </Authenticator>
  );
};
```

---

## 📋 **Phase 4: Data Migration Strategy**

### **4.1 User Migration Script**
```javascript
// scripts/migrate-users-to-cognito.js
const AWS = require('aws-sdk');
const mysql = require('mysql2/promise');

const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'eu-west-2' });

async function migrateUser(user) {
  try {
    // Create user in Cognito
    const cognitoUser = await cognito.adminCreateUser({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: user.email,
      UserAttributes: [
        { Name: 'email', Value: user.email },
        { Name: 'given_name', Value: user.firstName },
        { Name: 'family_name', Value: user.lastName },
        { Name: 'custom:course_code', Value: user.courseCode || '' },
        { Name: 'custom:role', Value: user.role || 'student' }
      ],
      TemporaryPassword: generateTemporaryPassword(),
      MessageAction: 'SUPPRESS' // Don't send welcome email yet
    }).promise();

    // Update database with Cognito sub
    await updateUserWithCognitoSub(user.id, cognitoUser.User.Username);
    
    return { success: true, cognitoSub: cognitoUser.User.Username };
  } catch (error) {
    console.error(`Migration failed for user ${user.email}:`, error);
    return { success: false, error: error.message };
  }
}
```

### **4.2 Migration Rollback Plan**
```sql
-- Rollback procedures
CREATE PROCEDURE RollbackCognitoMigration()
BEGIN
  -- Mark all users as not migrated
  UPDATE users SET migrated_to_cognito = FALSE, cognito_sub = NULL;
  
  -- Clear migration log
  TRUNCATE TABLE cognito_migration_log;
  
  -- Re-enable custom JWT endpoints
  UPDATE system_config SET auth_method = 'custom_jwt' WHERE config_key = 'authentication';
END;
```

---

## 📋 **Phase 5: Implementation Timeline**

### **Week 1: Infrastructure Setup**
- [ ] Create Cognito User Pool
- [ ] Configure App Client
- [ ] Set up environment variables
- [ ] Test basic Cognito functionality

### **Week 2: Backend Migration**
- [ ] Update Lambda dependencies
- [ ] Implement Cognito JWT verification
- [ ] Update database schema
- [ ] Create migration scripts
- [ ] Test backend with Cognito tokens

### **Week 3: Frontend Migration**
- [ ] Install Amplify dependencies
- [ ] Configure Amplify
- [ ] Replace custom auth components
- [ ] Update staff dashboard for Cognito
- [ ] Test frontend integration

### **Week 4: Data Migration & Testing**
- [ ] Run user migration scripts
- [ ] Validate migrated data
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Security testing

### **Week 5: Deployment & Monitoring**
- [ ] Deploy to production
- [ ] Monitor migration success
- [ ] Handle user support issues
- [ ] Documentation updates

---

## 📋 **Phase 6: Risk Mitigation**

### **6.1 Backup Strategy**
```powershell
# Backup current user data
mysqldump -h <RDS_ENDPOINT> -u <USERNAME> -p modulus_db users > users_backup_pre_cognito.sql

# Backup Lambda function
aws lambda get-function --function-name modulus-backend --query 'Code.Location' --output text | xargs wget -O lambda_backup.zip
```

### **6.2 Feature Flags**
```javascript
// Environment-based feature flags
const USE_COGNITO = process.env.USE_COGNITO_AUTH === 'true';

const authenticateRequest = async (event) => {
  if (USE_COGNITO) {
    return authenticateWithCognito(event);
  } else {
    return authenticateWithCustomJWT(event);
  }
};
```

### **6.3 Monitoring During Migration**
```javascript
// Enhanced CloudWatch metrics
const logMigrationMetric = (eventType, userId, success) => {
  const cloudwatch = new AWS.CloudWatch();
  cloudwatch.putMetricData({
    Namespace: 'Modulus/CognitoMigration',
    MetricData: [{
      MetricName: `${eventType}${success ? 'Success' : 'Failure'}`,
      Value: 1,
      Unit: 'Count',
      Dimensions: [{
        Name: 'Environment',
        Value: process.env.ENVIRONMENT || 'development'
      }]
    }]
  }).promise();
};
```

---

## 📋 **Phase 7: Staff Dashboard Updates**

### **7.1 User Management Enhancements**
```typescript
// Enhanced staff dashboard with Cognito integration
interface CognitoUser {
  cognitoSub: string;
  email: string;
  firstName: string;
  lastName: string;
  courseCode: string;
  role: string;
  status: 'CONFIRMED' | 'UNCONFIRMED' | 'FORCE_CHANGE_PASSWORD';
  lastLogin?: Date;
}

const StaffDashboard = () => {
  const [users, setUsers] = useState<CognitoUser[]>([]);
  
  const createUser = async (userData: Partial<CognitoUser>) => {
    // Create in Cognito first, then sync to RDS
    const cognitoUser = await createCognitoUser(userData);
    const dbUser = await createDatabaseUser({
      ...userData,
      cognitoSub: cognitoUser.sub
    });
    return dbUser;
  };
  
  const updateUser = async (userId: string, updates: Partial<CognitoUser>) => {
    // Update both Cognito and database
    await updateCognitoUser(userId, updates);
    await updateDatabaseUser(userId, updates);
  };
};
```

---

## 📋 **Phase 8: Testing Strategy**

### **8.1 Unit Tests**
```javascript
// Test Cognito integration
describe('Cognito Authentication', () => {
  test('should verify valid Cognito JWT', async () => {
    const mockToken = 'valid-cognito-jwt';
    const result = await authenticateUser({ headers: { Authorization: `Bearer ${mockToken}` }});
    expect(result.userId).toBeDefined();
  });
  
  test('should reject invalid token', async () => {
    const mockToken = 'invalid-token';
    await expect(authenticateUser({ headers: { Authorization: `Bearer ${mockToken}` }}))
      .rejects.toThrow('Authentication failed');
  });
});
```

### **8.2 Integration Tests**
```javascript
// Test complete auth flow
describe('End-to-End Authentication', () => {
  test('should complete sign-in flow', async () => {
    const user = await signIn(testCredentials);
    expect(user.signInUserSession).toBeDefined();
    
    const apiResponse = await callProtectedAPI(user.signInUserSession.accessToken);
    expect(apiResponse.status).toBe(200);
  });
});
```

---

## 📋 **Phase 9: Deployment Scripts**

### **9.1 Cognito Setup Script**
```powershell
# cognito-deployment.ps1
param(
    [string]$Environment = "development"
)

Write-Host "Setting up Cognito for environment: $Environment" -ForegroundColor Green

# Create User Pool
$UserPool = aws cognito-idp create-user-pool --pool-name "modulus-lms-$Environment" --cli-input-json file://cognito-user-pool-config.json

# Extract User Pool ID
$UserPoolId = ($UserPool | ConvertFrom-Json).UserPool.Id
Write-Host "Created User Pool: $UserPoolId" -ForegroundColor Green

# Create App Client
$AppClient = aws cognito-idp create-user-pool-client --user-pool-id $UserPoolId --cli-input-json file://cognito-app-client-config.json

# Extract App Client ID
$AppClientId = ($AppClient | ConvertFrom-Json).UserPoolClient.ClientId
Write-Host "Created App Client: $AppClientId" -ForegroundColor Green

# Update environment variables
Write-Host "COGNITO_USER_POOL_ID=$UserPoolId" | Out-File -FilePath ".env.cognito" -Append
Write-Host "COGNITO_CLIENT_ID=$AppClientId" | Out-File -FilePath ".env.cognito" -Append

Write-Host "Cognito setup complete!" -ForegroundColor Green
```

---

## 📋 **Phase 10: Success Metrics**

### **10.1 Migration Success Criteria**
- [ ] 100% of existing users migrated to Cognito
- [ ] Zero authentication failures post-migration
- [ ] Staff dashboard fully functional with Cognito
- [ ] Performance impact < 10% increase in response time
- [ ] Zero data loss during migration

### **10.2 Monitoring Metrics**
```javascript
// Key metrics to track
const migrationMetrics = {
  usersTotal: 'Total users in system',
  usersMigrated: 'Users successfully migrated to Cognito',
  authenticationErrors: 'Failed authentication attempts',
  migrationErrors: 'Migration process failures',
  responseTimeIncrease: 'Performance impact measurement'
};
```

---

## 🚀 **Quick Start Commands**

```powershell
# 1. Setup Cognito infrastructure
.\cognito-deployment.ps1 -Environment development

# 2. Run migration scripts
node scripts/migrate-users-to-cognito.js

# 3. Update environment variables
cp .env.cognito .env.local

# 4. Install frontend dependencies
npm install aws-amplify @aws-amplify/ui-react

# 5. Test the migration
npm run test:cognito

# 6. Start development server with Cognito
npm run dev
```

---

## 📝 **Migration Checklist**

### **Pre-Migration**
- [ ] Backup all user data
- [ ] Test Cognito setup in development
- [ ] Validate migration scripts
- [ ] Prepare rollback procedures

### **During Migration**
- [ ] Monitor migration progress
- [ ] Handle migration errors
- [ ] Validate data integrity
- [ ] Test authentication flows

### **Post-Migration**
- [ ] Verify all users migrated successfully
- [ ] Test staff dashboard functionality
- [ ] Monitor system performance
- [ ] Update documentation
- [ ] Train staff on new system

---

**This strategy provides a comprehensive, phased approach to migrating from custom JWT to AWS Cognito while minimizing risk and ensuring system reliability throughout the transition.**
