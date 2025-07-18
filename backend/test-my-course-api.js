const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'modulus-lms-secret-key-change-in-production';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'modulus',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function testMyCourseAPI() {
  try {
    console.log('🧪 Testing /my-course API endpoint...');

    // Generate a token for the student
    const token = jwt.sign(
      { 
        id: 1001, 
        email: 'student@test.com', 
        role: 'student' 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Generated token for student');

    // Make HTTP request to the endpoint
    const https = require('http');
    const postData = '';

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/courses/my-course',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        try {
          const jsonResponse = JSON.parse(data);
          console.log('✅ API Response:', JSON.stringify(jsonResponse, null, 2));
        } catch (e) {
          console.log('Response data:', data);
        }
        process.exit(0);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      process.exit(1);
    });

    req.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testMyCourseAPI();
