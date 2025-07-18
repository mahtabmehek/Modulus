# Modulus LMS - Complete System Documentation

**Last Updated**: July 19, 2025  
**Branch**: cognito-timeline  
**Session Completion**: Icon upload system and lab storage improvements

## 🔐 System Credentials & Access

### Database Configuration
```
Host: localhost
Port: 5432
Database: modulus
User: postgres
Password: mahtab
```

### Application URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

### Default Admin Access
```
Email: admin@modulus.edu
Password: admin123 (CHANGE IN PRODUCTION)
```

### Access Codes
```
Student Registration: mahtabmehek1337
Role: student
Status: active
```

## 🏗️ System Architecture

### Frontend (Next.js 15.3.4)
- **Location**: `/src`
- **Port**: 3000
- **Framework**: React with TypeScript
- **Key Components**:
  - `src/components/views/lab-creation.tsx` - Simplified lab creation form
  - `src/lib/api/labs.ts` - Lab API client
  - Authentication via JWT tokens (localStorage: 'modulus_token')

### Backend (Express.js)
- **Location**: `/backend`
- **Port**: 3001
- **Database**: PostgreSQL with local connection
- **Key Routes**:
  - `/api/auth` - Authentication
  - `/api/labs` - Lab CRUD operations
  - `/api/files` - File upload system
  - `/api/admin` - Admin functions
  - `/api/users` - User management
  - `/api/courses` - Course management

### Database Schema (PostgreSQL)
```sql
-- Core Tables
users (id, email, password_hash, name, role, preferences)
courses (id, title, code, instructor_id)
modules (id, course_id, title, order_index, is_published)
labs (id, module_id, title, description, lab_type, icon_path, tags, vm_image)

-- Task/Question System
tasks (id, lab_id, title, description, order_index)
questions (id, task_id, type, title, description, expected_answer, is_required, points)

-- Progress Tracking
user_progress (id, user_id, course_id, module_id, lab_id, status)
lab_sessions (id, user_id, lab_id, status, metadata)
```

## 📁 File Upload System

### Storage Structure
```
backend/uploads/labs/
├── {lab-name-sanitized}/
│   ├── icon.{ext}
│   ├── {timestamp}_{filename}.{ext}
│   └── attachments/
```

### File Upload Endpoints
- **POST** `/api/files/upload-lab-files`
  - Fields: icon (1), images (10), attachments (10)
  - Max size: 10MB per file
  - Allowed types: images, PDFs, text, zip files

- **GET** `/api/files/labs/{labName}/{filename}`
  - Serves uploaded files

### Configuration
```javascript
// Multer configuration in backend/routes/files.js
- File naming: {timestamp}_{sanitized-name}.{ext}
- Folder naming: {lab-title-sanitized}
- Path validation: max 500 characters
```

## 🔧 Recent Major Changes (July 18-19, 2025)

### Icon Upload System
- ✅ **Replaced URL-based icons with file uploads**
- ✅ **Updated validation**: `icon_url` (5000 chars) → `icon_path` (500 chars)
- ✅ **Added multer dependency** for file handling
- ✅ **Created structured file storage** in `uploads/labs/`
- ✅ **Frontend file upload integration** with progress handling

### Lab Creation Improvements
- ✅ **Simplified UI**: Removed Academic Organization, Lab Overview sections
- ✅ **Mandatory tags**: At least one tag required
- ✅ **Removed points system**: All questions default to 0 points
- ✅ **Removed optional questions**: All questions now required
- ✅ **Enhanced task/question storage**: Proper database relationships

### Database Schema Updates
```sql
-- Added tables
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  lab_id INTEGER REFERENCES labs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  type VARCHAR(50) CHECK (type IN ('flag', 'text', 'file-upload', 'multiple-choice')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  expected_answer TEXT,
  is_required BOOLEAN DEFAULT TRUE,
  points INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 1,
  images TEXT[],
  attachments TEXT[],
  multiple_choice_options JSONB,
  hints TEXT[]
);

-- Enhanced labs table
ALTER TABLE labs ADD COLUMN icon_path VARCHAR(500);
ALTER TABLE labs ADD COLUMN tags TEXT[];
```

## 🚀 Starting the System

