const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            // Since req.body might not be available yet during multer processing,
            // we'll use a temp directory and move files later
            const tempUploadPath = path.join(__dirname, '../uploads/temp');
            
            console.log('📂 MULTER DESTINATION - using temp path:', tempUploadPath);

            // Create directory if it doesn't exist
            await fs.mkdir(tempUploadPath, { recursive: true });
            console.log('📂 MULTER DESTINATION - temp directory created successfully');
            cb(null, tempUploadPath);
        } catch (error) {
            console.error('❌ MULTER DESTINATION ERROR:', error);
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        const safeName = name.replace(/[^a-zA-Z0-9\-_]/g, '_');
        cb(null, `${timestamp}_${safeName}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Allow images and common attachment types
    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/zip',
        'application/x-zip-compressed', 'application/octet-stream'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, PDFs, text files, and zip files are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// POST /api/files/upload-lab-files
router.post('/upload-lab-files', upload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'attachments', maxCount: 10 }
]), async (req, res) => {
    try {
        console.log('🚀 UPLOAD ENDPOINT STARTED');
        console.log('  📦 req.body:', req.body);
        console.log('  📎 req.files:', req.files);
        
        const files = req.files;
        const labName = req.body.labName || 'unnamed-lab';
        const safeName = labName.replace(/[^a-zA-Z0-9\-_]/g, '_').toLowerCase();

        console.log('🗂️ FILE UPLOAD DEBUG:');
        console.log('  📁 labName from request:', req.body.labName);
        console.log('  📁 safeName generated:', safeName);
        console.log('  📁 files received:', files ? Object.keys(files) : 'none');

        const result = {
            icon: null,
            images: [],
            attachments: []
        };

        // Now that we have access to the parsed body, create the proper lab directory
        const targetPath = path.join(__dirname, '../uploads/labs', safeName);
        await fs.mkdir(targetPath, { recursive: true });
        console.log('  📁 Created target directory:', targetPath);

        // Move files from temp to proper lab directory
        if (files.icon && files.icon[0]) {
            const tempFilePath = files.icon[0].path;
            const filename = files.icon[0].filename;
            const targetFilePath = path.join(targetPath, filename);
            
            console.log('  🖼️ Moving icon from:', tempFilePath);
            console.log('  🖼️ Moving icon to:', targetFilePath);
            
            await fs.rename(tempFilePath, targetFilePath);
            result.icon = `/uploads/labs/${safeName}/${filename}`;
            console.log('  🖼️ Icon moved successfully');
        }

        if (files.images) {
            for (const file of files.images) {
                const tempFilePath = file.path;
                const filename = file.filename;
                const targetFilePath = path.join(targetPath, filename);
                
                console.log('  🖼️ Moving image from:', tempFilePath, 'to:', targetFilePath);
                await fs.rename(tempFilePath, targetFilePath);
                result.images.push(`/uploads/labs/${safeName}/${filename}`);
            }
        }

        if (files.attachments) {
            for (const file of files.attachments) {
                const tempFilePath = file.path;
                const filename = file.filename;
                const targetFilePath = path.join(targetPath, filename);
                
                console.log('  📎 Moving attachment from:', tempFilePath, 'to:', targetFilePath);
                await fs.rename(tempFilePath, targetFilePath);
                result.attachments.push(`/uploads/labs/${safeName}/${filename}`);
            }
        }

        res.json({
            success: true,
            message: 'Files uploaded successfully',
            data: result
        });
        
        console.log('✅ FILE UPLOAD SUCCESS - Response sent:', result);
    } catch (error) {
        console.error('❌ FILE UPLOAD ERROR:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            labName: req.body.labName,
            files: req.files ? Object.keys(req.files) : 'none'
        });
        res.status(500).json({
            error: 'Failed to upload files',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/files/labs/:labName/:filename
router.get('/labs/:labName/:filename', async (req, res) => {
    try {
        // Set CORS headers for file serving
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('Cross-Origin-Resource-Policy', 'cross-origin');

        const { labName, filename } = req.params;
        const safeName = labName.replace(/[^a-zA-Z0-9\-_]/g, '_').toLowerCase();
        const filePath = path.join(__dirname, '../uploads/labs', safeName, filename);

        // Check if file exists
        await fs.access(filePath);

        res.sendFile(filePath);
    } catch (error) {
        res.status(404).json({ error: 'File not found' });
    }
});

module.exports = router;
