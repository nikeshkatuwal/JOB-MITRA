import { Job } from "../models/job.model.js";
import { recommendJobs, getUserHistory, trackUserInteraction } from "../utils/recommendationSystem.js"; // Import additional functions
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { calculateCombinedSimilarity } from "../utils/similarityCalculator.js";
import { extractStructuredRequirements, validateRequirements, mergeSimilarRequirements } from "../utils/requirementsExtractor.js";
import { enhanceJobPosting } from '../utils/jobPostingAssistant.js';
import { Company } from "../models/company.model.js";
// admin post krega job
export const postJob = async (req, res) => {
    try {
        const { title, description, requirements, type, location, salary, experience, company, 
                screening_questions, screeningQuestions, lastDate } = req.body;

        // Validate required fields
        if (!title || !description || !requirements || !type || !location || !salary || !experience || !company) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        // Check if company exists and user has access
        const companyDoc = await Company.findById(company);
        if (!companyDoc) {
            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }

        // Check if user is a recruiter for this company
        if (!companyDoc.recruiters.includes(req.user._id) && companyDoc.created_by.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to post jobs for this company"
            });
        }

        // Create job with enhanced content
        const enhancedJob = await enhanceJobPosting({
            title,
            description,
            requirements,
            type,
            location,
            salary,
            experience,
            screening_questions: screeningQuestions || screening_questions || [],
            lastDate: lastDate || null
        });

        // Format the screening questions properly for MongoDB
        const formattedScreeningQuestions = formatScreeningQuestions(
            enhancedJob.screening_questions || screeningQuestions || screening_questions || []
        );

        // Log the formatted screening questions for debugging
        console.log('Formatted screening questions:', JSON.stringify(formattedScreeningQuestions));

        // Extract the approved suggestions from the request if they exist
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const approvedAiImprovements = Array.isArray(req.body.approvedAiImprovements) 
            ? req.body.approvedAiImprovements 
            : [];
            
        const approvedAiAdditionalSkills = Array.isArray(req.body.approvedAiAdditionalSkills)
            ? req.body.approvedAiAdditionalSkills
            : [];
            
        const approvedAiStructuredRequirements = Array.isArray(req.body.approvedAiStructuredRequirements)
            ? req.body.approvedAiStructuredRequirements
            : [];
            
        // Extract any approved AI screening questions
        const approvedAiScreeningQuestions = Array.isArray(req.body.approvedAiScreeningQuestions)
            ? req.body.approvedAiScreeningQuestions
            : [];
            
        // Use the new flag name for consistency
        const showAiSuggestions = Boolean(req.body.showAiSuggestionsToApplicants);

        // Log the approved suggestions for debugging
        console.log('Received approved AI suggestions:', {
            approvedImprovements: approvedAiImprovements,
            approvedSkills: approvedAiAdditionalSkills,
            approvedRequirements: approvedAiStructuredRequirements,
            approvedScreeningQuestions: approvedAiScreeningQuestions,
            showSuggestions: showAiSuggestions
        });

        // Ensure we have all the required fields in the job creation
        const jobToCreate = {
            title: enhancedJob.title,
            description: enhancedJob.description,
            requirements: enhancedJob.requirements,
            type: enhancedJob.type,
            location: enhancedJob.location,
            salary: enhancedJob.salary,
            experience: enhancedJob.experience,
            // Parse experience as a number if possible for better matching
            // Extract numeric value from experience string (e.g., "2 years" -> 2)
            experienceLevel: parseInt(enhancedJob.experience.match(/\d+/)?.[0]) || 0,
            company,
            posted_by: req.user._id,
            // Store all AI suggestions for reference
            aiImprovements: enhancedJob.improvements || [],
            aiAdditionalSkills: enhancedJob.additionalSkills || [],
            aiStructuredRequirements: enhancedJob.structuredRequirements || [],
            // Store only approved AI suggestions that will be shown to applicants
            approvedAiImprovements,
            approvedAiAdditionalSkills,
            approvedAiStructuredRequirements,
            approvedAiScreeningQuestions,
            // Control whether to show AI suggestions to applicants
            showAiSuggestionsToApplicants: showAiSuggestions
        };

        // Add screening questions only if we have valid ones
        // Combine original screening questions and approved AI screening questions
        const combinedScreeningQuestions = [];
        
        // Add original screening questions if available
        if (formattedScreeningQuestions && formattedScreeningQuestions.length > 0) {
            combinedScreeningQuestions.push(...formattedScreeningQuestions);
        }
        
        // Add approved AI screening questions if available
        if (approvedAiScreeningQuestions && approvedAiScreeningQuestions.length > 0) {
            // Format AI screening questions to match the schema
            const formattedAiScreeningQuestions = approvedAiScreeningQuestions.map(q => ({
                question: q.question,
                type: q.type || 'text',
                options: q.options || [],
                required: q.required || false,
                weight: q.weight || 1
            }));
            combinedScreeningQuestions.push(...formattedAiScreeningQuestions);
        }
        
        // Only add screening_questions field if we have any questions
        if (combinedScreeningQuestions.length > 0) {
            jobToCreate.screening_questions = combinedScreeningQuestions;
            console.log(`Adding ${combinedScreeningQuestions.length} screening questions to job`);
        }
        
        if (lastDate) {
            jobToCreate.lastDate = lastDate;
        }

        console.log("Creating job with data:", JSON.stringify({
            title: jobToCreate.title,
            description: jobToCreate.description ? "Present" : "Missing",
            requirements: jobToCreate.requirements ? "Present" : "Missing",
            type: jobToCreate.type,
            location: jobToCreate.location,
            salary: jobToCreate.salary,
            experience: jobToCreate.experience,
            screening_questions: jobToCreate.screening_questions ? 
                `Present (${jobToCreate.screening_questions.length} questions)` : "None",
            approved_ai_questions: approvedAiScreeningQuestions ? 
                `Present (${approvedAiScreeningQuestions.length} questions)` : "None"
        }));

        const job = await Job.create(jobToCreate);

        // Ensure we send back the enhanced job data with AI suggestions
        return res.status(201).json({
            success: true,
            message: "Job posted successfully",
            job,
            // Include AI suggestions in the response
            aiSuggestions: {
                improvements: enhancedJob.improvements || [],
                additionalSkills: enhancedJob.additionalSkills || [],
                screeningQuestions: enhancedJob.screeningQuestions || [],
                structuredRequirements: enhancedJob.structuredRequirements || []
            }
        });
    } catch (error) {
        console.error("Error in postJob:", error);
        console.error("Error details:", JSON.stringify({
            message: error.message,
            stack: error.stack,
            name: error.name
        }));
        
        // Send more specific error information
        return res.status(500).json({
            success: false,
            message: "Internal server error while posting job",
            error: error.message
        });
    }
};

