// Test user achievements API
async function testUserAchievements() {
  try {
    // First get categories to confirm API is working
    const categoriesResponse = await fetch('http://localhost:3001/api/achievements/categories');
    const categories = await categoriesResponse.json();
    console.log('✅ Categories API working:', categories.data.categories.length, 'categories');

    // Test user achievements (this should require auth)
    const userResponse = await fetch('http://localhost:3001/api/achievements/user/1002');
    
    if (userResponse.status === 401) {
      console.log('🔒 User achievements endpoint properly requires authentication');
    } else {
      const userData = await userResponse.json();
      console.log('User achievements response:', userData);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUserAchievements();
