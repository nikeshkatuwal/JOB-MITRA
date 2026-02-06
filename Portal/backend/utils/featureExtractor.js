import pdfParse from "pdf-parse";
import embeddingModel from "./embeddingModel.js";

// Helper function to extract skills from text
export const extractSkills = async (text) => {
    if (!text) return [];
    
    // Ensure the embedding model is initialized
    if (!embeddingModel.initialized) {
        await embeddingModel.initialize();
    }
    
    // Comprehensive list of common technical skills
    const skillsList = [
        "JavaScript", "Python", "Java", "C++", "SQL", "ExpressJS", 
        "React", "Node.js", "MongoDB", "HTML", "CSS",
        "Machine Learning", "AI", "Data Science", "Cloud Computing",
        "AWS", "Azure", "DevOps", "Docker", "Kubernetes",
        "Git", "REST API", "GraphQL", "TypeScript", "Angular",
        "Vue.js", "PHP", "Ruby", "Swift", "Kotlin",
        "Android", "iOS", "React Native", "Flutter", "Blockchain",
        "Cybersecurity", "Network Security", "Database Management",
        "Agile", "Scrum", "Project Management", "Team Leadership",
        "Problem Solving", "Communication", "Analytical Skills"
    ];

    // Clean and normalize the input text
    const normalizedText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ");
    
    // Extract skills using our basic keyword approach
    const basicExtractedSkills = skillsList.filter(skill => {
        const normalizedSkill = skill.toLowerCase();
        return normalizedText.includes(normalizedSkill);
    });
    
    // Use NLP to extract additional skills that might be phrased differently
    try {
        const entities = await embeddingModel.extractEntities(text);
        const nlpExtractedSkills = entities.skills;
        
        // Combine skills from both methods and remove duplicates
        const allSkills = [...new Set([...basicExtractedSkills, ...nlpExtractedSkills])];
        
        // For each skill in our comprehensive list, check if there's a highly similar skill
        // in the text using word embeddings
        for (const skill of skillsList) {
            const skillWords = skill.toLowerCase().split(/\s+/);
            const textWords = normalizedText.split(/\s+/).filter(word => word.length > 3);
            
            const similarity = embeddingModel.calculateSemanticSimilarity(skillWords, textWords);
            
            // If semantic similarity is high enough but the skill wasn't caught by exact matching
            if (similarity > 0.7 && !allSkills.includes(skill)) {
                allSkills.push(skill);
            }
        }
        
        return allSkills;
    } catch (error) {
        console.error("Error in NLP skill extraction:", error);
        // Fallback to basic extraction if NLP fails
        return basicExtractedSkills;
    }
};

// Helper function to extract job title from text
export const extractJobTitle = async (text) => {
    if (!text) return "";

    // Ensure the embedding model is initialized
    if (!embeddingModel.initialized) {
        await embeddingModel.initialize();
    }

    const commonTitles = [
        "Software Engineer", "Software Developer", "Full Stack Developer",
        "Frontend Developer", "Backend Developer", "DevOps Engineer",
        "Data Scientist", "Machine Learning Engineer", "Product Manager",
        "Project Manager", "HR", "Human Resources", "Recruiter",
        "UI/UX Designer", "System Administrator", "Database Administrator",
        "QA Engineer", "Test Engineer", "Security Engineer"
    ];

    // First try basic keyword matching
    const normalizedText = text.toLowerCase();
    const basicMatchedTitle = commonTitles.find(title => 
        normalizedText.includes(title.toLowerCase())
    );

    // If we found a title with basic matching, return it
    if (basicMatchedTitle) return basicMatchedTitle;
    
    // Otherwise, try NLP entity extraction
    try {
        const entities = await embeddingModel.extractEntities(text);
        if (entities.jobTitles && entities.jobTitles.length > 0) {
            return entities.jobTitles[0]; // Return the first extracted job title
        }
        
        // If no job titles were extracted, try semantic matching
        const textWords = normalizedText.split(/\s+/).filter(word => word.length > 3);
        
        let bestMatch = null;
        let highestSimilarity = 0;
        
        for (const title of commonTitles) {
            const titleWords = title.toLowerCase().split(/\s+/);
            const similarity = embeddingModel.calculateSemanticSimilarity(titleWords, textWords);
            
            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestMatch = title;
            }
        }
        
        if (highestSimilarity > 0.5 && bestMatch) {
            return bestMatch;
        }
    } catch (error) {
        console.error("Error in NLP job title extraction:", error);
    }

    // Fallback to returning the input text if we couldn't find a match
    return text;
};

// Helper function to extract location from text
export const extractLocation = async (text) => {
    if (!text) return "";

    // Ensure the embedding model is initialized
    if (!embeddingModel.initialized) {
        await embeddingModel.initialize();
    }

    const locations = [
        "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
        "Kolkata", "Pune", "Ahmedabad", "New York", "London",
        "San Francisco", "Singapore", "Dubai", "Tokyo", "Berlin",
        "Remote", "Work from Home", "Hybrid"
    ];

    // First try basic keyword matching
    const normalizedText = text.toLowerCase();
    const basicMatchedLocation = locations.find(loc => 
        normalizedText.includes(loc.toLowerCase())
    );

    // If we found a location with basic matching, return it
    if (basicMatchedLocation) return basicMatchedLocation;
    
    // Otherwise, try NLP entity extraction
    try {
        const entities = await embeddingModel.extractEntities(text);
        if (entities.locations && entities.locations.length > 0) {
            return entities.locations[0]; // Return the first extracted location
        }
        
        // If no locations were extracted, try semantic matching
        const textWords = normalizedText.split(/\s+/).filter(word => word.length > 3);
        
        let bestMatch = null;
        let highestSimilarity = 0;
        
        for (const location of locations) {
            const locationWords = location.toLowerCase().split(/\s+/);
            const similarity = embeddingModel.calculateSemanticSimilarity(locationWords, textWords);
            
            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestMatch = location;
            }
        }
        
        if (highestSimilarity > 0.5 && bestMatch) {
            return bestMatch;
        }
    } catch (error) {
        console.error("Error in NLP location extraction:", error);
    }

    // Fallback to returning the input text if we couldn't find a match
    return text;
};

export const parseResume = async (fileBuffer) => {
    try {
        // Ensure the embedding model is initialized
        if (!embeddingModel.initialized) {
            await embeddingModel.initialize();
        }
        
        const data = await pdfParse(fileBuffer);
        const text = data.text;

        // Extract skills, job title, and location using enhanced methods
        const skills = await extractSkills(text);
        const jobTitle = await extractJobTitle(text);
        const location = await extractLocation(text);

        return {
            skills,
            jobTitle,
            location,
            fullText: text // Store full text for more advanced processing if needed
        };
    } catch (error) {
        console.error("Error parsing resume:", error);
        return {
            skills: [],
            jobTitle: "",
            location: "",
            fullText: ""
        };
    }
};