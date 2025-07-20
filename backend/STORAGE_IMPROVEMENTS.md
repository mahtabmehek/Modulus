# Lab Storage Improvements Summary

## Database Schema Updates ✅

### 1. Created Tasks Table
```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Created Questions Table
```sql
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('flag', 'text', 'file-upload', 'multiple-choice')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  expected_answer TEXT, -- For flag questions
  is_required BOOLEAN DEFAULT TRUE, -- REMOVED OPTIONAL - now required by default
  points INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 1,
  images TEXT[], -- Array of image file paths
  attachments TEXT[], -- Array of attachment file paths
  multiple_choice_options JSONB,
  hints TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Frontend Changes ✅

### 1. Removed Optional Field
- ❌ Removed `isOptional: boolean` from Question interface
- ❌ Removed Optional checkbox from UI
- ✅ All questions are now required by default

### 2. Enhanced Lab Payload
- ✅ Added `tasks: tasks` to lab creation payload
- ✅ Tasks and questions data now sent to backend

## Backend Changes ✅

### 1. Enhanced Lab Creation Route
- ✅ Added tasks parameter to lab creation
- ✅ Added logic to save tasks after lab creation
- ✅ Added logic to save questions for each task
- ✅ Proper handling of question types and data

### 2. File Upload System
- ✅ Created `/api/files/upload-lab-files` endpoint
- ✅ Added multer for file handling
- ✅ File storage structure: `/uploads/labs/{lab-name}/`
- ✅ Support for lab icons, question images, and attachments
- ✅ File type validation (images, PDFs, text, zip)
- ✅ 10MB file size limit

### 3. File Storage Structure
```
backend/uploads/labs/
├── lab-name-1/
│   ├── icon.png
│   ├── question-image-1.jpg
│   └── attachment-1.pdf
├── lab-name-2/
│   ├── icon.png
│   └── task-files/
└── ...
```

## What's Fixed ✅

1. **Tasks & Questions Storage**: Now properly saved to database tables
2. **Optional Questions**: Removed - all questions are required
3. **File Organization**: Structured folder system for each lab
4. **Lab Icons**: Stored in lab-specific folders
5. **Question Images**: Stored with proper paths
6. **Attachments**: Organized per lab

## Next Steps for Testing

1. **Test Lab Creation**: Create a new lab with tasks and questions
2. **Test File Uploads**: Upload lab icon and question images
3. **Verify Database**: Check that tasks/questions are saved properly
4. **Test Edit Mode**: Ensure editing loads and saves tasks/questions

## File Paths Format
- Lab icons: `/uploads/labs/{safe-lab-name}/icon.ext`
- Question images: `/uploads/labs/{safe-lab-name}/timestamp_filename.ext`
- Attachments: `/uploads/labs/{safe-lab-name}/timestamp_filename.ext`

All file names are sanitized to remove special characters and made lowercase for consistency.
