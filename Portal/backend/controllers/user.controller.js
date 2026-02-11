import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { parseResume, validateResumeFile } from "../utils/resumeParser.js";
import fs from 'fs';
import path from 'path';
import { deleteFile } from "../middlewares/fileUpload.js";
import crypto from 'crypto';
import sendEmail from "../utils/sendEmail.js";

export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;

        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };

        const file = req.file;
        const fileUri = getDataUri(file);
        const cloudResponse = await uploadToCloudinary(fileUri.content);

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                message: 'User already exist with this email.',
                success: false,
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile: {
                profilePhoto: {
                    url: cloudResponse.url,
                    publicId: cloudResponse.publicId
                }
            }
        });

        return res.status(201).json({
            message: "Account created successfully.",
            success: true
        });
    } catch (error) {
        console.log(error);
    }
}

export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };
        let user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        };
        // check role is correct or not
        if (role !== user.role) {
            return res.status(400).json({
                message: "Account doesn't exist with current role.",
                success: false
            })
        };

        const tokenData = {
            userId: user._id
        }
        const token = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).cookie("token", token, { maxAge: 1 * 24 * 60 * 60 * 1000, httpsOnly: true, sameSite: 'strict' }).json({
            message: `Welcome back ${user.fullname}`,
            user,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}

export const logout = async (req, res) => {
    try {
        return res.status(200).cookie("token", "", { maxAge: 0 }).json({
            message: "Logged out successfully.",
            success: true
        })
    } catch (error) {
        console.log(error);
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body;
        const fileData = req.fileData;

        console.log('Starting profile update with:', {
            hasFile: !!fileData,
            fileDetails: fileData ? {
                originalname: fileData.originalname,
                filename: fileData.filename,
                path: fileData.path
            } : null,
            updateFields: { fullname, email, phoneNumber, bio, hasSkills: !!skills }
        });

        // Validate user exists
        const userId = req.id;
        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                success: false
            });
        }

        // Initialize profile if it doesn't exist
        if (!user.profile) {
            user.profile = {};
        }

        // Update basic profile information
        if (fullname) user.fullname = fullname;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (bio) user.profile.bio = bio;

        // Reset skills arrays before updating
        user.profile.skills = [];
        if (user.profile.parsedResume) {
            user.profile.parsedResume.skills = [];
        }

        // Update user-provided skills
        if (skills) {
            user.profile.skills = skills.split(",").map(skill => skill.trim());
            console.log('Updated user-provided skills:', user.profile.skills);
        }

        // Handle profile photo upload if file exists
        if (req.profilePhotoData) {
            try {
                console.log('Processing profile photo upload...');

                // Delete old profile photo from Cloudinary if exists
                if (user.profile.profilePhoto?.publicId) {
                    await deleteFromCloudinary(user.profile.profilePhoto.publicId, { resource_type: 'image' });
                }

                // Upload new profile photo to Cloudinary
                const cloudResponse = await uploadToCloudinary(req.profilePhotoData.buffer, {
                    resource_type: 'image',
                    folder: 'profiles'
                });

                user.profile.profilePhoto = {
                    url: cloudResponse.url,
                    publicId: cloudResponse.publicId
                };

                console.log('Profile photo updated successfully');

                // Clean up local temp file
                deleteFile(req.profilePhotoData.path);
            } catch (error) {
                console.error('Profile photo upload error:', error);
                if (req.profilePhotoData.path) {
                    deleteFile(req.profilePhotoData.path);
                }
                return res.status(400).json({
                    message: "Failed to upload profile photo",
                    success: false
                });
            }
        }

        // Handle resume upload if file exists
        if (fileData) {
            try {
                console.log('Processing resume upload...');

                // Delete old resume file if exists
                if (user.profile.resume?.path) {
                    deleteFile(user.profile.resume.path);
                }

                // Read the file for parsing
                const fileBuffer = fs.readFileSync(fileData.path);

                // Parse resume
                console.log('Parsing resume...');
                const parsedResume = await parseResume(fileBuffer);
                console.log('Parsed resume data:', parsedResume);

                // Update user profile with resume data
                user.profile.resume = {
                    filename: fileData.filename,
                    originalName: fileData.originalname,
                    path: fileData.path,
                    uploadedAt: new Date()
                };

                // Update parsed resume data
                user.profile.parsedResume = {
                    skills: parsedResume.skills || [],
                    jobTitle: parsedResume.jobTitle || '',
                    location: parsedResume.location || '',
                    lastUpdated: new Date()
                };

                console.log('Updated profile with resume data:', {
                    resumePath: user.profile.resume.path,
                    parsedSkills: user.profile.parsedResume.skills,
                    userSkills: user.profile.skills
                });

            } catch (error) {
                console.error('Resume processing error:', error);
                // Clean up uploaded file if there's an error
                if (fileData.path) {
                    deleteFile(fileData.path);
                }
                return res.status(400).json({
                    message: error.message || "Failed to process resume",
                    success: false
                });
            }
        }

        // Save user changes
        console.log('Saving user profile changes...');
        const savedUser = await user.save();
        console.log('User profile saved successfully');

        // Verify the save was successful
        if (!savedUser) {
            throw new Error('Failed to save user profile');
        }

        // Prepare user data for response
        const userData = {
            _id: savedUser._id,
            fullname: savedUser.fullname,
            email: savedUser.email,
            phoneNumber: savedUser.phoneNumber,
            role: savedUser.role,
            profile: {
                bio: savedUser.profile.bio,
                skills: savedUser.profile.skills,
                resume: savedUser.profile.resume,
                parsedResume: savedUser.profile.parsedResume,
                profilePhoto: savedUser.profile.profilePhoto
            }
        };

        return res.status(200).json({
            message: "Profile updated successfully.",
            user: userData,
            success: true
        });

    } catch (error) {
        console.error("Profile update error:", error);
        // Clean up uploaded file if there's an error
        if (req.fileData?.path) {
            deleteFile(req.fileData.path);
        }
        return res.status(500).json({
            message: "Internal server error. Please try again later.",
            success: false
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        const userId = req.id;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        return res.status(200).json({
            user,
            success: true
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found with this email",
                success: false
            });
        }

        // Get Reset Password Token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

        const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;

        try {
            await sendEmail({
                email: user.email,
                subject: `Job Portal Password Recovery`,
                message,
            });

            res.status(200).json({
                success: true,
                message: `Email sent to: ${user.email}`,
            });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                message: error.message,
                success: false
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Reset Password
export const resetPassword = async (req, res) => {
    try {
        // Creating token hash
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                message: "Reset Password Token is invalid or has been expired",
                success: false
            });
        }

        if (req.body.password !== req.body.confirmPassword) {
            return res.status(400).json({
                message: "Password does not match",
                success: false
            });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Google Login
export const googleLogin = async (req, res) => {
    try {
        const { name, email, photo, role } = req.body;

        if (!name || !email || !role) {
            return res.status(400).json({
                message: "Name, email and role are required",
                success: false
            });
        }

        let user = await User.findOne({ email });

        if (!user) {
            // Create user if not exists
            user = await User.create({
                fullname: name,
                email,
                password: crypto.randomBytes(16).toString('hex'), // Random password for Google users
                role,
                profile: {
                    profilePhoto: {
                        url: photo,
                        publicId: ""
                    }
                }
            });
        } else {
            // Check if role matches
            if (user.role !== role) {
                return res.status(400).json({
                    message: "Account already exists with a different role",
                    success: false
                });
            }
        }

        const tokenData = {
            userId: user._id
        }
        const jwtToken = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

        const userData = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).cookie("token", jwtToken, { maxAge: 1 * 24 * 60 * 60 * 1000, httpsOnly: true, sameSite: 'strict' }).json({
            message: `Welcome back ${user.fullname}`,
            user: userData,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Google login failed",
            success: false
        });
    }
};