### Backend
```bash
cd backend
npm start  # Production
npm run dev  # Development with nodemon
```

### Frontend
```bash
npm run dev  # Development server
npm run build  # Production build
npm start  # Production server
```

### Database Setup
```bash
# Connect to PostgreSQL
psql -h localhost -p 5432 -U postgres -d modulus

# Run schema
\i backend/schema.sql

# Create tasks/questions tables
node backend/create-tasks-tables.js

# Add icon_path column
node backend/add-icon-path-column.js
```

## 🔍 VS Code Tasks

### Available Tasks
```json
{
  "dev": {
    "command": "npm run dev",
    "background": true,
    "group": "build"
  },
  "backend": {
    "command": "npm start",
    "background": true,
    "group": "build",
    "cwd": "${workspaceFolder}/backend"
  }
}
```

### Restart Commands
```powershell
# Stop all Node.js processes
Get-Process -Name "node" | Stop-Process -Force

# Restart using VS Code tasks
- Ctrl+Shift+P → "Tasks: Run Task" → "dev"
- Ctrl+Shift+P → "Tasks: Run Task" → "backend"
```

## 📊 Lab Creation Workflow

### 1. Frontend Form (`lab-creation.tsx`)
- **Required Fields**: Title, Tags
- **Optional Fields**: Description, VM Image, Icon
- **Structure**: Basic Info → VM Config → Tasks/Questions

### 2. File Upload Process
```javascript
// Icon upload
FormData → /api/files/upload-lab-files → {icon: "/uploads/labs/{lab}/file.ext"}

// Lab submission
{
  title: "Lab Title",
  icon_path: "/uploads/labs/{lab}/file.ext",
  tags: ["tag1", "tag2"],
  tasks: [
    {
      title: "Task 1",
      questions: [
        {
          type: "flag",
          title: "Question 1",
          expected_answer: "FLAG{answer}"
        }
      ]
    }
  ]
}
```

### 3. Backend Processing (`labs.js`)
1. **Validation**: Express-validator checks all fields
2. **Lab Creation**: Insert into labs table
3. **Task Storage**: Loop through tasks, insert with lab_id
4. **Question Storage**: Loop through questions, insert with task_id
5. **File Handling**: Store file paths in database

## 🎯 Current System Status

### ✅ Working Features
- User authentication (JWT)
- Lab creation with file uploads
- Task and question management
- Student dashboard with published labs
- Module and course organization
- File upload and serving
- Edit mode for existing labs

### 🔧 Known Configuration
- **Module Assignment**: All labs assigned to module_id = 1
- **Default Lab Type**: VM labs with container option
- **File Storage**: Local filesystem with structured folders
- **Database**: PostgreSQL with array types for tags/tools
- **Authentication**: JWT tokens in localStorage

### 📋 Development Scripts
```bash
# Database debugging
node backend/check-schema.js
node backend/debug-modules.js
node backend/check-lab-storage.js

# Schema updates
node backend/create-tasks-tables.js
node backend/add-icon-path-column.js
node backend/fix-icon-column.js
```

## 🔄 Git Information

### Current Branch
```
Repository: Modulus
Owner: mahtabmehek
Branch: cognito-timeline
```

### Recent Commits
- **Latest**: Icon file upload system implementation
- **Previous**: Task/question storage improvements
- **Base**: Lab creation form simplification

## 📝 Notes for Next Session

### Pending Items
1. **Database Migration**: Run icon_path column addition script
2. **Testing**: Verify complete lab creation workflow
3. **File Serving**: Test static file serving for uploads
4. **Edit Mode**: Verify task/question loading in edit mode

### Configuration Files
- `.env` files not in use (using defaults)
- Database credentials hardcoded for development
- JWT secret using default value
- File upload limits set to 10MB

### Important File Locations
- **Upload Storage**: `backend/uploads/labs/`
- **Database Scripts**: `backend/*.js` (migration scripts)
- **API Routes**: `backend/routes/`
- **Frontend Components**: `src/components/views/`
- **API Client**: `src/lib/api/`

---

**Ready for Next Session**: System is fully configured with icon upload functionality. Backend and frontend servers can be restarted using VS Code tasks. All major components are documented above.
