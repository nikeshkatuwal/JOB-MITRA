import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    job:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Job',
        required:true
    },
    applicant:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    status:{
        type:String,
        enum:['pending', 'accepted', 'rejected'],
        default:'pending'
    },
    similarity: {
        type: Number,
        default: 0
    },
    screeningResponses: [{
        question: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        questionText: {
            type: String,
            required: true
        },
        answer: {
            type: String,
            required: true
        },
        score: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    }],
    screeningScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    }
},{timestamps:true});

export const Application = mongoose.model("Application", applicationSchema);