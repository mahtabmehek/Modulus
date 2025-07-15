const serverless = require('serverless-http');
const app = require('./lambda-server');

console.log(' Lambda starting...');

const handler = serverless(app);

exports.handler = async (event, context) => {
  console.log(' Lambda Event received');

  try {
    const result = await handler(event, context);
    return result;
  } catch (error) {
    console.error(' Lambda Handler Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};
