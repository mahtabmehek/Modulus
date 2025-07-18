const fetch = require('node-fetch');

async function testCoursesAPI() {
  try {
    console.log('🔄 Testing courses API...');
    
    const response = await fetch('http://localhost:3001/api/courses');
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 API Response:', JSON.stringify(data, null, 2));
      console.log('📋 Courses found:', data.courses?.length || 0);
    } else {
      console.error('❌ API request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testCoursesAPI();
