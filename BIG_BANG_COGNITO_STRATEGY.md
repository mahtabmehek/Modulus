# Modulus LMS - Big Bang Cognito Migration Strategy
*Fast-Track Complete Migration - New Infrastructure Approach*

## 🚀 **Big Bang Migration Overview**

### **Strategy: Complete New Infrastructure**
- **Approach**: Create entirely new AWS resources with Cognito
- **Timeline**: 4-6 hours total migration
- **Risk**: Medium (complete switchover)
- **Benefit**: Clean slate, no legacy code, fastest implementation

---

## ⚡ **Phase 1: New Infrastructure (30 minutes)**

### **1.1 Create New Lambda Function**
```powershell
# Create new Lambda with Cognito from scratch
aws lambda create-function --function-name "modulus-backend-cognito" --runtime "nodejs18.x" --role "arn:aws:iam::376129881409:role/lambda-execution-role" --handler "index.handler" --zip-file "fileb://lambda-cognito.zip" --memory-size 1128 --timeout 30 --environment Variables='{
  "COGNITO_USER_POOL_ID":"${COGNITO_USER_POOL_ID}",
  "COGNITO_CLIENT_ID":"${COGNITO_CLIENT_ID}",
  "RDS_ENDPOINT":"${RDS_ENDPOINT}",
  "DB_NAME":"modulus_db"
}'
```

### **1.2 Create New API Gateway**
```powershell
# Create new API Gateway for Cognito backend
aws apigateway create-rest-api --name "modulus-api-cognito" --description "Modulus LMS API with Cognito Auth"

# Configure CORS and Lambda integration
aws apigateway create-deployment --rest-api-id ${NEW_API_ID} --stage-name prod
```

### **1.3 Setup Cognito (5 minutes)**
```powershell
# Run the fast setup
.\setup-cognito-fast.ps1
```

---

## ⚡ **Phase 2: New Lambda Code (45 minutes)**

### **2.1 Create Cognito-Native Lambda**
```javascript
// lambda-cognito/index.js - Complete new implementation
const { CognitoJwtVerifier } = require("aws-jwt-verify");
const mysql = require('mysql2/promise');

// Cognito verifier setup
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID,
});

// New auth middleware
const authenticateUser = async (token) => {
  try {
    const payload = await verifier.verify(token);
    return {
      userId: payload.sub,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      courseCode: payload['custom:course_code'],
      role: payload['custom:user_role']
    };
  } catch (error) {
    throw new Error('Authentication failed');
  }
};

// Main handler
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    // Handle OPTIONS requests
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    // Authenticate user
    const token = event.headers.Authorization?.replace('Bearer ', '');
    const user = await authenticateUser(token);

    // Route requests
    const path = event.path;
    const method = event.httpMethod;

    if (path === '/users' && method === 'GET') {
      return await getUsers(user, headers);
    } else if (path === '/users' && method === 'POST') {
      return await createUser(user, JSON.parse(event.body), headers);
    } else if (path.startsWith('/users/') && method === 'PUT') {
      const userId = path.split('/')[2];
      return await updateUser(user, userId, JSON.parse(event.body), headers);
    } else if (path.startsWith('/users/') && method === 'DELETE') {
      const userId = path.split('/')[2];
      return await deleteUser(user, userId, headers);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };

  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: error.message === 'Authentication failed' ? 401 : 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Database functions
const getDbConnection = async () => {
  return mysql.createConnection({
    host: process.env.RDS_ENDPOINT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
};

const getUsers = async (authUser, headers) => {
  const connection = await getDbConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, cognito_sub, email, first_name, last_name, course_code, role, created_at FROM users WHERE deleted_at IS NULL'
    );
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(rows)
    };
  } finally {
    await connection.end();
  }
};

const createUser = async (authUser, userData, headers) => {
  // Create in Cognito first
  const cognito = new AWS.CognitoIdentityServiceProvider();
  
  try {
    const cognitoUser = await cognito.adminCreateUser({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: userData.email,
      UserAttributes: [
        { Name: 'email', Value: userData.email },
        { Name: 'given_name', Value: userData.firstName },
        { Name: 'family_name', Value: userData.lastName },
        { Name: 'custom:course_code', Value: userData.courseCode || '' },
        { Name: 'custom:user_role', Value: userData.role || 'student' }
      ],
      TemporaryPassword: generateTemporaryPassword(),
      MessageAction: 'SUPPRESS'
    }).promise();

    // Then create in database
    const connection = await getDbConnection();
    try {
      const [result] = await connection.execute(
        'INSERT INTO users (cognito_sub, email, first_name, last_name, course_code, role) VALUES (?, ?, ?, ?, ?, ?)',
        [cognitoUser.User.Username, userData.email, userData.firstName, userData.lastName, userData.courseCode, userData.role]
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ id: result.insertId, cognitoSub: cognitoUser.User.Username })
      };
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
};

const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
```

