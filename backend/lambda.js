const serverless = require('serverless-http');
const app = require('./server');

// Create the Lambda handler
const handler = serverless(app);

module.exports = { handler };
