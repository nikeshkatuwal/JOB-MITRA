import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadDir = './uploads/resumes';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    try {
        // Check if file exists
        if (!file) {
            cb(new Error('No file uploaded'), false);
            return;
        }

        // Check mime type
        if (file.mimetype !== 'application/pdf') {
            cb(new Error('Only PDF files are allowed'), false);
            return;
        }

        // Accept the file
        cb(null, true);
    } catch (error) {
        cb(new Error('File validation failed: ' + error.message), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only allow 1 file
    }
});

export const handleFileUpload = (req, res, next) => {
    upload.single('file')(req, res, async (err) => {
        try {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        message: 'File size too large. Maximum size is 5MB',
                        success: false
                    });
                }
                return res.status(400).json({
                    message: `File upload error: ${err.message}`,
                    success: false
                });
            } else if (err) {
                return res.status(400).json({
                    message: err.message || 'File upload failed',
                    success: false
                });
            }

            // If no file is uploaded, just continue
            if (!req.file) {
                next();
                return;
            }

            // Log file details for debugging
            console.log('File received:', {
                originalname: req.file.originalname,
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype,
                size: req.file.size
            });

            // Prepare file data for the next middleware
            req.fileData = {
                originalname: req.file.originalname,
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype
            };

            next();
        } catch (error) {
            console.error('File upload middleware error:', error);
            return res.status(500).json({
                message: 'File processing failed',
                success: false
            });
        }
    });
};

export const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Successfully deleted file:', filePath);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
    }
};

export default handleFileUpload; 