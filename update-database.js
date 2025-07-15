const { Pool } = require('pg');

const pool = new Pool({
    host: 'modulus-aurora-cluster.cluster-cziw68k8m79u.eu-west-2.rds.amazonaws.com',
    port: 5432,
    user: 'modulus_admin',
    password: 'ModulusAurora2025!',
    database: 'modulus',
    ssl: false
});

async function updateDatabase() {
    try {
        console.log('Connecting to database...');

        // Add missing columns
        const alterQuery = `
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS department VARCHAR(255),
      ADD COLUMN IF NOT EXISTS course_code VARCHAR(100);
    `;

        await pool.query(alterQuery);
        console.log('Successfully added department and course_code columns!');

        // Verify the structure
        const describeQuery = `
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;

        const result = await pool.query(describeQuery);
        console.log('\nCurrent users table structure:');
        console.table(result.rows);

    } catch (error) {
        console.error('Error updating database:', error);
    } finally {
        await pool.end();
    }
}

updateDatabase();
