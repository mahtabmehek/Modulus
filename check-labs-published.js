const { pool } = require('./backend/db');

(async () => {
    try {
        // Check if labs have is_published column and their status
        const labsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'labs' AND column_name = 'is_published'
    `);
        console.log('Labs has is_published column:', labsResult.rows.length > 0);

        if (labsResult.rows.length === 0) {
            console.log('Labs table does not have is_published column - removing filter');
        } else {
            const labStatusResult = await pool.query(`
        SELECT id, title, module_id, is_published 
        FROM labs 
        LIMIT 5
      `);
            console.log('Lab publication status (sample):', labStatusResult.rows);
        }

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
    }
})();
