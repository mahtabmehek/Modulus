const { pool } = require('./backend/db.js');

async function implementManyToManyLabs() {
    try {
        console.log('🔄 Implementing Many-to-Many relationship for Labs and Modules...\n');

        await pool.query('BEGIN');

        // Step 1: Create the junction table
        console.log('1️⃣ Creating module_labs junction table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS module_labs (
                id SERIAL PRIMARY KEY,
                module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
                lab_id INTEGER REFERENCES labs(id) ON DELETE CASCADE,
                order_index INTEGER NOT NULL DEFAULT 0,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(module_id, lab_id),
                UNIQUE(module_id, order_index)
            );
        `);
        console.log('✅ Junction table created');

        // Step 2: Migrate existing data
        console.log('\n2️⃣ Migrating existing lab-module relationships...');
        const existingLabs = await pool.query(`
            SELECT id, module_id, order_index 
            FROM labs 
            WHERE module_id IS NOT NULL
            ORDER BY module_id, order_index;
        `);

        if (existingLabs.rows.length > 0) {
            console.log(`📦 Found ${existingLabs.rows.length} existing lab-module relationships to migrate`);
            
            for (const lab of existingLabs.rows) {
                await pool.query(`
                    INSERT INTO module_labs (module_id, lab_id, order_index)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (module_id, lab_id) DO NOTHING;
                `, [lab.module_id, lab.id, lab.order_index || 0]);
                
                console.log(`   📝 Migrated Lab ${lab.id} → Module ${lab.module_id} (order: ${lab.order_index})`);
            }
        } else {
            console.log('📝 No existing relationships to migrate');
        }

        // Step 3: Update labs table - make module_id and order_index optional/deprecated
        console.log('\n3️⃣ Updating labs table structure...');
        
        // Add a comment to indicate these fields are deprecated
        await pool.query(`
            COMMENT ON COLUMN labs.module_id IS 'DEPRECATED: Use module_labs junction table for module relationships';
        `);
        await pool.query(`
            COMMENT ON COLUMN labs.order_index IS 'DEPRECATED: Use module_labs.order_index for ordering within modules';
        `);
        
        console.log('✅ Added deprecation comments to old columns');

        // Step 4: Create indexes for performance
        console.log('\n4️⃣ Creating performance indexes...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_module_labs_module_id ON module_labs(module_id);
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_module_labs_lab_id ON module_labs(lab_id);
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_module_labs_order ON module_labs(module_id, order_index);
        `);
        console.log('✅ Performance indexes created');

        await pool.query('COMMIT');

        // Step 5: Verify the new structure
        console.log('\n5️⃣ Verifying new structure...');
        const junctionData = await pool.query(`
            SELECT 
                ml.id,
                ml.module_id,
                m.title as module_title,
                ml.lab_id,
                l.title as lab_title,
                ml.order_index,
                ml.added_at
            FROM module_labs ml
            JOIN modules m ON ml.module_id = m.id
            JOIN labs l ON ml.lab_id = l.id
            ORDER BY ml.module_id, ml.order_index;
        `);

        console.log('\n📊 Current module-lab relationships:');
        console.table(junctionData.rows);

        // Show table schema
        const schema = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'module_labs' 
            ORDER BY ordinal_position;
        `);

        console.log('\n📋 Junction table schema:');
        console.table(schema.rows);

        console.log('\n🎉 Many-to-Many implementation complete!');
        console.log('\n📝 What this enables:');
        console.log('   ✅ Single lab can appear in multiple modules');
        console.log('   ✅ Different order_index per module');
        console.log('   ✅ Easy lab reuse across courses');
        console.log('   ✅ Flexible module management');
        console.log('\n🔧 Next steps: Update API endpoints to use junction table');

        process.exit(0);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

implementManyToManyLabs();
