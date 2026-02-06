import pdfParse from "pdf-parse";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Validate file type and size
export const validateResumeFile = (file) => {
    if (!file || !file.buffer) {
        throw new Error('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size too large. Maximum size is 5MB');
    }

    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('Invalid file type. Only PDF files are allowed');
    }

    return true;
};

// Helper function to clean and normalize text
const normalizeText = (text) => {
    if (!text) return '';
    return text.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

// Helper function to escape special regex characters
const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Helper function to extract skills from text
export const extractSkills = (text) => {
    if (!text) return [];
    
    // Comprehensive list of common technical skills
    const skillsList = [
        "JavaScript", "Python", "Java", "C\\+\\+", "SQL", "ExpressJS", 
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

    const normalizedText = normalizeText(text);
    
    // Extract skills using more robust matching
    const extractedSkills = skillsList.map(skill => {
        try {
            // Handle special case for C++
            const searchSkill = skill === "C\\+\\+" ? "c++" : skill.toLowerCase();
            const normalizedSkill = escapeRegExp(searchSkill);
            
            // Check for whole word matches to avoid partial matches
            const regex = new RegExp(`\\b${normalizedSkill}\\b`, 'i');
            return regex.test(normalizedText) ? (skill === "C\\+\\+" ? "C++" : skill) : null;
        } catch (error) {
            console.warn(`Error matching skill ${skill}:`, error.message);
            return null;
        }
    }).filter(Boolean); // Remove null values

    return [...new Set(extractedSkills)]; // Remove duplicates
};

// Helper function to extract job title from text
export const extractJobTitle = (text) => {
    if (!text) return "";

    const commonTitles = [
        "Software Engineer", "Software Developer", "Full Stack Developer",
        "Frontend Developer", "Backend Developer", "DevOps Engineer",
        "Data Scientist", "Machine Learning Engineer", "Product Manager",
        "Project Manager", "HR", "Human Resources", "Recruiter",
        "UI/UX Designer", "System Administrator", "Database Administrator",
        "QA Engineer", "Test Engineer", "Security Engineer"
    ];

    const normalizedText = normalizeText(text);
    
    // Try to find an exact match first
    const exactMatch = commonTitles.find(title => 
        normalizedText.includes(title.toLowerCase())
    );
    
    if (exactMatch) return exactMatch;

    // If no exact match, try partial matches
    const partialMatch = commonTitles.find(title => {
        const titleWords = title.toLowerCase().split(' ');
        return titleWords.some(word => normalizedText.includes(word));
    });

    return partialMatch || "Other";
};

// Helper function to extract location from text
export const extractLocation = (text) => {
    if (!text) return "";

    const locations = [
        "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
        "Kolkata", "Pune", "Ahmedabad", "New York", "London",
        "San Francisco", "Singapore", "Dubai", "Tokyo", "Berlin",
        "Remote", "Work from Home", "Hybrid"
    ];

    const normalizedText = normalizeText(text);
    
    // Try to find an exact match first
    const exactMatch = locations.find(loc => 
        normalizedText.includes(loc.toLowerCase())
    );

    return exactMatch || "Not Specified";
};

export const parseResume = async (fileBuffer) => {
    try {
        // Add timeout to prevent hanging on large files
        const options = {
            max: 2, // Max number of pages to parse
            timeout: 10000, // 10 seconds timeout
        };

        const data = await pdfParse(fileBuffer, options);
        const text = data.text;

        if (!text || text.trim().length === 0) {
            throw new Error('No text content found in PDF');
        }

        // Extract information
        const skills = extractSkills(text);
        const jobTitle = extractJobTitle(text);
        const location = extractLocation(text);

        // Log extracted information for debugging
        console.log('Extracted information:', {
            skillsCount: skills.length,
            skills,
            jobTitle,
            location
        });

        return {
            skills,
            jobTitle,
            location,
            rawText: text // Include raw text for debugging
        };
    } catch (error) {
        console.error("Error parsing resume:", error);
        
        // Provide more specific error messages
        if (error.message.includes('timeout')) {
            throw new Error('Resume parsing timed out. Please try with a smaller file.');
        } else if (error.message.includes('No text content')) {
            throw new Error('Could not extract text from the PDF. Please ensure the file is not password protected or corrupted.');
        }
        
        throw new Error('Failed to parse resume. Please try again with a different file.');
    }
};