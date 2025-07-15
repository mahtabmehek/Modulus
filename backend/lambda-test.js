const serverless = require('serverless-http');

// Create a simple Express app for testing
const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Lambda is working' });
});

const handler = serverless(app);

exports.handler = async (event, context) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    try {
        const result = await handler(event, context);
        console.log('Result:', JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('Error:', error);
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
