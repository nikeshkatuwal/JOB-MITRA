import { Company } from "../models/company.model.js";
import getDataUri from "../utils/datauri.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

export const registerCompany = async (req, res) => {
    try {
        console.log('=== Company Registration Request ===');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        console.log('File:', req.file ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        } : 'No file uploaded');

        const { name, description, website, location } = req.body;
        const file = req.file;

        // Validate required fields
        if (!name || !description || !website || !location) {
            console.log('Missing required fields:', { name, description, website, location });
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        // Check if company with same name exists
        const existingCompany = await Company.findOne({ name });
        if (existingCompany) {
            console.log('Company already exists with name:', name);
            return res.status(400).json({
                success: false,
                message: "A company with this name already exists"
            });
        }

        let logoUrl = "https://via.placeholder.com/150?text=Company+Logo";

        // Handle logo upload if file exists
        if (file) {
            try {
                console.log('Processing logo upload:', {
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size
                });

                const fileUri = getDataUri(file);
                console.log('File URI generated successfully');

                const cloudResponse = await uploadToCloudinary(fileUri.content, {
                    folder: 'companies',
                    resource_type: 'image',
                    allowed_formats: ['png', 'jpg', 'jpeg', 'svg', 'webp'],
                    transformation: [
                        { width: 500, height: 500, crop: 'limit' }
                    ]
                });
                
                console.log('Cloudinary upload successful:', cloudResponse);
                logoUrl = cloudResponse.url;
            } catch (uploadError) {
                console.error("Error uploading logo:", uploadError);
                // Don't return error, just use placeholder logo
                console.log('Using placeholder logo instead');
            }
        }

        // Create new company
        const companyData = {
            name,
            description,
            website,
            location,
            logo: logoUrl,
            created_by: req.user._id
        };
        
        console.log('Creating company with data:', companyData);
        const company = await Company.create(companyData);
        console.log('Company created successfully:', company._id);

        res.status(201).json({
            success: true,
            message: "Company registered successfully",
            company
        });
    } catch (error) {
        console.error("Error in registerCompany:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error while registering company: " + error.message,
            error: error.stack
        });
    }
};

export const getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find().sort({ createdAt: -1 });
        if (!companies) {
            return res.status(404).json({
                message: "Companies not found.",
                success: false
            });
        }
        return res.status(200).json({
            companies,
            success: true
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            });
        }
        return res.status(200).json({
            company,
            success: true
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const getCompany = async (req, res) => {
    try {
        const companies = await Company.find({ created_by: req.user._id })
            .sort({ createdAt: -1 });

        if (!companies || companies.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No companies found for this user"
            });
        }

        res.status(200).json({
            success: true,
            companies
        });
    } catch (error) {
        console.error("Error in getCompany:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching companies"
        });
    }
};

export const updateCompany = async (req, res) => {
    try {
        const companyId = req.params.id;
        const { name, description, location, website } = req.body;
        const file = req.file;

        // Log incoming data for debugging
        console.log('Update company request:', {
            companyId,
            body: req.body,
            hasFile: !!file
        });

        let company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }

        // Check if user has permission to update
        if (company.created_by.toString() !== req.user._id.toString() && 
            !company.recruiters.includes(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to update this company"
            });
        }

        // Update basic info
        if (name) company.name = name;
        if (description) company.description = description;
        if (location) company.location = location;
        if (website) company.website = website;

        // Handle logo update if file exists
        if (file) {
            try {
                console.log('Processing file upload:', {
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size
                });

                const fileUri = getDataUri(file);
                console.log('File URI generated successfully');

                const cloudResponse = await uploadToCloudinary(fileUri.content, {
                    folder: 'companies',
                    resource_type: 'image',
                    allowed_formats: ['png', 'jpg', 'jpeg', 'svg', 'webp'],
                    transformation: [
                        { width: 500, height: 500, crop: 'limit' }
                    ]
                });
                
                console.log('Cloudinary upload successful:', cloudResponse);

                // Delete old logo if exists
                if (company.logo && !company.logo.includes('placeholder')) {
                    try {
                        const publicId = company.logo.split('/').slice(-1)[0].split('.')[0];
                        await deleteFromCloudinary(publicId, { resource_type: 'image' });
                        console.log('Old logo deleted successfully');
                    } catch (deleteError) {
                        console.error("Error deleting old logo:", deleteError);
                        // Continue with update even if old logo deletion fails
                    }
                }
                
                company.logo = cloudResponse.url;
            } catch (uploadError) {
                console.error("Error uploading logo:", uploadError);
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload company logo: " + uploadError.message
                });
            }
        }

        await company.save();
        console.log('Company updated successfully');

        return res.status(200).json({
            success: true,
            message: "Company updated successfully",
            company
        });
    } catch (error) {
        console.error("Error in updateCompany:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while updating company: " + error.message
        });
    }
};

export const deleteCompany = async (req, res) => {
    try {
        const companyId = req.params.id;
        
        console.log('Delete company request:', {
            companyId,
            userId: req.user._id
        });

        // Find the company
        const company = await Company.findById(companyId);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }

        // Check if user has permission to delete
        if (company.created_by.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to delete this company"
            });
        }

        // Delete company logo from Cloudinary if it exists
        if (company.logo && !company.logo.includes('placeholder')) {
            try {
                const publicId = company.logo.split('/').slice(-1)[0].split('.')[0];
                await deleteFromCloudinary(publicId, { resource_type: 'image' });
                console.log('Company logo deleted from Cloudinary');
            } catch (error) {
                console.error("Error deleting company logo:", error);
                // Continue with deletion even if logo deletion fails
            }
        }

        // Delete the company
        await Company.findByIdAndDelete(companyId);
        console.log('Company deleted successfully');

        return res.status(200).json({
            success: true,
            message: "Company deleted successfully"
        });
    } catch (error) {
        console.error("Error in deleteCompany:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while deleting company: " + error.message
        });
    }
};