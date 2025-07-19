const jwt = require('jsonwebtoken');

const JWT_SECRET = 'modulus-lms-secret-key-change-in-production';

// Generate student token
const studentToken = jwt.sign({
  id: 1001,
  email: 'student@test.com',
  role: 'student'
}, JWT_SECRET);

console.log('Testing Lab API...');
console.log('Token generated for student@test.com');

// Test the lab API endpoint
async function testLabAPI() {
  try {
    const response = await fetch('http://localhost:3001/api/labs/106', {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('\n=== LAB API TEST RESULTS ===');
    console.log('✅ API Response successful');
    console.log(`📋 Lab Title: ${data.data.title}`);
    console.log(`📝 Lab Description: ${data.data.description}`);
    console.log(`🕒 Estimated Time: ${data.data.estimated_minutes} minutes`);
    console.log(`🏆 Points Possible: ${data.data.points_possible}`);
    
    if (data.data.tasks && data.data.tasks.length > 0) {
      console.log(`\n📋 Tasks Found: ${data.data.tasks.length}`);
      data.data.tasks.forEach((task, index) => {
        console.log(`\n  Task ${index + 1}: ${task.title} (ID: ${task.id})`);
        console.log(`    Description: ${task.description}`);
        
        if (task.questions && task.questions.length > 0) {
          console.log(`    Questions: ${task.questions.length}`);
          task.questions.forEach((q, qIndex) => {
            console.log(`      Q${qIndex + 1}: ${q.title} (${q.points} pts)`);
            console.log(`        Type: ${q.type}`);
            if (q.flag) {
              console.log(`        Expected Answer: ${q.flag}`);
            }
          });
        }
      });
    } else {
      console.log('\n❌ No tasks found in lab data');
    }
    
    console.log('\n=== END TEST ===');
    
  } catch (error) {
    console.error('❌ Error testing lab API:', error.message);
  }
}

testLabAPI();
