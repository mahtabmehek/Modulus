const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'modulus',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'mahtab'
});

async function checkLabStorage() {
    try {
        console.log('=== CHECKING LAB DATA STORAGE ===');

        // Get a sample lab with all its data
        const labResult = await pool.query(`
      SELECT l.*, m.title as module_title, c.title as course_title 
      FROM labs l 
      LEFT JOIN modules m ON l.module_id = m.id 
      LEFT JOIN courses c ON m.course_id = c.id 
      WHERE l.title LIKE '%Digital Evidence%' OR l.title LIKE '%Database Icon%'
      ORDER BY l.id DESC 
      LIMIT 2
    `);

        console.log('Sample labs from Digital Forensics:');
        labResult.rows.forEach(lab => {
            console.log(`\n--- Lab: ${lab.title} ---`);
            console.log(`ID: ${lab.id}`);
            console.log(`Module: ${lab.module_title}`);
            console.log(`Course: ${lab.course_title}`);
            console.log(`Published: ${lab.is_published}`);
            console.log(`Icon URL: ${lab.icon_url}`);
            console.log(`VM Image: ${lab.vm_image}`);
            console.log(`Tags: ${lab.tags}`);
            console.log(`Instructions: ${lab.instructions ? lab.instructions.substring(0, 100) + '...' : 'None'}`);
            console.log(`Description: ${lab.description ? lab.description.substring(0, 100) + '...' : 'None'}`);
        });

        console.log('\n=== CHECKING TASK/QUESTION STORAGE ===');

        // Check if we have a tasks table or if tasks are stored in instructions
        try {
            const tasksResult = await pool.query('SELECT * FROM tasks WHERE lab_id IS NOT NULL LIMIT 3');
            console.log('Tasks table exists with data:', tasksResult.rows.length > 0);
            if (tasksResult.rows.length > 0) {
                console.log('Sample task:', tasksResult.rows[0]);
            }
        } catch (error) {
            console.log('Tasks table does not exist or is empty');
        }

        // Check for questions table
        try {
            const questionsResult = await pool.query('SELECT * FROM questions WHERE task_id IS NOT NULL LIMIT 3');
            console.log('Questions table exists with data:', questionsResult.rows.length > 0);
            if (questionsResult.rows.length > 0) {
                console.log('Sample question:', questionsResult.rows[0]);
            }
        } catch (error) {
            console.log('Questions table does not exist or is empty');
        }

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
    }
}

checkLabStorage();
