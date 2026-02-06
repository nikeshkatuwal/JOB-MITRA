import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    requirements: [{
        skill: String,
        category: String,
        level: String,
        importance: Number,
        weight: Number
    }],
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    posted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
        required: true
    },
    location: {
        type: String,
        required: true
    },
    salary: {
        type: String,
        required: true
    },
    experience: {
        type: String,
        required: true
    },
    experienceLevel: {
        type: Number,
        default: 0
    },
    screening_questions: [{
        question: {
            type: String,
            required: true
        },
        type: {
            type: String,
            default: 'text',
            enum: ['text', 'multiple_choice', 'boolean']
        },
        options: {
            type: [String],
            default: []
        },
        required: {
            type: Boolean,
            default: false
        },
        weight: {
            type: Number,
            default: 1
        }
    }],
    status: {
        type: String,
        enum: ['Open', 'Closed', 'Draft'],
        default: 'Open'
    },
    lastDate: {
        type: Date
    },
    // AI enhancement fields
    aiImprovements: {
        type: [String],
        default: []
    },
    aiAdditionalSkills: {
        type: [String],
        default: []
    },
    aiStructuredRequirements: [{
        skill: String,
        category: String,
        level: String,
        importance: String,
        weight: Number
    }],
    // Approved AI suggestions fields
    approvedAiImprovements: {
        type: [String],
        default: []
    },
    approvedAiAdditionalSkills: {
        type: [String],
        default: []
    },
    approvedAiStructuredRequirements: [{
        skill: String,
        category: String,
        level: String,
        importance: String,
        weight: Number
    }],
    // Flag to control whether to show AI suggestions to applicants
    showAiSuggestionsToApplicants: {
        type: Boolean,
        default: false
    },
    // Applications submitted for this job
    applications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application'
    }]
}, { timestamps: true });

// Add indexes for faster lookups
jobSchema.index({ company: 1 });
jobSchema.index({ posted_by: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ title: 'text', description: 'text' });

export const Job = mongoose.model("Job", jobSchema);