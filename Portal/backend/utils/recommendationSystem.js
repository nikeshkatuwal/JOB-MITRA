import { extractSkills, extractJobTitle, extractLocation } from "./featureExtractor.js";
import { calculateCombinedSimilarity } from "./similarityCalculator.js";
import embeddingModel from "./embeddingModel.js";

// Enhanced job recommendation system
export const recommendJobs = async (jobs, userProfile, userHistory = null) => {
    console.log("Starting enhanced job recommendations");
    
    // Initialize embedding model if needed
    if (!embeddingModel.initialized) {
        await embeddingModel.initialize();
    }
    
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
        console.log("No jobs provided for recommendations");
        return [];
    }

    const { skills = [], parsedResume = {}, jobTitle = "", location = "", experienceYears = "" } = userProfile;
    
    // Combine and deduplicate skills from both sources
    const allUserSkills = [...new Set([
        ...(skills || []),
        ...(parsedResume?.skills || [])
    ])];

    // Prefer parsed job title and location if available
    const effectiveJobTitle = parsedResume?.jobTitle || jobTitle || "";
    const effectiveLocation = parsedResume?.location || location || "";

    console.log("Processing recommendations with user profile:", { 
        skills: allUserSkills, 
        jobTitle: effectiveJobTitle, 
        location: effectiveLocation,
        experienceYears: experienceYears
    });

    // Process jobs and calculate similarity scores
    const recommendations = await Promise.all(jobs.map(async (job) => {
        try {
            if (!job?.description || !job?.title || !job?.location) {
                console.log("Skipping job due to missing required fields:", job?._id);
                return null;
            }

            // Create job object for similarity calculation
            const jobData = {
                title: job.title,
                skills: [], // Will properly populate from requirements
                location: job.location,
                // Improved experience level extraction
                // First check if experienceLevel is defined as a number
                // Then try to parse from experience string
                // Finally default to 0 for entry-level positions
                experienceLevel: job.experienceLevel !== undefined ? job.experienceLevel :
                                job.experience ? parseInt(job.experience.match(/\d+/)?.[0]) || 0 : 
                                job.title.toLowerCase().includes('senior') ? 5 : 
                                job.title.toLowerCase().includes('junior') ? 1 : 0,
            _debugExperienceSource: job.experienceLevel !== undefined ? 'db-field' : 
                                  job.experience ? 'experience-string' : 
                                  job.title.match(/senior|junior/i) ? 'title-inference' : 'default'

            };
            
            console.log(`Job ${job.title} has experience requirement: ${job.experience}`);
            
            // Process requirements based on their structure
            if (Array.isArray(job.requirements) && job.requirements.length > 0) {
                // Check if requirements are already in the correct format
                if (job.requirements[0].skill) {
                    jobData.skills = job.requirements;
                } 
                // Handle requirements that are plain strings
                else if (typeof job.requirements[0] === 'string') {
                    jobData.skills = job.requirements.map(skill => ({
                        skill: skill,
                        category: 'technical',
                        importance: 'must_have',
                        weight: 1.0
                    }));
                }
                // If requirements format is unknown, try to extract skills from the description
                else {
                    console.warn(`Unknown requirements format for job: ${job.title}, falling back to description`);
                    // Extract skills from job description as a fallback
                    const extractedSkills = extractSkills(job.description);
                    jobData.skills = extractedSkills.map(skill => ({
                        skill: skill,
                        category: 'technical',
                        importance: 'must_have',
                        weight: 1.0
                    }));
                }
            } else if (job.description) {
                // Extract skills from job description when requirements are missing
                const extractedSkills = extractSkills(job.description);
                jobData.skills = extractedSkills.map(skill => ({
                    skill: skill,
                    category: 'technical',
                    importance: 'must_have',
                    weight: 1.0
                }));
            }

            // Add more debugging for job requirements
            console.log(`Processing job: ${job.title}, with ${jobData.skills.length} requirements`);
            if (jobData.skills.length > 0) {
                console.log(`Sample requirements:`, JSON.stringify(jobData.skills.slice(0, 2)));
            }
            
            // Calculate similarity using the standardized method
            const similarity = await calculateCombinedSimilarity(
                {
                    skills: allUserSkills,
                    jobTitle: effectiveJobTitle,
                    location: effectiveLocation,
                    experienceYears: experienceYears
                },
                jobData
            );

            return { ...job, similarity };
        } catch (error) {
            console.error("Error processing job:", job?._id, error);
            return null;
        }
    }));

    // Filter out null results and sort by similarity
    const validRecommendations = recommendations
        .filter(job => job !== null && job.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity);

    console.log(`Generated ${validRecommendations.length} recommendations`);
    
    return validRecommendations;
};

// Track user interactions with jobs for feedback loop
export const trackUserInteraction = async (userId, jobId, interactionType) => {
    try {
        // This function would typically update a database collection
        // For demonstration purposes, we'll just log the interaction
        console.log(`Tracking user interaction: ${userId} ${interactionType} job ${jobId}`);
        
        // In a real implementation, you would store this data and use it to improve recommendations
        // Example: Update a UserInteraction collection in MongoDB
        /*
        await UserInteraction.create({
            userId,
            jobId,
            interactionType,
            timestamp: new Date()
        });
        */
        
        return true;
    } catch (error) {
        console.error("Error tracking user interaction:", error);
        return false;
    }
};

// Get user history for recommendation enhancement
export const getUserHistory = async (userId) => {
    try {
        // This function would typically query a database
        // For demonstration purposes, we'll return a mock history
        console.log(`Getting user history for ${userId}`);
        
        // In a real implementation, you would query your database
        // Example: Find recent interactions in MongoDB
        /*
        const interactions = await UserInteraction.find({ userId })
            .sort({ timestamp: -1 })
            .limit(20);
            
        // Get the job details for all viewed jobs
        const viewedJobIds = interactions
            .filter(i => i.interactionType === 'view')
            .map(i => i.jobId);
            
        const viewedJobs = await Job.find({ _id: { $in: viewedJobIds } });
        
        // Get the job details for all applied jobs
        const appliedJobIds = interactions
            .filter(i => i.interactionType === 'apply')
            .map(i => i.jobId);
            
        const appliedJobs = await Job.find({ _id: { $in: appliedJobIds } });
        
        return {
            viewedJobs,
            appliedJobs
        };
        */
        
        // For now, return empty history
        return {
            viewedJobs: [],
            appliedJobs: []
        };
    } catch (error) {
        console.error("Error getting user history:", error);
        return {
            viewedJobs: [],
            appliedJobs: []
        };
    }
};