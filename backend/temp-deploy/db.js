const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    },
    // Connection pool settings for better performance
    max: 10, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // return an error after 10 seconds if connection could not be established
    // Keep connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
});

// Enhanced connection testing with retry logic
async function testConnection() {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            const client = await pool.connect();
            console.log('Database connection successful');
            await client.query('SELECT NOW()');
            client.release();
            return true;
        } catch (error) {
            retries++;
            console.error(`Connection attempt ${retries} failed:`, error.message);
            if (retries < maxRetries) {
                console.log(`Retrying in 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                console.error('All connection attempts failed');
                throw error;
            }
        }
    }
}

module.exports = { pool, testConnection };
