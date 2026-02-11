import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [true, 'Please enter your name'],
        maxLength: [30, 'Name cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please enter your password'],
        minLength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    phoneNumber: {
        type: String,
        match: [/^[0-9]{10}$/, 'Please enter a valid phone number']
    },
    bio: {
        type: String,
        maxLength: [500, 'Bio cannot exceed 500 characters']
    },
    skills: [{
        type: String,
        trim: true
    }],
    role: {
        type: String,
        default: 'user'
    },
    profile: {
        bio: {
            type: String,
            maxLength: [500, 'Bio cannot exceed 500 characters']
        },
        skills: [{
            type: String,
            trim: true
        }],
        experience: {
            type: Number,
            default: 0
        },
        resume: {
            filename: String,
            originalName: String,
            path: String,
            uploadedAt: Date
        },
        parsedResume: {
            skills: [{
                type: String,
                trim: true
            }],
            jobTitle: String,
            location: String,
            lastUpdated: Date
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company'
        },
        profilePhoto: {
            url: String,
            publicId: String
        }
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, { timestamps: true });

// Middleware to clean up old resume file before updating
userSchema.pre('save', async function (next) {
    if (this.isModified('profile.resume.path')) {
        // The file cleanup is handled in the controller
        next();
    }

    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Compare user password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Return JWT token
userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Generating Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
    // Generating Token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hashing and adding resetPasswordToken to userSchema
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Setting Token Expire Time
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    return resetToken;
};

export const User = mongoose.model('User', userSchema);