const http = require('http');

async function loginAndTest() {
  // First, login to get a fresh token
  const loginData = JSON.stringify({
    email: 'student@test.com',
    password: 'Mahtabmehek@1337'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  console.log('Step 1: Logging in as student...');

  return new Promise((resolve, reject) => {
    const loginReq = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const loginResponse = JSON.parse(data);
          console.log('Login response:', loginResponse);
          
          if (loginResponse.token) {
            console.log('✅ Login successful, testing /my-course...');
            testMyCourse(loginResponse.token);
          } else {
            console.log('❌ Login failed:', loginResponse);
          }
        } catch (e) {
          console.log('❌ Login response parse error:', e.message);
        }
      });
    });

    loginReq.on('error', (e) => {
      console.error('❌ Login request error:', e.message);
    });

    loginReq.write(loginData);
    loginReq.end();
  });
}

function testMyCourse(token) {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/courses/my-course',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  console.log('Step 2: Testing /my-course with fresh token...');

  const req = http.request(options, (res) => {
    console.log(`\n=== RESPONSE ===`);
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:', data);
      
      try {
        const jsonData = JSON.parse(data);
        console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
        
        if (jsonData.error) {
          console.log('\n❌ Error occurred:', jsonData.error);
        } else if (jsonData.course) {
          console.log('\n✅ Course found:', jsonData.course.title);
          console.log('Course ID:', jsonData.course.id);
          console.log('Modules count:', jsonData.modules ? jsonData.modules.length : 'No modules');
        } else {
          console.log('\n✅ No course assigned to student');
        }
      } catch (e) {
        console.log('\n❌ Failed to parse JSON:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`\n❌ Request error: ${e.message}`);
  });

  req.end();
}

loginAndTest();
