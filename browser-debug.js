// Debug script to test API from browser console
// Copy and paste this into your browser's developer console

console.log('🔧 Modulus LMS API Debug Tool');
console.log('=============================');

// Get the current API URL
const API_URL = 'https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/prod/api';
console.log('🌐 API URL:', API_URL);

// Test 1: Health Check
async function testHealth() {
  console.log('\n🏥 Testing Health Endpoint...');
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Health check response status:', response.status);
    const data = await response.json();
    console.log('✅ Health check data:', data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return false;
  }
}

// Test 2: CORS Check
async function testCORS() {
  console.log('\n🌍 Testing CORS...');
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('✅ CORS preflight status:', response.status);
    console.log('✅ CORS headers:', Object.fromEntries(response.headers.entries()));
    return true;
  } catch (error) {
    console.error('❌ CORS test failed:', error);
    return false;
  }
}

// Test 3: Login Test
async function testLogin() {
  console.log('\n🔐 Testing Login...');
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'Mahtabmehek@1337'
      })
    });
    
    console.log('✅ Login response status:', response.status);
    const data = await response.json();
    console.log('✅ Login response data:', data);
    return true;
  } catch (error) {
    console.error('❌ Login test failed:', error);
    return false;
  }
}

// Test 4: Network Connectivity
async function testNetworkConnectivity() {
  console.log('\n🌐 Testing Network Connectivity...');
  try {
    // Test if we can reach the domain
    const response = await fetch('https://9yr579qaz1.execute-api.eu-west-2.amazonaws.com/', {
      method: 'GET',
      mode: 'no-cors'
    });
    console.log('✅ Network connectivity test:', response.type);
    return true;
  } catch (error) {
    console.error('❌ Network connectivity failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running all API tests...\n');
  
  const results = {
    health: await testHealth(),
    cors: await testCORS(),
    connectivity: await testNetworkConnectivity(),
    login: await testLogin()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  if (Object.values(results).every(r => r)) {
    console.log('\n🎉 All tests passed! API should be working.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the detailed logs above.');
  }
  
  return results;
}

// Auto-run tests
runAllTests();