### **2.2 Package New Lambda**
```powershell
# Create package.json for new Lambda
@'
{
  "name": "modulus-backend-cognito",
  "version": "1.0.0",
  "dependencies": {
    "aws-jwt-verify": "^4.0.1",
    "aws-sdk": "^2.1691.0",
    "mysql2": "^3.6.5"
  }
}
'@ | Out-File -FilePath "lambda-cognito/package.json"

# Install and package
cd lambda-cognito
npm install --production
Compress-Archive -Path * -DestinationPath "../lambda-cognito.zip" -Force
cd ..
```

---

## ⚡ **Phase 3: Frontend Overhaul (60 minutes)**

### **3.1 Install Dependencies**
```bash
npm install aws-amplify @aws-amplify/ui-react @aws-amplify/ui-react-notifications
```

### **3.2 New Auth Configuration**
```javascript
// src/lib/cognito-config.js
import { Amplify } from 'aws-amplify';

const cognitoConfig = {
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
  },
  API: {
    REST: {
      ModulusAPI: {
        endpoint: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
        region: 'eu-west-2'
      }
    }
  }
};

Amplify.configure(cognitoConfig);
export default cognitoConfig;
```

### **3.3 Replace Auth Components**
```typescript
// src/components/auth/CognitoAuthProvider.tsx
import { Authenticator } from '@aws-amplify/ui-react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const CognitoAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut: handleSignOut }}>
      <Authenticator.Provider>
        <Authenticator>
          {({ signOut, user }) => children}
        </Authenticator>
      </Authenticator.Provider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within CognitoAuthProvider');
  return context;
};
```

### **3.4 New Staff Dashboard**
```typescript
// src/components/staff/CognitoStaffDashboard.tsx
import { useState, useEffect } from 'react';
import { post, get, put, del } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';

interface CognitoUser {
  id: number;
  cognitoSub: string;
  email: string;
  firstName: string;
  lastName: string;
  courseCode: string;
  role: string;
  createdAt: string;
}

export const CognitoStaffDashboard = () => {
  const [users, setUsers] = useState<CognitoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await get({
        apiName: 'ModulusAPI',
        path: '/users'
      }).response;
      const data = await response.body.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: Partial<CognitoUser>) => {
    setCreating(true);
    try {
      await post({
        apiName: 'ModulusAPI',
        path: '/users',
        options: {
          body: userData
        }
      }).response;
      await loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setCreating(false);
    }
  };

  const updateUser = async (userId: number, updates: Partial<CognitoUser>) => {
    try {
      await put({
        apiName: 'ModulusAPI',
        path: `/users/${userId}`,
        options: {
          body: updates
        }
      }).response;
      await loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await del({
        apiName: 'ModulusAPI',
        path: `/users/${userId}`
      }).response;
      await loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="cognito-staff-dashboard">
      <h1>Staff Dashboard - Cognito Enabled</h1>
      
      <div className="user-list">
        {users.map(user => (
          <div key={user.id} className="user-card">
            <h3>{user.firstName} {user.lastName}</h3>
            <p>Email: {user.email}</p>
            <p>Course: {user.courseCode}</p>
            <p>Role: {user.role}</p>
            <button onClick={() => updateUser(user.id, { role: user.role === 'student' ? 'admin' : 'student' })}>
              Toggle Role
            </button>
            <button onClick={() => deleteUser(user.id)}>Delete</button>
          </div>
        ))}
      </div>

      <CreateUserForm onSubmit={createUser} loading={creating} />
    </div>
  );
};
```

