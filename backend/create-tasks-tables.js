const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'modulus',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'mahtab'
});

async function createTasksAndQuestionsTables() {
    try {
        console.log('Creating tasks and questions tables...');

        // Create tasks table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✓ Tasks table created');

        // Create questions table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('flag', 'text', 'file-upload', 'multiple-choice')),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        expected_answer TEXT, -- For flag questions, this stores the flag
        is_required BOOLEAN DEFAULT TRUE, -- Removed optional, now it's required by default
        points INTEGER DEFAULT 0,
        order_index INTEGER NOT NULL DEFAULT 1,
        
        -- File attachments and images
        images TEXT[], -- Array of image file paths
        attachments TEXT[], -- Array of attachment file paths
        
        -- Multiple choice options (stored as JSONB)
        multiple_choice_options JSONB,
        
        -- Hints (stored as array)
        hints TEXT[],
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✓ Questions table created');

        // Create indexes for better performance
        await pool.query('CREATE INDEX IF NOT EXISTS idx_tasks_lab_id ON tasks(lab_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_questions_task_id ON questions(task_id)');
        console.log('✓ Indexes created');

        console.log('\nDatabase schema updated successfully!');
        await pool.end();
    } catch (error) {
        console.error('Error creating tables:', error.message);
        await pool.end();
    }
}

createTasksAndQuestionsTables();
