const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const requestModule = urlObj.protocol === 'https:' ? https : http;

        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = requestModule.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, data: parsed, statusCode: res.statusCode });
                } catch (e) {
                    resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, data: data, statusCode: res.statusCode });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

async function testLabCreation() {
    try {
        // First, login to get a token
        console.log('🔑 Logging in...');
        const loginResponse = await makeRequest('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'instructor@test.com',
                password: 'Mahtabmehek@1337'
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.statusCode}`);
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Now create a lab
        console.log('🧪 Creating test lab...');
        const labData = {
            module_id: 1,
            title: 'Database Schema Test Lab',
            description: 'Testing that the lab creation form works with the database schema',
            lab_type: 'virtual_machine',
            estimated_minutes: 45,
            points_possible: 100,
            vm_image: 'ubuntu-20.04-security'
        };

        const createResponse = await makeRequest('http://localhost:3001/api/labs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(labData)
        });

        if (!createResponse.ok) {
            throw new Error(`Lab creation failed: ${JSON.stringify(createResponse.data)}`);
        }

        const labResult = createResponse.data;
        console.log('✅ Lab created successfully:');
        console.log(`   ID: ${labResult.data.id}`);
        console.log(`   Title: ${labResult.data.title}`);
        console.log(`   Type: ${labResult.data.lab_type}`);
        console.log(`   Points: ${labResult.data.points_possible}`);

        console.log('🎉 Test completed successfully! The database schema matches the form.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testLabCreation();
