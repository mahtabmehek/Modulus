const { pool } = require('./db');

async function checkCourseModules() {
    try {
        console.log('🔍 Checking course WHZ_6 and its modules...');

        // Get course by code
        const course = await pool.query('SELECT * FROM courses WHERE code = $1', ['WHZ_6']);
        console.log('📚 Course found:', course.rows[0]);

        if (course.rows[0]) {
            // Get modules for this course
            const modules = await pool.query('SELECT * FROM modules WHERE course_id = $1', [course.rows[0].id]);
            console.log(`📖 Modules for course ${course.rows[0].code}:`, modules.rows.length);
            modules.rows.forEach((module, index) => {
                console.log(`  ${index + 1}. ${module.title} (ID: ${module.id}, Order: ${module.order_index})`);
            });

            // Check what labs actually exist
            const allLabs = await pool.query('SELECT id, title FROM labs ORDER BY id');
            console.log('\n🧪 All labs in database:');
            allLabs.rows.forEach(lab => {
                console.log(`  - ID ${lab.id}: ${lab.title}`);
            });

            // Check what's in module_labs table
            const moduleLabsJoins = await pool.query('SELECT * FROM module_labs');
            console.log('\n🔗 Module-Labs relationships:');
            moduleLabsJoins.rows.forEach(rel => {
                console.log(`  - Module ${rel.module_id} <-> Lab ${rel.lab_id} (order: ${rel.order_index})`);
            });
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

checkCourseModules();
