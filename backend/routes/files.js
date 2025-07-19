const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const labName = req.body.labName || req.params.labName || 'unnamed-lab';
            // Create safe folder name from lab title
            const safeName = labName.replace(/[^a-zA-Z0-9\-_]/g, '_').toLowerCase();
            const uploadPath = path.join(__dirname, '../uploads/labs', safeName);

            // Create directory if it doesn't exist
            await fs.mkdir(uploadPath, { recursive: true });
            cb(null, uploadPath);
        } catch (error) {
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
        const files = req.files;
        const labName = req.body.labName || 'unnamed-lab';
        const safeName = labName.replace(/[^a-zA-Z0-9\-_]/g, '_').toLowerCase();

        const result = {
            icon: null,
            images: [],
            attachments: []
        };

        if (files.icon && files.icon[0]) {
            result.icon = `/uploads/labs/${safeName}/${files.icon[0].filename}`;
        }

        if (files.images) {
            result.images = files.images.map(file =>
                `/uploads/labs/${safeName}/${file.filename}`
            );
        }

        if (files.attachments) {
            result.attachments = files.attachments.map(file =>
                `/uploads/labs/${safeName}/${file.filename}`
            );
        }

        res.json({
            success: true,
            message: 'Files uploaded successfully',
            data: result
        });
    } catch (error) {
        console.error('File upload error:', error);
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
