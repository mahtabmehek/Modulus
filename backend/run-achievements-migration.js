const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function runAchievementsMigration() {
    try {
        console.log('🏆 Running achievements system migration...');

        // Read the migration SQL file
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrations', 'add-achievements-system.sql'),
            'utf8'
        );

        // Execute the migration
        await pool.query(migrationSQL);

        console.log('✅ Achievements migration completed successfully!');

        // Verify tables were created
        const tableCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('achievements', 'user_achievements', 'achievement_categories', 'user_statistics')
            ORDER BY table_name
        `);

        console.log('📊 Created achievement tables:');
        tableCheck.rows.forEach(row => {
            console.log(`  ✓ ${row.table_name}`);
        });

        // Check sample achievements
        const achievementsCount = await pool.query('SELECT COUNT(*) FROM achievements');
        console.log(`📈 Loaded ${achievementsCount.rows[0].count} default achievements`);

        // Check categories
        const categoriesCount = await pool.query('SELECT COUNT(*) FROM achievement_categories');
        console.log(`📂 Loaded ${categoriesCount.rows[0].count} achievement categories`);

        console.log('\n🎯 Achievements system is now ready!');
        console.log('📝 Next steps:');
        console.log('  1. Restart your backend server');
        console.log('  2. Test achievement endpoints at /api/achievements');
        console.log('  3. Integrate achievement checking into lab completion workflow');

        process.exit(0);

    } catch (error) {
        console.error('❌ Achievements migration failed:', error);
        console.error('Full error details:', error.message);
        process.exit(1);
    }
}

runAchievementsMigration();
