const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'modulus',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function checkCourseDetails() {
    try {
        console.log('🔍 Checking CS-402 course details...');

        // Get course details
        const courseResult = await pool.query('SELECT * FROM courses WHERE code = $1', ['CS-402']);
        console.log('\n📚 Course CS-402:');
        console.log(courseResult.rows[0]);

        // Get modules for this course
        const modulesResult = await pool.query('SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index', [courseResult.rows[0].id]);
        console.log(`\n📖 Modules (${modulesResult.rows.length} found):`);
        modulesResult.rows.forEach(module => {
            console.log(`- Module ${module.id}: ${module.title} (Published: ${module.is_published})`);
        });

        // Get labs for each module
        for (const module of modulesResult.rows) {
            const labsResult = await pool.query('SELECT * FROM labs WHERE module_id = $1 ORDER BY order_index', [module.id]);
            console.log(`\n🧪 Labs for "${module.title}" (${labsResult.rows.length} found):`);
            labsResult.rows.forEach(lab => {
                console.log(`  - Lab ${lab.id}: ${lab.title} (Published: ${lab.is_published})`);
            });
        }

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
    }
}

checkCourseDetails();
