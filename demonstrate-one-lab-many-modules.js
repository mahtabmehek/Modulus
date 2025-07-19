const { pool } = require('./backend/db.js');

async function demonstrateOneLabManyModules() {
    try {
        console.log('🔄 Demonstrating: ONE LAB ID → MANY MODULES\n');

        // Step 1: Create standalone labs first (no module required)
        console.log('1️⃣ Creating standalone labs...');
        
        const labs = [
            { title: 'Security Fundamentals', description: 'Learn basic cybersecurity principles' },
            { title: 'Database Basics', description: 'Introduction to databases and SQL' },
            { title: 'Web Development Intro', description: 'HTML, CSS, and JavaScript basics' }
        ];

        const createdLabs = [];
        for (let i = 0; i < labs.length; i++) {
            const lab = labs[i];
            const result = await pool.query(`
                INSERT INTO labs (title, description, is_published, estimated_minutes, points_possible, order_index)
                VALUES ($1, $2, true, 60, 100, $3)
                RETURNING id, title;
            `, [lab.title, lab.description, i + 1]);
            
            createdLabs.push(result.rows[0]);
            console.log(`   ✅ Created Lab: ${result.rows[0].title} (ID: ${result.rows[0].id})`);
        }

        // Step 2: Create simple modules (without course dependency for now)
        console.log('\n2️⃣ Creating test modules...');
        
        // Create a simple course first
        let courseId;
        try {
            const courseResult = await pool.query(`
                INSERT INTO courses (title, code, description, department, academic_level, duration, total_credits)
                VALUES ('Simple Test Course', 'SIMPLE-001', 'Test course', 'CS', 'undergraduate', 16, 3)
                RETURNING id;
            `);
            courseId = courseResult.rows[0].id;
        } catch (error) {
            // If course creation fails, try to use an existing one
            console.log('   Using existing course...');
            const existingCourse = await pool.query('SELECT id FROM courses LIMIT 1');
            if (existingCourse.rows.length === 0) {
                console.log('   ❌ No courses available. Skipping course-dependent modules.');
                courseId = null;
            } else {
                courseId = existingCourse.rows[0].id;
            }
        }

        // Create modules or simulate them
        const moduleIds = [];
        if (courseId) {
            const modules = ['Web Development', 'Database Management', 'Cybersecurity', 'Full Stack Development'];
            
            for (let i = 0; i < modules.length; i++) {
                try {
                    const result = await pool.query(`
                        INSERT INTO modules (course_id, title, description, order_index, is_published)
                        VALUES ($1, $2, $3, $4, true)
                        RETURNING id, title;
                    `, [courseId, modules[i], `Module for ${modules[i]}`, i + 1]);
                    
                    moduleIds.push(result.rows[0].id);
                    console.log(`   ✅ Created Module: ${result.rows[0].title} (ID: ${result.rows[0].id})`);
                } catch (error) {
                    console.log(`   ⚠️ Could not create module: ${modules[i]}`);
                }
            }
        }

        if (moduleIds.length === 0) {
            console.log('   📝 No modules created, using mock IDs for demonstration');
            moduleIds.push(1, 2, 3, 4);
        }

        // Step 3: THE MAGIC - One Lab in Multiple Modules
        console.log('\n3️⃣ 🎯 DEMONSTRATING: One Lab ID → Multiple Modules');
        
        const securityLab = createdLabs[0]; // Security Fundamentals lab
        const targetModules = moduleIds.slice(0, 3); // First 3 modules
        
        console.log(`\n🧪 Taking Lab "${securityLab.title}" (ID: ${securityLab.id})`);
        console.log(`📚 Adding it to ${targetModules.length} different modules:\n`);

        // Add the same lab to multiple modules with different orders
        const relationships = [
            { moduleId: targetModules[0], order: 1, position: 'First' },
            { moduleId: targetModules[1], order: 3, position: 'Third' },
            { moduleId: targetModules[2], order: 2, position: 'Second' }
        ];

        for (const rel of relationships) {
            try {
                await pool.query(`
                    INSERT INTO module_labs (module_id, lab_id, order_index)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (module_id, lab_id) DO UPDATE SET order_index = EXCLUDED.order_index;
                `, [rel.moduleId, securityLab.id, rel.order]);
                
                console.log(`   🔗 Module ${rel.moduleId}: Position ${rel.order} (${rel.position})`);
            } catch (error) {
                console.log(`   ⚠️ Could not add to module ${rel.moduleId}: ${error.message}`);
            }
        }

        // Step 4: Verify the Many-to-Many relationship
        console.log('\n4️⃣ 🔍 Verification - Where does this lab appear?');
        
        const labLocations = await pool.query(`
            SELECT 
                ml.module_id,
                ml.order_index,
                ml.added_at,
                COALESCE(m.title, 'Unknown Module') as module_title
            FROM module_labs ml
            LEFT JOIN modules m ON ml.module_id = m.id
            WHERE ml.lab_id = $1
            ORDER BY ml.module_id;
        `, [securityLab.id]);

        console.log(`\n📍 Lab "${securityLab.title}" (ID: ${securityLab.id}) appears in:`);
        labLocations.rows.forEach(location => {
            console.log(`   📚 Module ${location.module_id} (${location.module_title}) - Position ${location.order_index}`);
        });

        // Step 5: Show all relationships in the junction table
        console.log('\n5️⃣ 📊 Complete Junction Table View:');
        
        const allRelationships = await pool.query(`
            SELECT 
                ml.id as junction_id,
                ml.lab_id,
                l.title as lab_title,
                ml.module_id,
                COALESCE(m.title, 'Unknown') as module_title,
                ml.order_index,
                ml.added_at::date as date_added
            FROM module_labs ml
            JOIN labs l ON ml.lab_id = l.id
            LEFT JOIN modules m ON ml.module_id = m.id
            ORDER BY ml.lab_id, ml.module_id;
        `);

        console.table(allRelationships.rows);

        console.log('\n🎉 SUCCESS! One Lab ID is now used by Multiple Modules!');
        console.log('\n✅ What this demonstrates:');
        console.log('   🔄 Same lab content appears in different modules');
        console.log('   📊 Different ordering per module');
        console.log('   🔗 Flexible Many-to-Many relationship');
        console.log('   💾 Efficient storage (one lab, multiple references)');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

demonstrateOneLabManyModules();
