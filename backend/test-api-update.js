const axios = require('axios');

async function testAPIUpdate() {
    try {
        console.log('🧪 Testing API user update functionality...');

        // First login to get a token
        console.log('Logging in as admin...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@modulus.com',
            password: 'adminpassword'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Now test updating a user with course code
        const userId = 1002;
        const courseCode = 'CS-402';

        console.log(`Updating user ${userId} with course code: ${courseCode}`);

        const updateResponse = await axios.put(
            `http://localhost:3001/api/auth/admin/update-user/${userId}`,
            { courseCode: courseCode },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Update successful:', updateResponse.data);

    } catch (error) {
        console.error('❌ API test failed:', error.response?.data || error.message);
    }
}

testAPIUpdate();