// Helper function to ensure screening questions are properly formatted
const formatScreeningQuestions = (questions) => {
    if (!questions) return [];
    
    try {
        // If it's a string, try to parse it if it looks like JSON
        if (typeof questions === 'string') {
            // Check if it's a JSON string
            if (questions.trim().startsWith('[') || questions.trim().startsWith('{')) {
                try {
                    questions = JSON.parse(questions);
                } catch (e) {
                    console.error('Failed to parse screening questions JSON:', e);
                    // If parse fails, treat as plain text question
                    return [{
                        question: questions.trim(),
                        type: 'text',
                        options: [],
                        required: false,
                        weight: 1
                    }];
                }
            } else if (questions.includes('\n')) {
                // Handle multiple lines as separate questions
                return questions.split('\n')
                    .filter(q => q.trim())
                    .map(q => ({
                        question: q.trim(),
                        type: 'text',
                        options: [],
                        required: false,
                        weight: 1
                    }));
            } else {
                // Single plain text question
                return [{
                    question: questions.trim(),
                    type: 'text',
                    options: [],
                    required: false,
                    weight: 1
                }];
            }
        }
        
        // If it's not an array yet, make it one
        if (!Array.isArray(questions)) {
            questions = [questions];
        }
        
        // Process each question to ensure it matches the schema
        return questions.map(q => {
            // Check if q is already properly formatted
            if (q && typeof q === 'object') {
                return {
                    question: typeof q.question === 'string' ? q.question.trim() : 'Question missing',
                    type: q.type && ['text', 'multiple_choice', 'boolean'].includes(q.type) ? q.type : 'text',
                    options: Array.isArray(q.options) ? q.options : [],
                    required: typeof q.required === 'boolean' ? q.required : false,
                    weight: typeof q.weight === 'number' ? q.weight : 1
                };
            }
            
            // If q is a string, create a simple text question
            if (typeof q === 'string') {
                return {
                    question: q.trim(),
                    type: 'text',
                    options: [],
                    required: false,
                    weight: 1
                };
            }
            
            // Fallback for invalid questions
            return {
                question: 'Invalid question format',
                type: 'text',
                options: [],
                required: false,
                weight: 1
            };
        }).filter(q => q.question && q.question !== 'Invalid question format' && q.question !== 'Question missing');
    } catch (error) {
        console.error('Error formatting screening questions:', error);
        return [];
    }
};

