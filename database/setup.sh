#!/bin/bash
# Modulus LMS Database Setup Script
# Created: July 18, 2025

echo "🗄️ Modulus LMS PostgreSQL Database Setup"
echo "=========================================="

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL first:"
    echo "- Windows: Download from https://www.postgresql.org/download/windows/"
    echo "- macOS: brew install postgresql"
    echo "- Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

echo "✅ PostgreSQL found"

# Database configuration
DB_NAME="modulus"
DB_USER="postgres"
DB_PASSWORD="mahtab"

echo "📋 Database Configuration:"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Host: localhost"
echo "   Port: 5432"
echo ""

# Check if database exists
if psql -U $DB_USER -h localhost -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "⚠️  Database '$DB_NAME' already exists!"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Dropping existing database..."
        dropdb -U $DB_USER -h localhost $DB_NAME
        echo "✅ Database dropped"
    else
        echo "❌ Setup cancelled"
        exit 1
    fi
fi

# Create database
echo "🏗️  Creating database '$DB_NAME'..."
createdb -U $DB_USER -h localhost $DB_NAME

if [ $? -eq 0 ]; then
    echo "✅ Database created successfully"
else
    echo "❌ Failed to create database"
    exit 1
fi

# Run schema script
echo "📊 Creating database schema..."
psql -U $DB_USER -h localhost -d $DB_NAME -f database/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema created successfully"
else
    echo "❌ Failed to create schema"
    exit 1
fi

# Run test data script
echo "👥 Inserting test data..."
psql -U $DB_USER -h localhost -d $DB_NAME -f database/test_data.sql

if [ $? -eq 0 ]; then
    echo "✅ Test data inserted successfully"
else
    echo "❌ Failed to insert test data"
    exit 1
fi

# Verify setup
echo "🔍 Verifying database setup..."
psql -U $DB_USER -h localhost -d $DB_NAME -c "
SELECT 
    'Tables created: ' || COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public';

SELECT 'Test users created: ' || COUNT(*) FROM users;
SELECT 'Courses available: ' || COUNT(*) FROM courses;
SELECT 'Labs available: ' || COUNT(*) FROM labs;
"

echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "📝 Test Credentials:"
echo "   Admin: admin@test.com / Mahtabmehek@1337"
echo "   Instructor: instructor@test.com / Mahtabmehek@1337"
echo "   Student: student@test.com / Mahtabmehek@1337"
echo "   Staff: staff@test.com / Mahtabmehek@1337"
echo ""
echo "🚀 Next steps:"
echo "   1. Configure backend/.env file"
echo "   2. Start backend server: cd backend && npm start"
echo "   3. Start frontend server: npm run dev"
echo "   4. Access application: http://localhost:3002"
echo ""
