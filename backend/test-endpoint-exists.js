const axios = require('axios');

async function testEndpoint() {
    try {
        console.log('🧪 Testing if /my-course endpoint exists...');

        // Try without auth first to see if endpoint exists
        const response = await axios.get('http://localhost:3001/api/courses/my-course');
        console.log('Response:', response.status);
    } catch (error) {
        console.log('Error status:', error.response?.status);
        console.log('Error message:', error.response?.data);

        if (error.response?.status === 401) {
            console.log('✅ Endpoint exists (401 = needs auth)');
        } else if (error.response?.status === 404) {
            console.log('❌ Endpoint does not exist (404)');
        } else {
            console.log('❌ Other error:', error.message);
        }
    }
}

testEndpoint();
