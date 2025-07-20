# Icon Storage Implementation Documentation

## Overview
This document outlines the implementation of browser-first icon storage for lab creation, including the fixes applied to resolve path consistency and CORS issues.

## Problem Statement
The original system had issues with:
1. Icons not displaying after upload due to path mismatches
2. CORS errors preventing icon loading from static file server
3. Inconsistent directory naming between upload and display logic
4. Database not storing icon paths correctly

## Solution Architecture

### Browser-First Storage Approach
- Icons are stored as File objects in the browser before upload
- `URL.createObjectURL()` is used for immediate preview
- Files are uploaded to server only when lab is saved
- Consistent sanitization ensures path matching

### Key Components

#### 1. Frontend (lab-creation.tsx)
**Icon Data Type:**
```typescript
icon: File | string  // File for browser storage, string for server URLs
```

**Sanitization Logic:**
```javascript
const safeLabelName = (labData.title || 'unnamed-lab').replace(/[^a-zA-Z0-9\-_]/g, '_').toLowerCase();
```

**Upload Process:**
- `uploadAllPendingFiles()` function handles all file uploads
- Returns both processed tasks and uploaded icon path
- Icon path is captured from server response and included in lab payload

#### 2. Backend (server.js)
**Static File Serving with Enhanced CORS:**
```javascript
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
}, express.static('uploads', {
  setHeaders: (res, path) => {
    // Proper content types for images
  }
}));
```

#### 3. File Upload (files.js)
**Dynamic Directory Creation:**
```javascript
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const labName = req.body.labName || 'unnamed-lab';
    const safeName = labName.replace(/[^a-zA-Z0-9\-_]/g, '_').toLowerCase();
    const uploadPath = path.join(__dirname, '../uploads/labs', safeName);
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  }
});
```

#### 4. Database Storage (labs.js)
**Icon Path Handling:**
- `icon_path` field stores relative server path (e.g., `/uploads/labs/lab_name/file.png`)
- Path is captured from upload response and included in lab creation payload

## Implementation Details

### Path Consistency Fix
**Problem:** Icons uploaded to one directory but expected in another

**Solution:** Consistent sanitization across all upload functions:
- Icon uploads: `safeLabelName`
- Image uploads: `safeLabelName`  
- Attachment uploads: `safeLabelName`
- Individual file uploads: `safeLabelName`

**Before:**
```javascript
// Inconsistent naming
formData.append('labName', labData.title || 'unnamed-lab');  // Not sanitized
formData.append('labName', safeLabelName);  // Sanitized
```

**After:**
```javascript
// Consistent naming everywhere
const safeLabelName = (labData.title || 'unnamed-lab').replace(/[^a-zA-Z0-9\-_]/g, '_').toLowerCase();
formData.append('labName', safeLabelName);
```

### Database Integration Fix
**Problem:** Icon paths not saved to database (`icon_path` was `null`)

**Solution:** Modified upload flow to capture and use icon path:
```javascript
// 1. Upload files and capture icon path
const uploadResult = await uploadAllPendingFiles(dragDropTasks);
const uploadedIconPath = uploadResult.iconPath;

// 2. Include in lab payload
const labPayload = {
  // ... other fields
  icon_path: uploadedIconPath || (existing icon logic),
};
```

### CORS Configuration
**Enhanced headers for static file serving:**
- `Access-Control-Allow-Origin: *`
- `Cross-Origin-Resource-Policy: cross-origin`
- `Cross-Origin-Embedder-Policy: unsafe-none`
- Proper content-type setting for images
- Preflight request handling

## File Structure
```
backend/
├── uploads/
│   └── labs/
│       ├── linux_test/           # "Linux Test" → "linux_test"
│       │   └── 1234567890_icon.png
│       ├── my_python_lab/        # "My Python Lab" → "my_python_lab"
│       │   └── 1234567891_icon.png
│       └── unnamed-lab/          # Fallback directory
└── routes/
    ├── files.js                  # File upload handling
    └── labs.js                   # Lab CRUD operations
```

## Testing Verification
1. **Upload Consistency:** All files for a lab go to same directory
2. **Database Storage:** `icon_path` field properly populated
3. **CORS Compliance:** No OpaqueResponseBlocking errors
4. **Display Logic:** Icons display correctly in lab cards
5. **Browser Storage:** Immediate preview with File objects

## Debugging Tools
**Console Logging:**
- `🖼️` Icon-related operations
- `📤` File upload process
- `💾` Database operations
- `📋` Task/question processing

**Database Verification:**
```sql
SELECT id, title, icon_path FROM labs ORDER BY id DESC LIMIT 5;
```

**File System Check:**
```bash
Get-ChildItem "backend\uploads\labs" -Recurse
```

## Known Issues Resolved
1. ✅ Path mismatch between upload and display
2. ✅ CORS errors blocking icon display
3. ✅ Database icon_path field remaining null
4. ✅ Inconsistent directory naming
5. ✅ Browser-first storage implementation

## Future Improvements
- Image optimization/compression
- Multiple image formats support
- Thumbnail generation
- File cleanup for deleted labs
- CDN integration for production

## Related Files
- `src/components/views/lab-creation.tsx` - Main lab creation interface
- `backend/server.js` - Static file serving and CORS
- `backend/routes/files.js` - File upload handling
- `backend/routes/labs.js` - Lab database operations

## Migration Notes
Existing labs with `icon_path: null` will need icons re-uploaded to populate the database field correctly.
