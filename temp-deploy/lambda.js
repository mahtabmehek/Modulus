const serverless = require('serverless-http');
const app = require('./server');

// Lambda Function URL handler
exports.handler = async (event, context) => {
  console.log('🔍 Lambda Event:', JSON.stringify(event, null, 2));
  
  try {
    // Create serverless handler
    const handler = serverless(app, {
      binary: false,
      // For Lambda Function URLs, we don't need to strip base path
      stripBasePath: false
    });
    
    const response = await handler(event, context);
    
    console.log('🔍 Lambda Response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('❌ Lambda Handler Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};
