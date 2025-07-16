// AWS Amplify Cognito Configuration
import { Amplify } from 'aws-amplify';

const cognitoConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-2_4vo3VDZa5',
      userPoolClientId: '4jfe4rmrv0mec1e2hrvmo32a2h'
    }
  }
};

// Initialize Amplify
try {
  Amplify.configure(cognitoConfig);
  console.log('Amplify configured successfully');
} catch (error) {
  console.error('Error configuring Amplify:', error);
}

export default cognitoConfig;
