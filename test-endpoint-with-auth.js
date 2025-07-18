const http = require('http');

// Test the endpoint with authentication
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/courses/my-course',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoic3R1ZGVudEB0ZXN0LmNvbSIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzM2NDUzMzE5LCJleHAiOjE3MzY0NTY5MTl9.rctETGpE-h1pEWLLdJLdQhAo3Fm9lhL0s2vYW7QGLb4',
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', data);
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.end();
