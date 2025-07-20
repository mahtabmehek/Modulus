const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🚀 Running submissions table migration...');

        // Read the migration SQL file
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrations', 'add-submissions-table.sql'),
            'utf8'
        );

        // Execute the migration
        await pool.query(migrationSQL);

        console.log('✅ Migration completed successfully!');

        // Verify tables were created
        const tableCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('user_submissions', 'lab_completions')
            ORDER BY table_name
        `);

        console.log('📊 Created tables:');
        tableCheck.rows.forEach(row => {
            console.log(`  ✓ ${row.table_name}`);
        });

        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
