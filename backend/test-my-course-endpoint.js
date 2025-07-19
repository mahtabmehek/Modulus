const http = require('http');

// Test the my-course endpoint specifically
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

console.log('Testing /api/courses/my-course endpoint...');

const req = http.request(options, (res) => {
    console.log(`\n=== RESPONSE ===`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Status Message: ${res.statusMessage}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\n=== RESPONSE BODY ===');
        console.log('Raw response:', data);

        try {
            const jsonData = JSON.parse(data);
            console.log('\n=== PARSED JSON ===');
            console.log(JSON.stringify(jsonData, null, 2));

            if (jsonData.error) {
                console.log('\n❌ Error occurred:', jsonData.error);
            } else if (jsonData.course) {
                console.log('\n✅ Course found:', jsonData.course.title);
                console.log('Course ID:', jsonData.course.id);
                console.log('Modules count:', jsonData.modules ? jsonData.modules.length : 'No modules');
            }
        } catch (e) {
            console.log('\n❌ Failed to parse JSON:', e.message);
        }
    });
});

req.on('error', (e) => {
    console.error(`\n❌ Request error: ${e.message}`);
});

req.setTimeout(10000, () => {
    console.log('\n❌ Request timeout after 10 seconds');
    req.destroy();
});

req.end();
