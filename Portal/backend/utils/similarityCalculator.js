import natural from "natural";
import embeddingModel from "./embeddingModel.js";

// Create feature vector with semantic similarity
export const createFeatureVector = async (skills, jobTitle, location, experienceYears, userHistory = null) => {
    // Ensure the embedding model is initialized
    if (!embeddingModel.initialized) {
        await embeddingModel.initialize();
    }

    // Initialize weights for different aspects
    const weights = {
        must_have: 1.0,
        preferred: 0.7,
        nice_to_have: 0.3,
        technical: 1.0,
        soft_skills: 0.8,
        tools: 0.7,
        certifications: 0.6,
        education: 0.9
    };

    // Calculate skill matches with weights
    const calculateSkillMatch = async (userSkill, requirement) => {
        try {
            // Check if requirement has the expected structure
            if (!requirement || typeof requirement !== 'object' || !requirement.skill) {
                console.error('Invalid requirement object:', requirement);
                return 0;
            }

            const similarity = await embeddingModel.calculateSemanticSimilarity(
                [userSkill.toLowerCase()],
                [requirement.skill.toLowerCase()]
            );

            // Apply weights based on importance and category - with safe defaults
            const importance = requirement.importance || 'must_have';
            const category = requirement.category || 'technical';
            const weight = typeof requirement.weight === 'number' ? requirement.weight : 1.0;
            
            const importanceWeight = weights[importance] || weights.must_have;
            const categoryWeight = weights[category] || weights.technical;
            
            // Combine weights and similarity
            return similarity * importanceWeight * categoryWeight * weight;
        } catch (error) {
            console.error('Error calculating skill match:', error, 'for skill:', userSkill);
            return 0;
        }
    };

    // Process skills matches
    const processSkillMatches = async (userSkills, requirements) => {
        const matches = [];
        
        for (const requirement of requirements) {
            let bestMatch = 0;
            
            for (const userSkill of userSkills) {
                const match = await calculateSkillMatch(userSkill, requirement);
                bestMatch = Math.max(bestMatch, match);
            }
            
            matches.push(bestMatch);
        }
        
        return matches;
    };

    // Calculate experience match
    const calculateExperienceMatch = (userExp, jobExp, jobTitle = null) => {
        const userYears = parseFloat(userExp) || 0;
        let requiredYears = parseFloat(jobExp) || 0;
        
        // If job experience is undefined or not specified, try to extract from job title
        if (jobExp === undefined || jobExp === null || jobExp === '') {
            // Check if we have a job title in the context to infer experience requirements
            if (jobTitle) {
                const normalizedTitle = jobTitle.toLowerCase();
                
                // First try to extract numeric experience requirements from the job title
                // This regex matches patterns like "5+ years", "5 years", "5 yrs", "5+ yrs experience", etc.
                const experienceMatch = normalizedTitle.match(/\b(\d+)\+?\s*(?:year|yr|yrs)s?(?:\s+(?:of\s+)?(?:experience|exp))?\b/i);
                if (experienceMatch && experienceMatch[1]) {
                    requiredYears = parseInt(experienceMatch[1], 10);
                    console.log(`Extracted ${requiredYears} years experience requirement from job title: ${jobTitle}`);
                }
                // Also check for mid-level experience indicators
                else if (normalizedTitle.includes('mid-level') || normalizedTitle.includes('mid level')) {
                    requiredYears = 2; // Mid-level positions typically require 2+ years
                    console.log(`Inferred mid-level (${requiredYears} years) experience requirement from job title: ${jobTitle}`);
                }
                // If no numeric requirement found, infer from job level keywords
                else if (normalizedTitle.includes('senior') || normalizedTitle.includes('lead')) {
                    requiredYears = 3; // Senior positions typically require 3+ years
                } else if (normalizedTitle.includes('junior')) {
                    requiredYears = 1; // Junior positions typically require 1+ year
                } else if (normalizedTitle.includes('intern') || normalizedTitle.includes('trainee')) {
                    requiredYears = 0; // Internships/trainee positions typically don't require experience
                }
                // For other positions, keep requiredYears at 0 (default)
            }
        }
        
        // Log the experience requirements for debugging
        console.log(`Experience matching: User has ${userYears} years, job requires ${requiredYears} years`);
        
        // For positions requiring significant experience (3+ years), give very low scores to inexperienced candidates
        if (requiredYears >= 3 && userYears < 1) {
            return 0.2; // Very low match for senior positions when user has minimal experience
        }
        
        // For positions requiring substantial experience (5+ years), give even lower scores to candidates with less than 2 years
        if (requiredYears >= 5 && userYears < 2) {
            return 0.1; // Extremely low match for very senior positions when user has limited experience
        }
        
        // Special handling for senior positions with inconsistent experienceLevel
        // If job title contains 'senior' but experienceLevel is 0, apply senior-level scoring
        if (requiredYears === 0 && jobTitle && jobTitle.toLowerCase().includes('senior') && userYears < 1) {
            console.log(`Detected senior position with inconsistent experienceLevel=0: ${jobTitle}. Applying senior-level scoring.`);
            return 0.2; // Very low match for senior positions when user has minimal experience
        }
        
        // Check for Cloud Engineer positions specifically, which typically require more experience
        if (jobTitle && jobTitle.toLowerCase().includes('cloud engineer') && requiredYears === 0) {
            // Default to 3 years experience for Cloud Engineer positions if not specified
            requiredYears = 3;
            console.log(`Setting default experience requirement for Cloud Engineer position to ${requiredYears} years`);
            
            // Recalculate match with the new requirement
            if (userYears < 1) {
                return 0.2; // Very low match for Cloud Engineer positions when user has minimal experience
            }
        }
        
        if (userYears >= requiredYears) {
            return 1.0; // Perfect match when user meets or exceeds requirements
        } else if (requiredYears === 0) {
            return 0.9; // Very good score for entry level positions
        } else {
            // More granular scoring for experience mismatch
            const ratio = userYears / Math.max(1, requiredYears);
            
            // More detailed scoring tiers based on the ratio of user experience to required experience
            if (ratio >= 0.8) return 0.9;      // User has at least 80% of required experience
            else if (ratio >= 0.7) return 0.8; // User has at least 70% of required experience
            else if (ratio >= 0.6) return 0.7; // User has at least 60% of required experience
            else if (ratio >= 0.5) return 0.6; // User has at least 50% of required experience
            else if (ratio >= 0.4) return 0.5; // User has at least 40% of required experience
            else if (ratio >= 0.3) return 0.4; // User has at least 30% of required experience
            else if (ratio >= 0.2) return 0.3; // User has at least 20% of required experience
            
            // Very low experience compared to requirements
            return 0.2;
        }
    };

    return {
        skillMatches: async (requirements) => {
            if (!skills || !requirements) return [];
            return processSkillMatches(skills, requirements);
        },
        experienceMatch: (requiredExperience, jobTitle = null) => {
            return calculateExperienceMatch(experienceYears, requiredExperience, jobTitle);
        },
        locationMatch: async (jobLocation) => {
            if (!location || !jobLocation) return 0;
            try {
                const similarity = await embeddingModel.calculateSemanticSimilarity(
                    [location.toLowerCase()],
                    [jobLocation.toLowerCase()]
                );
                return similarity;
            } catch (error) {
                console.error('Error calculating location match:', error);
                return 0;
            }
        },
        titleMatch: async (postingJobTitle) => {
            if (!jobTitle || !postingJobTitle) return 0;
            try {
                const similarity = await embeddingModel.calculateSemanticSimilarity(
                    [jobTitle.toLowerCase()], 
                    [postingJobTitle.toLowerCase()]
                );
                return similarity;
            } catch (error) {
                console.error('Error calculating title match:', error);
                return 0;
            }
        }
    };
};

