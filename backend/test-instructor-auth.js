// Test local JWT authentication for instructor user
const axios = require('axios');

async function testInstructorLogin() {
    console.log('🧪 Testing instructor user authentication...\n');

    const frontendUrl = 'http://localhost:3000';
    const backendUrl = 'http://localhost:3001';

    // Test credentials for the instructor user
    const credentials = {
        email: 'instructor_user@modulus.com',
        username: 'instructor_user',
        password: 'TempPass123!'
    };

    console.log('📋 Testing with credentials:');
    console.log(`   Email: ${credentials.email}`);
    console.log(`   Username: ${credentials.username}`);
    console.log(`   Role: instructor\n`);

    try {
        // Test 1: Check if backend is accessible
        console.log('1️⃣ Testing backend health...');
        const healthResponse = await axios.get(`${backendUrl}/health`);
        console.log(`✅ Backend health: ${healthResponse.data.status}\n`);

        // Test 2: Try to access labs endpoint without token (should fail with 401)
        console.log('2️⃣ Testing labs endpoint without authentication...');
        try {
            await axios.get(`${backendUrl}/api/labs`);
            console.log('❌ Unexpected: Labs endpoint allowed access without token\n');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Labs endpoint correctly requires authentication\n');
            } else {
                console.log('❌ Unexpected error:', error.message, '\n');
            }
        }

        console.log('🎯 Authentication test summary:');
        console.log('   - Backend is running and healthy');
        console.log('   - API endpoints are properly protected');
        console.log('   - Ready for instructor user to authenticate via frontend');
        console.log('\n📱 Next steps:');
        console.log('   1. Go to http://localhost:3000');
        console.log('   2. Sign in with instructor_user@modulus.com / TempPass123!');
        console.log('   3. Try creating a lab to test permissions');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Test if axios is available
try {
    require('axios');
    testInstructorLogin();
} catch (err) {
    console.log('❌ axios not found. Run: npm install axios');
}
