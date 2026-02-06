import natural from "natural";
import embeddingModel from "./embeddingModel.js";

// Predefined categories and their associated keywords
const SKILL_CATEGORIES = {
    technical: [
        'programming', 'development', 'coding', 'software', 'engineering',
        'javascript', 'python', 'java', 'c++', 'react', 'node', 'database',
        'api', 'backend', 'frontend', 'fullstack', 'cloud', 'devops'
    ],
    soft_skills: [
        'communication', 'teamwork', 'leadership', 'problem solving',
        'analytical', 'time management', 'organization', 'collaboration',
        'adaptability', 'creativity', 'critical thinking'
    ],
    tools: [
        'git', 'docker', 'kubernetes', 'aws', 'azure', 'jenkins',
        'jira', 'confluence', 'slack', 'vscode', 'intellij'
    ],
    certifications: [
        'certification', 'certified', 'aws certified', 'microsoft certified',
        'pmp', 'scrum', 'cissp', 'ceh', 'comptia'
    ],
    education: [
        'degree', 'bachelor', 'master', 'phd', 'diploma',
        'computer science', 'engineering', 'information technology'
    ]
};

// Level indicators and their associated keywords
const LEVEL_INDICATORS = {
    beginner: ['basic', 'fundamental', 'entry level', 'junior'],
    intermediate: ['moderate', 'intermediate', 'mid level'],
    advanced: ['advanced', 'senior', 'expert', 'proficient'],
    expert: ['expert', 'master', 'specialist', 'guru']
};

// Importance indicators and their associated keywords
const IMPORTANCE_INDICATORS = {
    must_have: ['required', 'must have', 'essential', 'mandatory'],
    preferred: ['preferred', 'desired', 'important'],
    nice_to_have: ['nice to have', 'plus', 'bonus', 'optional']
};

// Helper function to determine skill category
const determineCategory = async (skill) => {
    try {
        if (!skill) {
            console.log("Warning: Empty skill provided to determineCategory");
            return "other"; // Default category for empty skills
        }

        const normalizedSkill = skill.toLowerCase();
        
        // First try direct category matching
        for (const [category, keywords] of Object.entries(SKILL_CATEGORIES)) {
            if (keywords.some(keyword => normalizedSkill.includes(keyword))) {
                return category;
            }
        }
        
        // If no direct match, use semantic similarity
        try {
            let bestCategory = 'technical'; // default
            let highestSimilarity = 0;
            
            for (const [category, keywords] of Object.entries(SKILL_CATEGORIES)) {
                const similarity = await embeddingModel.calculateSemanticSimilarity(
                    [normalizedSkill],
                    keywords
                );
                
                if (similarity > highestSimilarity) {
                    highestSimilarity = similarity;
                    bestCategory = category;
                }
            }
            
            return bestCategory;
        } catch (embeddingError) {
            console.error('Error in semantic similarity calculation:', embeddingError);
            return 'technical'; // default if embedding fails
        }
    } catch (error) {
        console.error("Error in determineCategory:", error);
        return "technical"; // Default fallback category
    }
};

// Helper function to determine skill level
const determineLevel = async (requirement) => {
    try {
        const normalizedReq = requirement.toLowerCase();
        
        // First try direct level matching
        for (const [level, keywords] of Object.entries(LEVEL_INDICATORS)) {
            if (keywords.some(keyword => normalizedReq.includes(keyword))) {
                return level;
            }
        }
        
        // If no direct match, use semantic similarity
        let bestLevel = 'intermediate'; // default
        let highestSimilarity = 0;
        
        for (const [level, keywords] of Object.entries(LEVEL_INDICATORS)) {
            const similarity = await embeddingModel.calculateSemanticSimilarity(
                [normalizedReq],
                keywords
            );
            
            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestLevel = level;
            }
        }
        
        return bestLevel;
    } catch (error) {
        console.error('Error determining level:', error);
        return 'intermediate'; // default fallback
    }
};

// Helper function to determine importance
const determineImportance = async (requirement) => {
    try {
        const normalizedReq = requirement.toLowerCase();
        
        // First try direct importance matching
        for (const [importance, keywords] of Object.entries(IMPORTANCE_INDICATORS)) {
            if (keywords.some(keyword => normalizedReq.includes(keyword))) {
                return importance;
            }
        }
        
        // If no direct match, use semantic similarity
        let bestImportance = 'must_have'; // default
        let highestSimilarity = 0;
        
        for (const [importance, keywords] of Object.entries(IMPORTANCE_INDICATORS)) {
            const similarity = await embeddingModel.calculateSemanticSimilarity(
                [normalizedReq],
                keywords
            );
            
            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestImportance = importance;
            }
        }
        
        return bestImportance;
    } catch (error) {
        console.error('Error determining importance:', error);
        return 'must_have'; // default fallback
    }
};

// Calculate weight based on importance and category
const calculateWeight = (importance, category) => {
    const importanceWeights = {
        must_have: 5,
        preferred: 3,
        nice_to_have: 1
    };
    
    const categoryWeights = {
        technical: 1.0,
        soft_skills: 0.8,
        tools: 0.7,
        certifications: 0.6,
        education: 0.9
    };
    
    return Math.min(5, importanceWeights[importance] * categoryWeights[category]);
};

// Main function to extract and structure requirements
export const extractStructuredRequirements = async (requirements) => {
    if (!Array.isArray(requirements)) {
        requirements = [requirements];
    }
    
    const structuredRequirements = await Promise.all(requirements.map(async (req) => {
        try {
            // Clean the requirement text
            const cleanedReq = req.trim();
            
            // Determine category, level, and importance
            const category = await determineCategory(cleanedReq);
            const level = await determineLevel(cleanedReq);
            const importance = await determineImportance(cleanedReq);
            
            // Calculate weight
            const weight = calculateWeight(importance, category);
            
            return {
                skill: cleanedReq,
                category,
                level,
                importance,
                weight
            };
        } catch (error) {
            console.error('Error processing requirement:', error);
            // Return a default structured requirement
            return {
                skill: req.trim(),
                category: 'technical',
                level: 'intermediate',
                importance: 'must_have',
                weight: 3
            };
        }
    }));
    
    return structuredRequirements;
};

// Function to validate and normalize requirements
export const validateRequirements = (requirements) => {
    if (!Array.isArray(requirements)) {
        throw new Error('Requirements must be an array');
    }
    
    return requirements.filter(req => {
        if (typeof req !== 'string') return false;
        const cleaned = req.trim();
        return cleaned.length > 0;
    });
};

// Function to merge similar requirements
export const mergeSimilarRequirements = async (requirements) => {
    const merged = [];
    const tokenizer = new natural.WordTokenizer();
    
    for (const req of requirements) {
        const tokens = tokenizer.tokenize(req.skill.toLowerCase());
        let isDuplicate = false;
        
        for (const existing of merged) {
            const existingTokens = tokenizer.tokenize(existing.skill.toLowerCase());
            const similarity = await embeddingModel.calculateSemanticSimilarity(tokens, existingTokens);
            
            if (similarity > 0.8) {
                // Merge by keeping the higher weight
                existing.weight = Math.max(existing.weight, req.weight);
                isDuplicate = true;
                break;
            }
        }
        
        if (!isDuplicate) {
            merged.push(req);
        }
    }
    
    return merged;
}; 