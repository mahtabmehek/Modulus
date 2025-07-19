const { pool } = require('./backend/db');

(async () => {
  try {
    // Check if courses are published
    const coursesResult = await pool.query(`
      SELECT id, title, code, is_published 
      FROM courses 
      ORDER BY id
    `);
    console.log('Course publication status:', coursesResult.rows);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();