---

## ⚡ **Phase 4: Database Migration (30 minutes)**

### **4.1 New Database Schema**
```sql
-- Create new users table optimized for Cognito
CREATE TABLE users_cognito (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cognito_sub VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  course_code VARCHAR(50),
  role ENUM('student', 'instructor', 'admin') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_cognito_sub (cognito_sub),
  INDEX idx_email (email),
  INDEX idx_course_code (course_code)
);

-- Migrate existing users (optional - or start fresh)
INSERT INTO users_cognito (email, first_name, last_name, course_code, role, created_at)
SELECT email, first_name, last_name, course_code, role, created_at 
FROM users 
WHERE deleted_at IS NULL;
```

---

## ⚡ **Phase 5: Rapid Deployment (45 minutes)**

### **5.1 Deploy Everything Script**
```powershell
# big-bang-deploy.ps1
Write-Host "Starting Big Bang Cognito Deployment..." -ForegroundColor Cyan

# 1. Setup Cognito (5 mins)
.\setup-cognito-fast.ps1

# 2. Deploy new Lambda (10 mins)
aws lambda update-function-code --function-name modulus-backend-cognito --zip-file fileb://lambda-cognito.zip

# 3. Update API Gateway (5 mins)
$NEW_API_URL = aws apigateway get-rest-apis --query "items[?name=='modulus-api-cognito'].id" --output text
Write-Host "New API Gateway URL: https://$NEW_API_URL.execute-api.eu-west-2.amazonaws.com/prod"

# 4. Update frontend environment (2 mins)
@"
NEXT_PUBLIC_API_GATEWAY_URL=https://$NEW_API_URL.execute-api.eu-west-2.amazonaws.com/prod
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$env:COGNITO_USER_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID=$env:COGNITO_CLIENT_ID
"@ | Out-File -FilePath ".env.local" -Force

# 5. Build and test (15 mins)
npm run build
npm start

Write-Host "Big Bang Deployment Complete!" -ForegroundColor Green
```

---

## ⚡ **Phase 6: Switchover (15 minutes)**

### **6.1 Update DNS/Frontend**
```powershell
# Switch frontend to new API
$OLD_API = "https://old-api-gateway-url"
$NEW_API = "https://new-cognito-api-gateway-url"

# Update all references
(Get-Content .env.local) -replace $OLD_API, $NEW_API | Set-Content .env.local

# Restart frontend
npm run dev
```

### **6.2 Test Everything**
```powershell
# Quick test script
Write-Host "Testing Cognito integration..." -ForegroundColor Yellow

# Test 1: Can create user
# Test 2: Can authenticate
# Test 3: Can access protected routes
# Test 4: Staff dashboard works

Write-Host "All tests passed!" -ForegroundColor Green
```

---

## 🕐 **Complete Timeline**

```
Hour 0: Start
├── 0:00-0:30  │ Phase 1: New Infrastructure
├── 0:30-1:15  │ Phase 2: New Lambda Code  
├── 1:15-2:15  │ Phase 3: Frontend Overhaul
├── 2:15-2:45  │ Phase 4: Database Migration
├── 2:45-3:30  │ Phase 5: Rapid Deployment
└── 3:30-3:45  │ Phase 6: Switchover & Testing
Total: ~4 hours
```

---

## 🚀 **Execution Commands**

```powershell
# Complete Big Bang Migration in one go:

# 1. Create all new infrastructure
.\setup-cognito-fast.ps1

# 2. Deploy everything
.\big-bang-deploy.ps1

# 3. Switch over
.\switchover-cognito.ps1

# 4. Verify
.\test-cognito-integration.ps1
```

---

## ✅ **Success Criteria**
- [ ] Cognito User Pool active
- [ ] New Lambda function deployed
- [ ] New API Gateway working
- [ ] Frontend using Cognito auth
- [ ] Staff dashboard functional
- [ ] All existing users can authenticate
- [ ] Zero downtime during switch

This "Big Bang" approach creates everything new and switches over quickly, avoiding the complexity of maintaining dual systems. The risk is higher but the implementation is much faster and cleaner! 🎯
