import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";
dotenv.config();

// Configure cloudinary with retries
const configureCloudinary = (retries = 3) => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            throw new Error('Missing Cloudinary configuration');
        }

        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            timeout: 60000 // 60 second timeout
        });

        return true;
    } catch (error) {
        console.error('Cloudinary configuration error:', error);
        if (retries > 0) {
            console.log(`Retrying Cloudinary configuration... (${retries} attempts remaining)`);
            setTimeout(() => configureCloudinary(retries - 1), 5000);
        } else {
            console.error('Cloudinary configuration failed:', error);
            throw error;
        }
    }
};

configureCloudinary();

// Convert buffer to base64
const bufferToBase64 = (file) => {
    try {
        if (!file) {
            throw new Error('No file provided');
        }

        if (file.buffer) {
            return file.buffer.toString('base64');
        } else if (Buffer.isBuffer(file)) {
            return file.toString('base64');
        } else if (typeof file === 'string') {
            return file.replace(/^data:image\/\w+;base64,/, '');
        }
        
        throw new Error('Invalid file format');
    } catch (error) {
        console.error('Buffer to base64 error:', error);
        throw error;
    }
};

// Upload file to cloudinary with retries
export const uploadToCloudinary = async (fileData, options = {}, retries = 3) => {
    try {
        console.log('Starting file upload to Cloudinary...');
        
        // Validate file data
        if (!fileData) {
            throw new Error('No file data provided');
        }

        // Set default options based on resource type
        const isImage = options.resource_type === 'image';
        const uploadOptions = {
            folder: isImage ? 'companies' : 'resumes',
            resource_type: isImage ? 'image' : 'raw',
            use_filename: true,
            unique_filename: true,
            ...options
        };

        console.log('Uploading with options:', uploadOptions);

        // Prepare the upload string based on the data type
        let uploadStr;
        if (typeof fileData === 'string') {
            // If it's already a data URI string, use it directly
            uploadStr = fileData;
            console.log('Using provided data URI string');
        } else if (Buffer.isBuffer(fileData)) {
            // If it's a buffer, convert to base64
            const base64Data = fileData.toString('base64');
            const mimePrefix = isImage ? 'image/png' : 'application/pdf';
            uploadStr = `data:${mimePrefix};base64,${base64Data}`;
            console.log('Converted buffer to data URI');
        } else {
            // Otherwise assume it's a data object with content
            uploadStr = fileData;
            console.log('Using content from data object');
        }

        // Perform the upload
        console.log('Initiating Cloudinary upload...');
        const result = await cloudinary.uploader.upload(uploadStr, uploadOptions);

        console.log('Upload successful:', {
            publicId: result.public_id,
            url: result.secure_url,
            format: result.format,
            resourceType: result.resource_type
        });

        if (!result.secure_url) {
            throw new Error('Upload successful but no URL returned');
        }

        return {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format || (isImage ? 'png' : 'pdf'),
            resourceType: result.resource_type || (isImage ? 'image' : 'raw')
        };

    } catch (error) {
        console.error('Cloudinary upload error:', {
            message: error.message,
            stack: error.stack,
            details: error
        });

        if (retries > 0) {
            console.log(`Retrying upload... (${retries} attempts remaining)`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return uploadToCloudinary(fileData, options, retries - 1);
        }

        throw error;
    }
};

// Delete file from cloudinary with retries
export const deleteFromCloudinary = async (publicId, options = {}, retries = 3) => {
    try {
        if (!publicId) {
            throw new Error('No public ID provided');
        }

        const defaultOptions = {
            resource_type: 'raw', // Default to 'raw' for PDFs
            timeout: 60000
        };

        const deleteOptions = { ...defaultOptions, ...options };

        await cloudinary.uploader.destroy(publicId, deleteOptions);
        return true;
    } catch (error) {
        if (retries > 0) {
            console.log(`Retrying delete... (${retries} attempts remaining)`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return deleteFromCloudinary(publicId, options, retries - 1);
        }
        throw new Error(`Failed to delete file: ${error.message}`);
    }
};