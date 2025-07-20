# Modulus LMS - Local Setup Guide

## 🎉 Congratulations! AWS has been completely removed from Modulus LMS

All AWS services have been replaced with local alternatives. You'll save approximately **$20-45/month** by running everything locally.

## 📋 What Changed

### ✅ Removed AWS Services:
- ❌ AWS RDS Aurora (PostgreSQL) → ✅ Local PostgreSQL
- ❌ AWS Cognito Authentication → ✅ Local JWT Authentication  
- ❌ AWS Lambda Functions → ✅ Local Express.js API
- ❌ AWS S3 Storage → ✅ Local file storage
- ❌ AWS CloudWatch → ✅ Local console logging
- ❌ AWS Amplify → ✅ Local Next.js development server

### 🔧 Updated Configuration:
- Frontend: Removed all AWS SDK dependencies
- Backend: Removed Cognito, RDS Data API, serverless-http
- Authentication: Simple JWT-based system
- Database: Direct PostgreSQL connection

## 🚀 Quick Setup

### 1. Install PostgreSQL
```powershell
# Option 1: Download from official site
# https://www.postgresql.org/download/windows/

# Option 2: Use Chocolatey
choco install postgresql

# Option 3: Use Scoop
scoop install postgresql
```

### 2. Setup Database
```powershell
# Run the automated setup script
.\setup-postgresql.ps1
```

### 3. Install Dependencies
```powershell
# Frontend dependencies
npm install

# Backend dependencies
cd backend
npm install
cd ..
```

### 4. Start the Application
```powershell
# Terminal 1: Start backend
npm run backend

# Terminal 2: Start frontend  
npm run dev
```

## 🔐 Default Login Credentials

### Admin Account
- **Email:** admin@modulus.com
- **Password:** admin123
- **Role:** Admin

### Test User Creation
Visit `http://localhost:3000` and create new accounts with these access codes:

- **Student:** student2025
- **Instructor:** instructor2025  
- **Staff:** staff2025
- **Admin:** mahtabmehek1337

## 🛠️ Manual Database Setup (if script fails)

```sql
-- Connect to PostgreSQL as postgres user
psql -U postgres

-- Create database
CREATE DATABASE modulus;

-- Connect to the database
\c modulus

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
VALUES ('admin@modulus.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin', true);
```

## 📁 Project Structure

```
/
├── frontend (Next.js)
│   ├── src/components/auth/local-auth.tsx
│   ├── src/components/providers/local-auth-provider.tsx
│   └── .env.local (local configuration)
├── backend (Express.js)
│   ├── server.js (local PostgreSQL connection)
│   ├── routes/auth.js (JWT authentication)
│   └── .env (local database config)
└── setup-postgresql.ps1 (database setup script)
```

## 🔧 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_USE_LOCAL_AUTH=true
NEXT_PUBLIC_DEV_MODE=true
```

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=modulus
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-super-secure-jwt-secret-key
ACCESS_CODE=mahtabmehek1337
```

## 🐛 Troubleshooting

### PostgreSQL Connection Issues
```powershell
# Check if PostgreSQL is running
Get-Service postgresql*

# Start PostgreSQL service
Start-Service postgresql-x64-14  # Adjust version number

# Test connection
psql -U postgres -d modulus -c "SELECT version();"
```

### Port Already in Use
```powershell
# Find what's using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID)
taskkill /F /PID <PID>
```

### Database Access Denied
```powershell
# Set PostgreSQL password
psql -U postgres
\password postgres
# Enter your new password
```

## 🎯 Features Still Available

✅ **All Core Features Preserved:**
- User authentication and registration
- Role-based access (Student, Instructor, Staff, Admin)  
- Course and lab management
- Interactive terminal labs
- User dashboards
- Profile management
- Complete UI and all views

✅ **New Local Benefits:**
- No internet required for core functionality
- No AWS costs or billing surprises
- Faster local development
- Full control over data
- No vendor lock-in

## 💡 Production Deployment Options

When ready for production, you can easily deploy to:

1. **VPS/Cloud Server** - Deploy to any Linux server with PostgreSQL
2. **Docker Containers** - Containerize the app for easy deployment  
3. **Platform-as-a-Service** - Deploy to Heroku, Railway, or Vercel
4. **Self-hosted** - Run on your own infrastructure

## 📞 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify PostgreSQL is running: `Get-Service postgresql*`
3. Ensure ports 3000 and 3001 are available
4. Review the environment variables are set correctly

**Happy coding! 🚀 Your Modulus LMS is now running 100% locally with zero AWS dependencies.**
