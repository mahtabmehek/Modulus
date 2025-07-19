const { pool } = require('./backend/db.js');

async function checkAcademicLevels() {
    try {
        const result = await pool.query(`
            SELECT conname, consrc 
            FROM pg_constraint 
            WHERE conname LIKE '%academic_level%';
        `);

        console.log('Academic level constraints:');
        console.table(result.rows);

        // Also check existing courses to see what values are used
        const existingCourses = await pool.query(`
            SELECT DISTINCT academic_level 
            FROM courses 
            WHERE academic_level IS NOT NULL;
        `);

        console.log('\nExisting academic levels in use:');
        console.table(existingCourses.rows);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkAcademicLevels();
