# Amazon Cognito Migration Plan for Modulus LMS

## 📋 **Phase 1: Setup Cognito Infrastructure (Week 1)**

### 1.1 Create Cognito User Pool
```bash
# Create User Pool with custom attributes
aws cognito-idp create-user-pool \
  --pool-name "modulus-lms-users" \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false
    }
  }' \
  --schema '[
    {
      "Name": "email",
      "AttributeDataType": "String",
      "Required": true,
      "Mutable": true
    },
    {
      "Name": "name", 
      "AttributeDataType": "String",
      "Required": true,
      "Mutable": true
    },
    {
      "Name": "custom:role",
      "AttributeDataType": "String",
      "Mutable": true
    },
    {
      "Name": "custom:level",
      "AttributeDataType": "Number",
      "Mutable": true
    },
    {
      "Name": "custom:badges",
      "AttributeDataType": "String",
      "Mutable": true
    },
    {
      "Name": "custom:streak_days",
      "AttributeDataType": "Number", 
      "Mutable": true
    },
    {
      "Name": "custom:total_points",
      "AttributeDataType": "Number",
      "Mutable": true
    }
  ]'
```

### 1.2 Create User Groups for Roles
```bash
# Create groups for each role
aws cognito-idp create-group --group-name "students" --user-pool-id $USER_POOL_ID
aws cognito-idp create-group --group-name "instructors" --user-pool-id $USER_POOL_ID  
aws cognito-idp create-group --group-name "staff" --user-pool-id $USER_POOL_ID
aws cognito-idp create-group --group-name "admins" --user-pool-id $USER_POOL_ID
```

### 1.3 Create Lambda Triggers
```javascript
// pre-signup-trigger.js - Validate access codes
exports.handler = async (event) => {
  const { request, response } = event;
  const { userAttributes } = request;
  const { accessCode, role } = request.clientMetadata;
  
  const ROLE_ACCESS_CODES = {
    'student': 'student2025',
    'instructor': 'instructor2025', 
    'staff': 'staff2025',
    'admin': 'mahtabmehek1337'
  };
  
  if (ROLE_ACCESS_CODES[role] !== accessCode) {
    throw new Error('Invalid access code for role');
  }
  
  // Add custom attributes
  event.response.userAttributes = {
    ...userAttributes,
    'custom:role': role,
    'custom:level': role === 'student' ? '1' : '5',
    'custom:badges': '[]',
    'custom:streak_days': '0',
    'custom:total_points': '0'
  };
  
  return event;
};
```

```javascript
// post-signup-trigger.js - Handle approval workflow
exports.handler = async (event) => {
  const { request } = event;
  const { userAttributes } = request;
  const role = userAttributes['custom:role'];
  
  // Auto-confirm admins, others need approval
  if (role === 'admin') {
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;
  } else {
    // Send to approval queue (store in DynamoDB or notify admins)
    await sendToApprovalQueue(userAttributes);
  }
  
  return event;
};
```

## 📋 **Phase 2: Backend Migration (Week 1-2)**

### 2.1 Replace Auth Routes
```javascript
// cognito-auth.js - New authentication service
const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();

class CognitoAuthService {
  constructor(userPoolId, clientId) {
    this.userPoolId = userPoolId;
    this.clientId = clientId;
  }
  
  async register(userData) {
    const { name, email, password, role, accessCode } = userData;
    
    const params = {
      ClientId: this.clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name }
      ],
      ClientMetadata: {
        role: role,
        accessCode: accessCode
      }
    };
    
    try {
      const result = await cognito.signUp(params).promise();
      return {
        success: true,
        userSub: result.UserSub,
        requiresApproval: role !== 'admin'
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }
  
  async login(email, password) {
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    };
    
    const result = await cognito.initiateAuth(params).promise();
    return {
      accessToken: result.AuthenticationResult.AccessToken,
      idToken: result.AuthenticationResult.IdToken,
      refreshToken: result.AuthenticationResult.RefreshToken
    };
  }
  
  async getUserInfo(accessToken) {
    const params = { AccessToken: accessToken };
    const result = await cognito.getUser(params).promise();
    
    return {
      username: result.Username,
      attributes: result.UserAttributes.reduce((acc, attr) => {
        acc[attr.Name] = attr.Value;
        return acc;
      }, {})
    };
  }
}
```

### 2.2 Update Middleware
```javascript
// cognito-middleware.js
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`
});

const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.decode(token, { complete: true });
    const key = await client.getSigningKey(decoded.header.kid);
    const signingKey = key.getPublicKey();
    
    const verified = jwt.verify(token, signingKey);
    req.user = verified;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
```

## 📋 **Phase 3: Frontend Migration (Week 2)**

### 3.1 Install AWS Amplify
```bash
npm install aws-amplify @aws-amplify/ui-react
```

### 3.2 Update Auth Service
```typescript
// cognito-api.ts
import { Auth } from 'aws-amplify';

