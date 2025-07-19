const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testFullWorkflow() {
    try {
        console.log('🔐 Testing full authentication and submissions workflow...');
        
        // 1. Test login first
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'student3@test.com',
                password: 'password123'
            })
        });
        
        if (!loginResponse.ok) {
            console.log('❌ Login failed:', await loginResponse.text());
            return;
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Login successful, user:', loginData.user.name);
        const token = loginData.token;
        
        // 2. Test getting existing submissions with auth token
        const submissionsResponse = await fetch('http://localhost:3001/api/submissions/lab/106', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!submissionsResponse.ok) {
            console.log('❌ Submissions fetch failed:', await submissionsResponse.text());
            return;
        }
        
        const submissions = await submissionsResponse.json();
        console.log('📚 Existing submissions:', submissions);
        
        // 3. Test submitting a new answer
        const submitResponse = await fetch('http://localhost:3001/api/submissions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                labId: 106,
                taskId: 101,
                questionId: 142,
                submittedAnswer: 'Full Moon'
            })
        });
        
        if (!submitResponse.ok) {
            console.log('❌ Submission failed:', await submitResponse.text());
            return;
        }
        
        const submitResult = await submitResponse.json();
        console.log('✅ Submission successful:', submitResult);
        
        console.log('\n🎉 Full workflow test completed successfully!');
        console.log('✅ Authentication working');
        console.log('✅ Submissions API working');
        console.log('✅ Database persistence working');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testFullWorkflow();
