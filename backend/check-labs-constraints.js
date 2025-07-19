const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'modulus',
    password: 'mahtab',
    port: 5432,
});

async function checkLabsConstraints() {
    try {
        console.log('Checking labs table constraints...');

        // Check constraint definition
        const constraintQuery = `
      SELECT conname, pg_get_constraintdef(oid) as constraint_def
      FROM pg_constraint 
      WHERE conname = 'labs_lab_type_check'
    `;

        const constraintResult = await pool.query(constraintQuery);
        console.log('Constraint info:', constraintResult.rows);

        // Check labs table data
        const labsQuery = `SELECT id, title, lab_type FROM labs LIMIT 10`;
        const labsResult = await pool.query(labsQuery);
        console.log('Sample labs data:', labsResult.rows);

        // Check for any invalid lab_type values
        const invalidQuery = `
      SELECT id, title, lab_type 
      FROM labs 
      WHERE lab_type NOT IN ('container', 'virtual_machine', 'simulation')
    `;

        const invalidResult = await pool.query(invalidQuery);
        console.log('Invalid lab_type values:', invalidResult.rows);

        await pool.end();
        console.log('Database connection closed.');

    } catch (error) {
        console.error('Error:', error);
        await pool.end();
    }
}

checkLabsConstraints();
