const { pool } = require('./backend/db');

(async () => {
  try {
    // Check if modules are published  
    const modulesResult = await pool.query(`
      SELECT id, title, course_id, is_published 
      FROM modules 
      ORDER BY course_id, id
    `);
    console.log('Module publication status:', modulesResult.rows);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();