// Calculate combined similarity score
export const calculateCombinedSimilarity = async (userProfile, jobData) => {
    try {
        console.log("Calculating similarity for job application:", {
            userProfile,
            jobData
        });

        const vector = await createFeatureVector(
            userProfile.skills,
            userProfile.jobTitle,
            userProfile.location,
            userProfile.experienceYears
        );

        // Calculate skill matches - using jobData.skills instead of jobData.requirements
        const skillMatches = await vector.skillMatches(jobData.skills);
        const avgSkillMatch = skillMatches.length > 0 
            ? skillMatches.reduce((a, b) => a + b, 0) / skillMatches.length 
            : 0;

        // Calculate other matches
        // Ensure experienceLevel is properly handled even if undefined
        const experienceMatch = vector.experienceMatch(jobData.experienceLevel, jobData.title);
        const locationMatch = await vector.locationMatch(jobData.location);
        const titleMatch = await vector.titleMatch(jobData.title);

        // Weight the different components
        const weights = {
            skills: 0.5,
            experience: 0.23,
            location: 0.15,
            title: 0.15
        };

        // Calculate final similarity score
        const similarity = (
            avgSkillMatch * weights.skills +
            experienceMatch * weights.experience +
            locationMatch * weights.location +
            titleMatch * weights.title
        );

        // Log individual component scores for debugging
        console.log("Similarity calculation details:", {
            job: jobData.title,
            avgSkillMatch: avgSkillMatch.toFixed(2),
            experienceMatch: experienceMatch.toFixed(2),
            locationMatch: locationMatch.toFixed(2),
            titleMatch: titleMatch.toFixed(2),
            finalScore: similarity.toFixed(2)
        });

        return similarity;
    } catch (error) {
        console.error('Error calculating combined similarity:', error);
        return 0;
    }
};