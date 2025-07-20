const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'modulus',
  user: 'postgres',
  password: 'mahtab'
});

async function fixLabIcons() {
  try {
    console.log('🔧 Fixing lab icon file locations...');
    
    // Get labs with icon paths that don't have actual files
    const result = await pool.query('SELECT id, title, icon_path FROM labs WHERE icon_path IS NOT NULL');
    
    for (const lab of result.rows) {
      if (!lab.icon_path) continue;
      
      console.log(`\n📋 Processing Lab ${lab.id}: "${lab.title}"`);
      console.log(`📁 Expected path: ${lab.icon_path}`);
      
      // Check if file exists at expected location
      const expectedPath = path.join(__dirname, lab.icon_path);
      const exists = fs.existsSync(expectedPath);
      
      console.log(`📁 File exists at expected location: ${exists}`);
      
      if (!exists) {
        // Extract filename from path
        const filename = path.basename(lab.icon_path);
        console.log(`📎 Looking for file: ${filename}`);
        
        // Check if file exists in unnamed-lab directory
        const unnamedLabPath = path.join(__dirname, 'uploads/labs/unnamed-lab', filename);
        const existsInUnnamed = fs.existsSync(unnamedLabPath);
        
        console.log(`📁 File exists in unnamed-lab: ${existsInUnnamed}`);
        
        if (existsInUnnamed) {
          // Create the expected directory
          const expectedDir = path.dirname(expectedPath);
          if (!fs.existsSync(expectedDir)) {
            fs.mkdirSync(expectedDir, { recursive: true });
            console.log(`📁 Created directory: ${expectedDir}`);
          }
          
          // Copy file to expected location
          fs.copyFileSync(unnamedLabPath, expectedPath);
          console.log(`✅ Copied ${filename} to correct location`);
        } else {
          console.log(`❌ File ${filename} not found in unnamed-lab directory`);
        }
      } else {
        console.log(`✅ File already in correct location`);
      }
    }
    
    console.log('\n🎉 Icon fix complete!');
    pool.end();
  } catch (error) {
    console.error('❌ Error fixing icons:', error);
    pool.end();
  }
}

fixLabIcons();