class CognitoApiClient {
  async register(userData: RegisterData) {
    try {
      const { user } = await Auth.signUp({
        username: userData.email,
        password: userData.password,
        attributes: {
          email: userData.email,
          name: userData.name,
          'custom:role': userData.role
        },
        clientMetadata: {
          accessCode: userData.accessCode
        }
      });
      
      return {
        success: true,
        userSub: user.userSub,
        requiresApproval: userData.role !== 'admin'
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }
  
  async login(email: string, password: string) {
    const user = await Auth.signIn(email, password);
    const session = await Auth.currentSession();
    
    return {
      user: await this.getCurrentUser(),
      tokens: {
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken()
      }
    };
  }
  
  async getCurrentUser() {
    const user = await Auth.currentAuthenticatedUser();
    const attributes = await Auth.userAttributes(user);
    
    return {
      id: user.username,
      email: attributes.find(attr => attr.Name === 'email')?.Value,
      name: attributes.find(attr => attr.Name === 'name')?.Value,
      role: attributes.find(attr => attr.Name === 'custom:role')?.Value,
      level: parseInt(attributes.find(attr => attr.Name === 'custom:level')?.Value || '1'),
      // ... other attributes
    };
  }
}
```

### 3.3 Update React Hooks
```typescript
// use-cognito-auth.ts
import { useEffect, useState } from 'react';
import { Auth } from 'aws-amplify';

export const useCognitoAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    checkAuthState();
  }, []);
  
  const checkAuthState = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      setUser(await formatCognitoUser(user));
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
    }
  };
  
  const login = async (email: string, password: string) => {
    const user = await Auth.signIn(email, password);
    await checkAuthState();
    return user;
  };
  
  const logout = async () => {
    await Auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };
  
  return { user, isAuthenticated, login, logout, checkAuthState };
};
```

## 📋 **Phase 4: Data Migration (Week 2-3)**

### 4.1 Export Current Users
```javascript
// export-users.js
const exportUsers = async () => {
  const users = await db.query('SELECT * FROM users');
  return users.rows;
};
```

### 4.2 Import to Cognito
```javascript
// import-to-cognito.js
const importUsers = async (users) => {
  for (const user of users) {
    await cognito.adminCreateUser({
      UserPoolId: userPoolId,
      Username: user.email,
      UserAttributes: [
        { Name: 'email', Value: user.email },
        { Name: 'name', Value: user.name },
        { Name: 'custom:role', Value: user.role },
        { Name: 'custom:level', Value: user.level.toString() },
        { Name: 'custom:badges', Value: JSON.stringify(user.badges) }
      ],
      MessageAction: 'SUPPRESS', // Don't send welcome email
      TemporaryPassword: generateTempPassword()
    }).promise();
    
    // Add to appropriate group
    await cognito.adminAddUserToGroup({
      UserPoolId: userPoolId,
      Username: user.email,
      GroupName: user.role + 's'
    }).promise();
  }
};
```

## 🎯 **Migration Challenges & Solutions**

### Challenge 1: Role-Based ID Ranges
**Solution:** Use Cognito Sub as primary ID, maintain ID mapping in DynamoDB
```javascript
// id-mapping.js
const idMapping = {
  'cognito-sub-123': 101, // staff ID
  'cognito-sub-456': 501  // instructor ID
};
```

### Challenge 2: Access Code Validation
**Solution:** Pre-signup Lambda trigger (shown above)

### Challenge 3: Approval Workflow  
**Solution:** Custom admin interface + Cognito Admin APIs
```javascript
const approveUser = async (username) => {
  await cognito.adminConfirmSignUp({
    UserPoolId: userPoolId,
    Username: username
  }).promise();
};
```

### Challenge 4: Custom User Attributes
**Solution:** Use Cognito custom attributes + DynamoDB for complex data
```javascript
// Store complex data in DynamoDB
const userProgressTable = {
  userId: 'cognito-sub-123',
  courses: [...],
  labSessions: [...],
  // Complex nested data
};
```

## 💰 **Cost Comparison**

### Current Costs:
- **Lambda:** ~$5/month
- **Aurora:** ~$50/month  
- **Total:** ~$55/month

### With Cognito:
- **Cognito:** $0.0055 per MAU (first 50k free)
- **Lambda:** ~$3/month (less auth logic)
- **DynamoDB:** ~$5/month (user data)
- **Total:** ~$8/month (for <50k users)

## ⚡ **Benefits of Migration**

1. **🔒 Security:** Built-in security features, MFA support
2. **📱 OAuth/Social:** Easy Google/Facebook login integration
3. **🔧 Maintenance:** Less custom auth code to maintain
4. **📊 Analytics:** Built-in user analytics and insights
5. **🌍 Global:** Built-in user directory with global replication
6. **💸 Cost:** Potentially lower costs for user management

## ❌ **Migration Risks**

1. **🕒 Downtime:** Need careful deployment strategy
2. **🔄 Data Loss:** Risk during user migration
3. **🔧 Complexity:** New patterns for developers to learn
4. **🎯 Customization:** Less flexibility for custom auth flows

## 🎯 **Recommendation**

**If you're happy with current system:** Keep it! It's working well and fits your needs.

**If you want to migrate:** Do it in phases with feature flags, allowing rollback at each step.

**Best time to migrate:** When you need features like:
- Social login (Google/Facebook)
- Multi-factor authentication
- Advanced user analytics
- Global user directory
- Reduced maintenance overhead

The migration is definitely doable, but make sure the benefits justify the effort!
