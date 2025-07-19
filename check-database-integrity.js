const { pool } = require('./backend/db.js');

async function checkDatabaseIntegrity() {
    try {
        console.log('🔍 Checking Database Schema Integrity...\n');

        // 1. Check all foreign key constraints
        console.log('1️⃣ Foreign Key Constraints:');
        const foreignKeys = await pool.query(`
            SELECT 
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                tc.constraint_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            ORDER BY tc.table_name, kcu.column_name;
        `);

        console.table(foreignKeys.rows);

        // 2. Check for orphaned records
        console.log('\n2️⃣ Checking for Orphaned Records:');

        // Check courses without valid instructors
        const orphanedCourses = await pool.query(`
            SELECT c.id, c.title, c.instructor_id
            FROM courses c
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE c.instructor_id IS NOT NULL AND u.id IS NULL;
        `);
        console.log(`\n📚 Orphaned Courses (invalid instructor_id): ${orphanedCourses.rows.length}`);
        if (orphanedCourses.rows.length > 0) console.table(orphanedCourses.rows);

        // Check modules without valid courses
        const orphanedModules = await pool.query(`
            SELECT m.id, m.title, m.course_id
            FROM modules m
            LEFT JOIN courses c ON m.course_id = c.id
            WHERE m.course_id IS NOT NULL AND c.id IS NULL;
        `);
        console.log(`\n📖 Orphaned Modules (invalid course_id): ${orphanedModules.rows.length}`);
        if (orphanedModules.rows.length > 0) console.table(orphanedModules.rows);

        // Check labs with old module_id references (deprecated)
        const labsWithOldModuleId = await pool.query(`
            SELECT l.id, l.title, l.module_id
            FROM labs l
            LEFT JOIN modules m ON l.module_id = m.id
            WHERE l.module_id IS NOT NULL AND m.id IS NULL;
        `);
        console.log(`\n🧪 Labs with invalid old module_id: ${labsWithOldModuleId.rows.length}`);
        if (labsWithOldModuleId.rows.length > 0) console.table(labsWithOldModuleId.rows);

        // Check module_labs junction table integrity
        const invalidModuleLabs = await pool.query(`
            SELECT ml.id, ml.module_id, ml.lab_id
            FROM module_labs ml
            LEFT JOIN modules m ON ml.module_id = m.id
            LEFT JOIN labs l ON ml.lab_id = l.id
            WHERE m.id IS NULL OR l.id IS NULL;
        `);
        console.log(`\n🔗 Invalid Module-Lab relationships: ${invalidModuleLabs.rows.length}`);
        if (invalidModuleLabs.rows.length > 0) console.table(invalidModuleLabs.rows);

        // 3. Check table row counts
        console.log('\n3️⃣ Table Row Counts:');
        const tables = ['courses', 'modules', 'labs', 'module_labs', 'users'];
        for (const table of tables) {
            const count = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`   📊 ${table}: ${count.rows[0].count} rows`);
        }

        // 4. Check data integrity examples
        console.log('\n4️⃣ Data Integrity Examples:');

        // Show course → modules → labs chain
        const courseChain = await pool.query(`
            SELECT 
                c.id as course_id,
                c.title as course_title,
                COUNT(DISTINCT m.id) as module_count,
                COUNT(DISTINCT ml.lab_id) as unique_labs_count,
                COUNT(ml.id) as total_lab_instances
            FROM courses c
            LEFT JOIN modules m ON c.id = m.course_id
            LEFT JOIN module_labs ml ON m.id = ml.module_id
            GROUP BY c.id, c.title
            ORDER BY c.id
            LIMIT 5;
        `);

        console.log('\n📊 Course → Module → Lab Relationships:');
        console.table(courseChain.rows);

        // 5. Check if old and new systems coexist
        console.log('\n5️⃣ Migration Status:');

        const oldSystemLabs = await pool.query(`
            SELECT COUNT(*) as count 
            FROM labs 
            WHERE module_id IS NOT NULL;
        `);

        const newSystemLabs = await pool.query(`
            SELECT COUNT(DISTINCT lab_id) as count 
            FROM module_labs;
        `);

        console.log(`   🗂️  Labs using old system (direct module_id): ${oldSystemLabs.rows[0].count}`);
        console.log(`   🆕 Labs using new system (junction table): ${newSystemLabs.rows[0].count}`);

        // 6. Performance check on junction table
        console.log('\n6️⃣ Junction Table Performance:');
        const junctionStats = await pool.query(`
            SELECT 
                COUNT(*) as total_relationships,
                COUNT(DISTINCT lab_id) as unique_labs,
                COUNT(DISTINCT module_id) as unique_modules,
                ROUND(COUNT(*)::numeric / COUNT(DISTINCT lab_id), 2) as avg_modules_per_lab
            FROM module_labs;
        `);

        console.table(junctionStats.rows);

        console.log('\n✅ Schema Integrity Check Complete!');

        // Summary
        const issues = orphanedCourses.rows.length + orphanedModules.rows.length +
            labsWithOldModuleId.rows.length + invalidModuleLabs.rows.length;

        if (issues === 0) {
            console.log('🎉 No integrity issues found - schema is healthy!');
        } else {
            console.log(`⚠️  Found ${issues} potential integrity issues that may need attention.`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking database integrity:', error.message);
        process.exit(1);
    }
}

checkDatabaseIntegrity();
