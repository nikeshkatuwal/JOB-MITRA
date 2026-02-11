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
        if (!file) {
            cb(new Error('No file uploaded'), false);
            return;
        }

        if (file.fieldname === 'profilePhoto') {
            if (!file.mimetype.startsWith('image/')) {
                cb(new Error('Only image files are allowed for profile photo'), false);
                return;
            }
        } else if (file.fieldname === 'file') {
            if (file.mimetype !== 'application/pdf') {
                cb(new Error('Only PDF files are allowed for resume'), false);
                return;
            }
        }

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
        files: 2 // Allow up to 2 files (resume and profile photo)
    }
});

export const handleFileUpload = (req, res, next) => {
    upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'profilePhoto', maxCount: 1 }
    ])(req, res, async (err) => {
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

            // Prepare files info for next middleware
            if (req.files) {
                if (req.files.file?.[0]) {
                    const file = req.files.file[0];
                    req.fileData = {
                        originalname: file.originalname,
                        filename: file.filename,
                        path: file.path,
                        mimetype: file.mimetype
                    };
                }
                if (req.files.profilePhoto?.[0]) {
                    const file = req.files.profilePhoto[0];
                    req.profilePhotoData = {
                        originalname: file.originalname,
                        filename: file.filename,
                        path: file.path,
                        mimetype: file.mimetype,
                        buffer: fs.readFileSync(file.path) // Read buffer for Cloudinary
                    };
                }
            }

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