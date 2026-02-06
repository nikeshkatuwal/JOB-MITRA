import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    website: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    logo: {
        type: String, // URL to company logo
        default: "https://via.placeholder.com/150?text=Company+Logo"
    },
    recruiters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Add index for faster lookups
companySchema.index({ recruiters: 1 });

export const Company = mongoose.model("Company", companySchema);