// student k liye
export const getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ status: 'Open' })
            .populate('company', 'name logo location')
            .populate('posted_by', 'name')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            jobs
        });
    } catch (error) {
        console.error("Error in getAllJobs:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching jobs"
        });
    }
};

// student
export const getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('company', 'name logo location description website')
            .populate('posted_by', 'name');

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Get application count separately instead of trying to populate applications
        // const applicationsCount = await Application.countDocuments({ job: job._id });

        // Make sure the job object has an applications array, even if empty
        const jobData = job.toObject();
        if (!jobData.applications) {
            jobData.applications = [];
        }

        return res.status(200).json({
            success: true,
            job: jobData
        });
    } catch (error) {
        console.error("Error in getJobById:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching job"
        });
    }
};

// admin kitne job create kra hai abhi tk
export const getAdminJobs = async (req, res) => {
    try {
        // Get companies where user is a recruiter or creator
        const companies = await Company.find({
            $or: [
                { created_by: req.user._id },
                { recruiters: req.user._id }
            ]
        });

        const companyIds = companies.map(company => company._id);

        // Get jobs for these companies
        const jobs = await Job.find({ company: { $in: companyIds } })
            .populate('company', 'name logo location')
            .populate('posted_by', 'name')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            jobs
        });
    } catch (error) {
        console.error("Error in getAdminJobs:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching admin jobs"
        });
    }
};

export const getJobRecommendations = async (req, res) => {
    try {
        const userId = req.id;
        console.log("Fetching recommendations for user:", userId);

        // Get all active jobs, sorted by newest first
        const jobs = await Job.find({ status: 'Open' })
            .populate("company")
            .sort({ createdAt: -1 }) // Sort by newest first
            .lean()
            .exec();

        if (!jobs || jobs.length === 0) {
            console.log("No jobs found in database");
            return res.status(200).json({
                recommendations: [],
                success: true
            });
        }

        // Get user data
        const user = await User.findById(userId).lean().exec();
        
        if (!user || !user.profile) {
            console.log("User not found or has no profile");
            return res.status(200).json({
                recommendations: jobs, // Return newest jobs first if no user profile
                success: true
            });
        }

        // Combine manual and parsed resume skills
        const allUserSkills = [...new Set([
            ...(user.profile.skills || []),
            ...(user.profile.parsedResume?.skills || [])
        ])];

        // Create user profile for similarity calculation
        const userProfile = {
            skills: allUserSkills,
            jobTitle: user.profile.parsedResume?.jobTitle || user.profile.bio || "",
            location: user.profile.parsedResume?.location || user.profile.location || "",
            experienceYears: user.profile.experience || 0
        };

        console.log("User profile for recommendations:", userProfile);

        // Calculate similarity scores for all jobs
        const recommendationsWithScores = await Promise.all(jobs.map(async (job) => {
            const jobData = {
                title: job.title,
                skills: job.requirements || [],
                location: job.location,
                experienceLevel: job.experienceLevel
            };

            const similarity = await calculateCombinedSimilarity(userProfile, jobData);
            return { ...job, similarity };
        }));

        // Sort by similarity score, but ensure new jobs still appear prominently
        const recommendations = recommendationsWithScores
            .sort((a, b) => {
                // Use a weighted scoring that considers both similarity and recency
                const ageA = (new Date() - new Date(a.createdAt)) / (1000 * 60 * 60 * 24); // age in days
                const ageB = (new Date() - new Date(b.createdAt)) / (1000 * 60 * 60 * 24); // age in days
                
                // Boost similarity score for newer jobs
                const adjustedSimA = a.similarity * (1 + (1 / (ageA + 1)));
                const adjustedSimB = b.similarity * (1 + (1 / (ageB + 1)));
                
                return adjustedSimB - adjustedSimA;
            });

        console.log(`Generated ${recommendations.length} recommendations`);

        return res.status(200).json({
            recommendations,
            success: true
        });
    } catch (error) {
        console.error("Error generating recommendations:", error);
        return res.status(500).json({
            message: "Failed to generate recommendations",
            success: false
        });
    }
};

