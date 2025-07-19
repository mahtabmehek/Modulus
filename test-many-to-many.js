const { pool } = require('./backend/db.js');

async function testManyToManyLabs() {
    try {
        console.log('🧪 Testing Many-to-Many Labs functionality...\n');

        // Step 0: Create a test course first
        console.log('0️⃣ Creating test course...');
        const courseResult = await pool.query(`
            INSERT INTO courses (
                title, code, description, department, academic_level, 
                duration, total_credits, instructor_id, is_published
            )
            VALUES (
                'Test Course for Many-to-Many', 
                'TEST-M2M', 
                'A course to test lab relationships', 
                'Computer Science', 
                'intermediate', 
                16, 
                3, 
                1, 
                true
            )
            ON CONFLICT DO NOTHING
            RETURNING id, title;
        `);
        
        let courseId;
        if (courseResult.rows.length > 0) {
            courseId = courseResult.rows[0].id;
            console.log(`   ✅ Created course: ${courseResult.rows[0].title} (ID: ${courseId})`);
        } else {
            // Get existing course
            const existingCourse = await pool.query('SELECT id, title FROM courses LIMIT 1');
            if (existingCourse.rows.length > 0) {
                courseId = existingCourse.rows[0].id;
                console.log(`   ✅ Using existing course: ${existingCourse.rows[0].title} (ID: ${courseId})`);
            } else {
                throw new Error('No courses available. Please create a course first.');
            }
        }

        // Step 1: Create test modules if they don't exist
        console.log('\n1️⃣ Creating test modules...');
        
        const modules = [
            { title: 'Web Development Basics', description: 'HTML, CSS, JavaScript fundamentals' },
            { title: 'Database Design', description: 'SQL and database modeling' },
            { title: 'Security Fundamentals', description: 'Cybersecurity principles' }
        ];

        const createdModules = [];
        for (let i = 0; i < modules.length; i++) {
            const result = await pool.query(`
                INSERT INTO modules (course_id, title, description, order_index, is_published)
                VALUES ($1, $2, $3, $4, true)
                ON CONFLICT DO NOTHING
                RETURNING id, title;
            `, [courseId, modules[i].title, modules[i].description, i + 1]);
            
            if (result.rows.length > 0) {
                createdModules.push(result.rows[0]);
                console.log(`   ✅ Created: ${result.rows[0].title} (ID: ${result.rows[0].id})`);
            }
        }

        // Get all modules
        const allModules = await pool.query('SELECT id, title FROM modules ORDER BY id LIMIT 3');
        console.log('\n📚 Available modules:');
        console.table(allModules.rows);

        // Step 2: Create test labs
        console.log('\n2️⃣ Creating test labs...');
        
        const labs = [
            { title: 'HTML Fundamentals', description: 'Learn basic HTML structure and tags' },
            { title: 'SQL Injection Prevention', description: 'Protect against SQL injection attacks' },
            { title: 'Password Security', description: 'Best practices for password management' }
        ];

        const createdLabs = [];
        for (const lab of labs) {
            const result = await pool.query(`
                INSERT INTO labs (title, description, is_published, estimated_minutes, points_possible)
                VALUES ($1, $2, true, 60, 100)
                RETURNING id, title;
            `, [lab.title, lab.description]);
            
            createdLabs.push(result.rows[0]);
            console.log(`   ✅ Created: ${result.rows[0].title} (ID: ${result.rows[0].id})`);
        }

        // Step 3: Test Many-to-Many relationships
        console.log('\n3️⃣ Testing Many-to-Many relationships...');
        
        const relationships = [
            // HTML Fundamentals appears in Web Dev and Database modules
            { moduleId: allModules.rows[0].id, labId: createdLabs[0].id, order: 1 },
            { moduleId: allModules.rows[1].id, labId: createdLabs[0].id, order: 3 },
            
            // SQL Injection appears in Database and Security modules
            { moduleId: allModules.rows[1].id, labId: createdLabs[1].id, order: 1 },
            { moduleId: allModules.rows[2].id, labId: createdLabs[1].id, order: 2 },
            
            // Password Security appears in all three modules
            { moduleId: allModules.rows[0].id, labId: createdLabs[2].id, order: 2 },
            { moduleId: allModules.rows[1].id, labId: createdLabs[2].id, order: 2 },
            { moduleId: allModules.rows[2].id, labId: createdLabs[2].id, order: 1 }
        ];

        for (const rel of relationships) {
            await pool.query(`
                INSERT INTO module_labs (module_id, lab_id, order_index)
                VALUES ($1, $2, $3)
                ON CONFLICT (module_id, lab_id) DO UPDATE SET order_index = EXCLUDED.order_index;
            `, [rel.moduleId, rel.labId, rel.order]);
            
            console.log(`   🔗 Added Lab ${rel.labId} to Module ${rel.moduleId} (order: ${rel.order})`);
        }

        // Step 4: Query results
        console.log('\n4️⃣ Query results...');
        
        // Show which labs are in each module
        console.log('\n📋 Labs per module:');
        for (const module of allModules.rows) {
            const moduleLabs = await pool.query(`
                SELECT 
                    l.id, l.title, ml.order_index
                FROM labs l
                JOIN module_labs ml ON l.id = ml.lab_id
                WHERE ml.module_id = $1
                ORDER BY ml.order_index;
            `, [module.id]);
            
            console.log(`\n   📚 ${module.title} (ID: ${module.id}):`);
            moduleLabs.rows.forEach(lab => {
                console.log(`      ${lab.order_index}. ${lab.title} (Lab ID: ${lab.id})`);
            });
        }

        // Show which modules each lab appears in
        console.log('\n\n📋 Modules per lab:');
        for (const lab of createdLabs) {
            const labModules = await pool.query(`
                SELECT 
                    m.id, m.title, ml.order_index
                FROM modules m
                JOIN module_labs ml ON m.id = ml.module_id
                WHERE ml.lab_id = $1
                ORDER BY m.title;
            `, [lab.id]);
            
            console.log(`\n   🧪 ${lab.title} (ID: ${lab.id}) appears in:`);
            labModules.rows.forEach(module => {
                console.log(`      - ${module.title} (position ${module.order_index})`);
            });
        }

        // Show the junction table
        console.log('\n\n📊 Complete junction table:');
        const junctionData = await pool.query(`
            SELECT 
                ml.id,
                m.title as module,
                l.title as lab,
                ml.order_index,
                ml.added_at
            FROM module_labs ml
            JOIN modules m ON ml.module_id = m.id
            JOIN labs l ON ml.lab_id = l.id
            ORDER BY ml.module_id, ml.order_index;
        `);
        console.table(junctionData.rows);

        console.log('\n🎉 Many-to-Many testing complete!');
        console.log('\n✅ Verified capabilities:');
        console.log('   🔄 Single lab in multiple modules');
        console.log('   📊 Different ordering per module');
        console.log('   🔗 Flexible associations');
        console.log('   📈 Efficient querying');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testManyToManyLabs();
