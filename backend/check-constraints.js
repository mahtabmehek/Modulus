const { pool } = require('./db');

async function checkConstraints() {
  try {
    const result = await pool.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'courses'
    `);
    
    console.log('Tables that reference courses:');
    console.log(result.rows);
    
    // Also check which courses exist
    const courses = await pool.query('SELECT id, title FROM courses ORDER BY id');
    console.log('\nExisting courses:');
    console.log(courses.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkConstraints();
