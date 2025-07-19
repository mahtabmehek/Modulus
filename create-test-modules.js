const { pool } = require('./backend/db.js');

async function createTestModules() {
    try {
        // First check if there are any courses
        const courses = await pool.query('SELECT id, title FROM courses ORDER BY id LIMIT 5');
        
        if (courses.rows.length === 0) {
            console.log('No courses found. Creating a test course first...');
            
            // Create a test course
            const courseResult = await pool.query(`
                INSERT INTO courses (title, description, instructor_id, is_published)
                VALUES ('Test Course', 'A test course for lab creation', 1, true)
                RETURNING id, title;
            `);
            
            console.log('Created test course:', courseResult.rows[0]);
            courses.rows.push(courseResult.rows[0]);
        }
        
        console.log('Available courses:');
        console.table(courses.rows);
        
        // Create test modules for the first course
        const courseId = courses.rows[0].id;
        
        const modules = [
            { title: 'Introduction to Programming', description: 'Basic programming concepts' },
            { title: 'Data Structures', description: 'Arrays, lists, and basic data structures' },
            { title: 'Algorithms', description: 'Sorting and searching algorithms' }
        ];
        
        console.log(`\nCreating ${modules.length} test modules for course ${courseId}...`);
        
        for (let i = 0; i < modules.length; i++) {
            const module = modules[i];
            const result = await pool.query(`
                INSERT INTO modules (course_id, title, description, order_index, is_published)
                VALUES ($1, $2, $3, $4, true)
                RETURNING id, title;
            `, [courseId, module.title, module.description, i + 1]);
            
            console.log(`Created module: ${result.rows[0].title} (ID: ${result.rows[0].id})`);
        }
        
        // Show final modules
        const finalModules = await pool.query(`
            SELECT m.id, m.title, m.course_id, c.title as course_title, m.order_index 
            FROM modules m
            JOIN courses c ON m.course_id = c.id
            ORDER BY m.course_id, m.order_index;
        `);
        
        console.log('\nAll modules in database:');
        console.table(finalModules.rows);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

createTestModules();
