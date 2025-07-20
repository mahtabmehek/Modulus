const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'modulus',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function populateCourses() {
    try {
        console.log('🔄 Connecting to database...');

        // Check if courses already exist
        const existingCourses = await pool.query('SELECT COUNT(*) FROM courses');
        const courseCount = parseInt(existingCourses.rows[0].count);

        console.log(`📊 Found ${courseCount} existing courses`);

        if (courseCount > 0) {
            console.log('✅ Courses table already populated');
            return;
        }

        console.log('📝 Inserting sample courses...');

        const coursesData = [
            {
                title: 'Digital Forensics Investigation',
                code: 'CS-402',
                description: 'Advanced course in digital forensics covering modern investigation techniques and tools',
                department: 'Computer Science',
                academic_level: 'bachelor',
                duration: 1,
                total_credits: 4
            },
            {
                title: 'Network Security and Defense',
                code: 'CS-301',
                description: 'Foundation course in network security covering firewalls, intrusion detection, and defense strategies',
                department: 'Computer Science',
                academic_level: 'bachelor',
                duration: 1,
                total_credits: 3
            },
            {
                title: 'AWS Cloud Architecture',
                code: 'CC-501',
                description: 'Enterprise-level course covering AWS cloud services and architecture design patterns',
                department: 'Cloud Computing',
                academic_level: 'master',
                duration: 1,
                total_credits: 5
            },
            {
                title: 'DevOps and CI/CD Pipeline Management',
                code: 'CC-401',
                description: 'Practical course in DevOps methodologies covering continuous integration and deployment',
                department: 'Cloud Computing',
                academic_level: 'bachelor',
                duration: 1,
                total_credits: 4
            },
            {
                title: 'Advanced Python for Data Science',
                code: 'CS-501',
                description: 'Advanced Python programming course focusing on data science applications and machine learning',
                department: 'Computer Science',
                academic_level: 'master',
                duration: 1,
                total_credits: 4
            },
            {
                title: 'Web Application Security',
                code: 'CS-403',
                description: 'Specialized course covering web application vulnerabilities and security testing methodologies',
                department: 'Computer Science',
                academic_level: 'bachelor',
                duration: 1,
                total_credits: 3
            },
            {
                title: 'Linux System Administration',
                code: 'SYS-301',
                description: 'Comprehensive Linux administration course covering system management and security',
                department: 'Systems',
                academic_level: 'bachelor',
                duration: 1,
                total_credits: 3
            },
            {
                title: 'Ethical Hacking and Penetration Testing',
                code: 'CS-401',
                description: 'Comprehensive course covering ethical hacking techniques and penetration testing methodologies',
                department: 'Computer Science',
                academic_level: 'bachelor',
                duration: 1,
                total_credits: 4
            }
        ];

        for (const course of coursesData) {
            try {
                await pool.query(`
          INSERT INTO courses (title, code, description, department, academic_level, duration, total_credits, created_by, is_published)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 1, true)
          ON CONFLICT (code) DO NOTHING
        `, [
                    course.title,
                    course.code,
                    course.description,
                    course.department,
                    course.academic_level,
                    course.duration,
                    course.total_credits
                ]);
                console.log(`✅ Added course: ${course.code} - ${course.title}`);
            } catch (error) {
                console.error(`❌ Error adding course ${course.code}:`, error.message);
            }
        }

        // Verify insertion
        const finalCount = await pool.query('SELECT COUNT(*) FROM courses');
        console.log(`🎉 Total courses in database: ${finalCount.rows[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

populateCourses();
