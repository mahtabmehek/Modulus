#!/usr/bin/env node

// Database schema initialization script for Modulus LMS

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'modulus-db.cziw68k8m79u.eu-west-2.rds.amazonaws.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'modulus',
  user: process.env.DB_USERNAME || 'modulusadmin',
  password: process.env.DB_PASSWORD, // Will be set from AWS Secrets Manager
  ssl: {
    rejectUnauthorized: false
  }
};

async function initializeSchema() {
  console.log('🔧 Initializing Modulus LMS Database Schema');
  console.log('============================================');
  
  // Create database connection
  const pool = new Pool(dbConfig);
  
  try {
    // Test connection
    console.log('📡 Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log(`✅ Connected to database at ${result.rows[0].now}`);
    client.release();
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Schema file loaded successfully');
    
    // Execute schema
    console.log('🚀 Executing database schema...');
    await pool.query(schemaSQL);
    console.log('✅ Schema executed successfully');
    
    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📊 Created tables:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    console.log('🎉 Database schema initialization complete!');
    
  } catch (error) {
    console.error('❌ Schema initialization failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeSchema().catch(console.error);
}

module.exports = { initializeSchema };