// Track when a user views a job for better recommendation data
export const trackJobView = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;
        
        if (!userId || !jobId) {
            return res.status(400).json({
                message: "User ID and Job ID are required",
                success: false
            });
        }
        
        // Track the interaction
        await trackUserInteraction(userId, jobId, 'view');
        
        return res.status(200).json({
            message: "Job view tracked successfully",
            success: true
        });
    } catch (error) {
        console.error("Error tracking job view:", error);
        return res.status(500).json({
            message: "Failed to track job view",
            success: false
        });
    }
};

// Track when a user applies for a job for better recommendation data
export const trackJobApplication = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;
        
        if (!userId || !jobId) {
            return res.status(400).json({
                message: "User ID and Job ID are required",
                success: false
            });
        }
        
        // Track the interaction
        await trackUserInteraction(userId, jobId, 'apply');
        
        return res.status(200).json({
            message: "Job application tracked successfully",
            success: true
        });
    } catch (error) {
        console.error("Error tracking job application:", error);
        return res.status(500).json({
            message: "Failed to track job application",
            success: false
        });
    }
};

// Delete a job posting (recruiters only)
export const deleteJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const userId = req.user._id; // Access user ID from req.user object

        // Validate job ID
        if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({
                message: "Invalid job ID.",
                success: false
            });
        }

        // Find the job
        const job = await Job.findById(jobId);
        
        if (!job) {
            return res.status(404).json({
                message: "Job not found.",
                success: false
            });
        }

        // Check if user is the job creator or recruiter for the company
        if (!job.posted_by || job.posted_by.toString() !== userId.toString()) {
            // Check if user is a recruiter for this company
            const companyDoc = await Company.findById(job.company);
            if (!companyDoc || !companyDoc.recruiters.includes(userId)) {
                return res.status(403).json({
                    message: "You are not authorized to delete this job posting.",
                    success: false
                });
            }
        }

        // Delete the job
        await Job.findByIdAndDelete(jobId);

        return res.status(200).json({
            message: "Job deleted successfully.",
            success: true
        });
    } catch (error) {
        console.error("Error deleting job:", error);
        res.status(500).json({
            message: "Failed to delete job.",
            success: false
        });
    }
};

// New controller to analyze job posting without saving it
export const analyzeJob = async (req, res) => {
    try {
        const { title, description, requirements, type, location, salary, experience, company, 
                screeningQuestions, lastDate } = req.body;

        // Validate required fields
        if (!title || !description || !requirements || !type || !location || !salary || !experience) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        // Get enhanced job content and suggestions
        const enhancedJob = await enhanceJobPosting({
            title,
            description,
            requirements,
            type,
            location,
            salary,
            experience,
            screening_questions: Array.isArray(screeningQuestions) ? screeningQuestions : [],
            lastDate: lastDate || null
        });

        console.log("Enhanced job object keys:", Object.keys(enhancedJob));
        console.log("AI suggestions:", {
            improvements: enhancedJob.improvements || [],
            additionalSkills: enhancedJob.additionalSkills || [],
            screeningQuestions: enhancedJob.screeningQuestions || [],
            structuredRequirements: enhancedJob.structuredRequirements || []
        });

        // Return just the AI suggestions without creating a job
        return res.status(200).json({
            success: true,
            message: "Job analyzed successfully",
            aiSuggestions: {
                improvements: enhancedJob.improvements || [],
                additionalSkills: enhancedJob.additionalSkills || [],
                screeningQuestions: enhancedJob.screeningQuestions || [],
                structuredRequirements: enhancedJob.structuredRequirements || []
            }
        });
    } catch (error) {
        console.error("Error in analyzeJob:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while analyzing job",
            error: error.message
        });
    }
};