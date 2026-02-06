import dotenv from 'dotenv';
import { extractStructuredRequirements } from './requirementsExtractor.js';
import fetch from 'node-fetch';

dotenv.config();

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const MODEL_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";

// Maximum number of retries for API calls
const MAX_RETRIES = 3;
// Initial delay before retrying (in ms)
const INITIAL_RETRY_DELAY = 1000;

const generateText = async (prompt) => {
    // Mock AI response with realistic suggestions based on the job title and description
    console.log("Using mock AI service to generate suggestions");
    
    // Extract job information from prompt
    const titleMatch = prompt.match(/Job Title: (.+?)\n/);
    const descriptionMatch = prompt.match(/Description: (.+?)\nCurrent Requirements/s);
    const requirementsMatch = prompt.match(/Current Requirements: (.+?)\nExperience Level/);
    
    const title = titleMatch ? titleMatch[1].trim() : '';
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';
    const requirements = requirementsMatch ? requirementsMatch[1].trim() : '';
    
    // Initialize response sections
    let response = '';
    
    // Detect job domain
    const isFrontend = /frontend|react|angular|vue|ui|ux|html|css|javascript/i.test(title + description);
    const isBackend = /backend|api|server|node|express|django|flask|php|laravel|database/i.test(title + description);
    const isFullstack = /fullstack|full-stack|full stack/i.test(title + description) || (isFrontend && isBackend);
    const isDevOps = /devops|ci\/cd|docker|kubernetes|aws|cloud|infrastructure/i.test(title + description);
    const isML = /machine learning|data science|ai|artificial intelligence|ml|deep learning/i.test(title + description);
    const isMobile = /mobile|android|ios|flutter|react native|swift/i.test(title + description);
    
    // Generate technical requirements based on job domain
    if (isFrontend) {
        response += 'REQ: JavaScript (must)\n';
        response += 'REQ: React or equivalent frontend framework\n';
        response += 'REQ: HTML5/CSS3 proficiency\n';
        response += 'REQ: Responsive design experience\n';
        response += 'REQ: State management (Redux, Context API, etc.)\n';
    } else if (isBackend) {
        response += 'REQ: Server-side language proficiency (Node.js, Python, Java, etc.) (must)\n';
        response += 'REQ: REST API design and implementation\n';
        response += 'REQ: Database knowledge (SQL or NoSQL)\n';
        response += 'REQ: Authentication and authorization implementation\n';
        response += 'REQ: Performance optimization techniques\n';
    } else if (isFullstack) {
        response += 'REQ: Frontend technologies (JavaScript, HTML, CSS) (must)\n';
        response += 'REQ: Backend programming (Node.js, Python, etc.)\n';
        response += 'REQ: Database design and management\n';
        response += 'REQ: API development\n';
        response += 'REQ: Full product lifecycle experience\n';
    } else if (isDevOps) {
        response += 'REQ: Cloud platform experience (AWS, Azure, GCP) (must)\n';
        response += 'REQ: Infrastructure as Code (Terraform, CloudFormation)\n';
        response += 'REQ: Containerization (Docker, Kubernetes)\n';
        response += 'REQ: CI/CD pipeline implementation\n';
        response += 'REQ: Monitoring and logging solutions\n';
    } else if (isML) {
        response += 'REQ: Machine learning algorithms and frameworks (must)\n';
        response += 'REQ: Python programming\n';
        response += 'REQ: Data preprocessing and feature engineering\n';
        response += 'REQ: Model evaluation and deployment\n';
        response += 'REQ: Statistical analysis\n';
    } else if (isMobile) {
        response += 'REQ: Mobile development (Android/iOS) (must)\n';
        response += 'REQ: Cross-platform frameworks (React Native, Flutter)\n';
        response += 'REQ: UI/UX principles for mobile\n';
        response += 'REQ: Performance optimization for mobile devices\n';
        response += 'REQ: App store deployment processes\n';
    } else {
        // Generic software engineering requirements
        response += 'REQ: Programming language proficiency (must)\n';
        response += 'REQ: Software design principles\n';
        response += 'REQ: Problem-solving skills\n';
        response += 'REQ: Version control (Git)\n';
        response += 'REQ: Testing methodologies\n';
    }
    
    // Add improvement suggestions
    response += '\nIMP: Specify years of experience required for each technology\n';
    response += 'IMP: Include information about the team structure and reporting lines\n';
    response += 'IMP: Add details about project methodologies used (Agile, Scrum, etc.)\n';
    response += 'IMP: Mention growth opportunities and career advancement paths\n';
    response += 'IMP: Include information about remote work options or flexibility\n';
    
    // Add additional skill suggestions
    response += '\nSKILL: Communication and collaboration abilities\n';
    response += 'SKILL: Problem-solving approach\n';
    response += 'SKILL: Adaptability and willingness to learn\n';
    response += 'SKILL: Time management and organization\n';
    
    // Add experience suggestion
    const seniorityLevel = /senior|lead|principal|architect/i.test(title) ? 'senior' : 
                        /junior|entry/i.test(title) ? 'junior' : 'mid-level';
    if (seniorityLevel === 'senior') {
        response += '\nEXP: 5+ years of professional experience recommended\n';
    } else if (seniorityLevel === 'junior') {
        response += '\nEXP: 0-2 years of professional experience with strong fundamentals\n';
    } else {
        response += '\nEXP: 2-4 years of professional experience recommended\n';
    }
    
    // Add screening questions
    response += '\nQ: Describe a challenging project you worked on and how you overcame the obstacles\n';
    response += 'Q: How do you stay updated with the latest technologies and industry trends?\n';
    
    if (isFrontend) {
        response += 'Q: How would you optimize a React application for performance?\n';
        response += 'Q: Explain your approach to creating responsive and accessible UI components\n';
    } else if (isBackend) {
        response += 'Q: How do you design and secure RESTful APIs?\n';
        response += 'Q: Describe your approach to database schema design and optimization\n';
    } else if (isFullstack) {
        response += 'Q: How do you manage the integration between frontend and backend systems?\n';
        response += 'Q: Describe your experience with deploying full-stack applications\n';
    }
    
    return response;
};

const PROMPT_TEMPLATE = `Analyze this job posting and provide structured information:

Job Title: {title}
Description: {description}
Current Requirements: {requirements}
Experience Level: {experienceLevel}

Please provide:
1. Technical Requirements (prefix with REQ:)
2. Improvements (prefix with IMP:)
3. Additional Skills (prefix with SKILL:)
4. Experience Level (prefix with EXP:)
5. Role-specific Screening Questions (prefix with Q:)
   - Focus on technical skills and experience relevant to {title}
   - Include questions about specific technologies mentioned in requirements
   - Ask about problem-solving scenarios related to the role
   - Include questions about relevant methodologies and best practices
   - Mix of technical and behavioral questions specific to this position

Format each point with the specified prefix on a new line.`;

// New function to extract potential requirements from job description when AI fails
const extractRequirementsFromDescription = (description) => {
    if (!description || typeof description !== 'string') {
        return ["Required experience"];
    }

    const lowercaseDesc = description.toLowerCase();
    const potentialSkills = [];
    
    // Common skill identifiers in job descriptions
    const indicators = [
        'experience with', 'experience in', 'proficient in', 'skilled in',
        'knowledge of', 'familiar with', 'expertise in', 'background in',
        'understanding of', 'ability to', 'skills:'
    ];
    
    // Known programming languages and technologies
    const knownTech = [
        'javascript', 'react', 'vue', 'angular', 'node', 'express',
        'python', 'django', 'flask', 'java', 'spring', 'c#', '.net',
        'php', 'laravel', 'ruby', 'rails', 'go', 'rust', 'swift',
        'kotlin', 'flutter', 'react native', 'mongodb', 'mysql',
        'postgresql', 'oracle', 'sql server', 'nosql', 'graphql',
        'rest api', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
        'devops', 'ci/cd', 'git', 'agile', 'scrum', 'machine learning',
        'ai', 'data science', 'html', 'css', 'sass', 'less', 'bootstrap',
        'tailwind', 'typescript', 'webpack', 'babel', 'figma', 'sketch',
        'adobe xd', 'ui/ux', 'responsive design', 'seo'
    ];
    
    // Extract skills based on indicators
    indicators.forEach(indicator => {
        const index = lowercaseDesc.indexOf(indicator);
        if (index !== -1) {
            // Extract text after the indicator, up to the next punctuation/sentence end
            const afterIndicator = description.substring(index + indicator.length, index + indicator.length + 50);
            const match = afterIndicator.match(/^[:\s]*([^.,;!?]+)/);
            if (match && match[1]?.trim()) {
                potentialSkills.push(match[1].trim());
            }
        }
    });
    
    // Also look for known technologies directly
    knownTech.forEach(tech => {
        if (lowercaseDesc.includes(tech)) {
            // Capitalize first letter 
            potentialSkills.push(tech.charAt(0).toUpperCase() + tech.slice(1));
        }
    });
    
    // Remove duplicates and limit to a reasonable number
    const uniqueSkills = [...new Set(potentialSkills)].slice(0, 5);
    
    return uniqueSkills.length > 0 ? uniqueSkills : ["Required experience"];
};

// Update the fallback questions generation
const generateFallbackQuestions = (jobData) => {
    const questions = [];
    const title = jobData.title.toLowerCase();
    const description = jobData.description.toLowerCase();
    const requirements = Array.isArray(jobData.requirements) 
        ? jobData.requirements.map(r => typeof r === 'object' ? r.skill : r).join(' ')
        : jobData.requirements || '';

    // Extract key technical terms
    const techTerms = new Set();
    const techKeywords = requirements.toLowerCase().match(/\b\w+\b/g) || [];
    techKeywords.forEach(term => {
        if (term.length > 2) techTerms.add(term);
    });

    // Add role-specific technical questions
    if (title.includes('engineer') || title.includes('developer')) {
        questions.push(
            `Describe your experience with ${Array.from(techTerms).slice(0, 3).join(', ')}`,
            "What was the most challenging technical problem you've solved, and how did you solve it?",
            "How do you ensure code quality and maintainability in your projects?",
            "Describe your experience with version control and CI/CD practices"
        );
    } else if (title.includes('design')) {
        questions.push(
            "Walk us through your design process from concept to implementation",
            "How do you incorporate user feedback into your design decisions?",
            "Describe a project where you had to balance user needs with technical constraints",
            "How do you stay updated with the latest design trends and tools?"
        );
    } else if (title.includes('manager') || title.includes('lead')) {
        questions.push(
            "How do you approach team building and conflict resolution?",
            "Describe your experience with project planning and risk management",
            "How do you prioritize tasks and allocate resources in a project?",
            "What methodologies do you use for project management?"
        );
    }

    // Add experience-based questions
    if (jobData.experienceLevel > 0) {
        questions.push(
            `What achievements are you most proud of in your ${jobData.experienceLevel}+ years of experience?`,
            "How has your approach to problem-solving evolved with experience?"
        );
    }

    // Add behavioral questions relevant to the role
    questions.push(
        "How do you handle tight deadlines and competing priorities?",
        "Describe a situation where you had to learn a new technology or skill quickly"
    );

    return questions;
};

// Helper to format screening questions to match the schema
const formatQuestions = (questions) => {
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

export const enhanceJobPosting = async (jobData) => {
    try {
        // Check if jobData and its properties are defined
        if (!jobData || !jobData.title || !jobData.description) {
            throw new Error("Job data is missing required fields");
        }
        
        // Format requirements properly, ensuring it's an array
        let requirementsText = "None provided";
        if (jobData.requirements) {
            if (Array.isArray(jobData.requirements)) {
                if (jobData.requirements.length > 0) {
                    // If requirements is an array of objects with a 'skill' property
                    if (typeof jobData.requirements[0] === 'object' && jobData.requirements[0].skill) {
                        requirementsText = jobData.requirements.map(req => req.skill).join(', ');
                    } else {
                        // If requirements is an array of strings
                        requirementsText = jobData.requirements.join(', ');
                    }
                }
            } else if (typeof jobData.requirements === 'string') {
                requirementsText = jobData.requirements;
            }
        }

        // Format screening questions if they exist
        if (jobData.screening_questions) {
            jobData.screening_questions = formatQuestions(jobData.screening_questions);
        }

        const prompt = PROMPT_TEMPLATE
            .replace("{title}", jobData.title)
            .replace("{description}", jobData.description)
            .replace("{requirements}", requirementsText)
            .replace("{experienceLevel}", jobData.experience || 'Not specified');

        const response = await generateText(prompt);
        
        // If response indicates AI service is unavailable, use our fallback extraction
        if (response === "AI service temporarily unavailable. Using default job enhancement.") {
            console.log("Using fallback requirement extraction from job description");
            const extractedRequirements = extractRequirementsFromDescription(jobData.description);
            
            // Create sensible fallback requirements
            const structuredRequirements = extractedRequirements.map(req => ({
                skill: req,
                category: 'technical',
                level: 'intermediate',
                importance: 'must_have',
                weight: 1
            }));

            // Generate role-specific screening questions
            const roleSpecificQuestions = generateFallbackQuestions(jobData);
            
            return {
                // Preserve the original job data 
                title: jobData.title,
                description: jobData.description,
                requirements: jobData.requirements, // Return the original requirements array
                type: jobData.type,
                location: jobData.location,
                salary: jobData.salary,
                experience: jobData.experience,
                screening_questions: jobData.screening_questions, // Use the original screening questions if any
                // Add enhancement fields
                suggestedRequirements: extractedRequirements.map(req => ({
                    skill: req,
                    importance: 1
                })),
                improvements: [
                    "Consider adding more specific technical requirements",
                    "Clarify the day-to-day responsibilities of the role",
                    "Mention your company culture and values",
                    "Highlight growth opportunities for this position"
                ],
                additionalSkills: [],
                experienceSuggestion: jobData.experience || '',
                screeningQuestions: roleSpecificQuestions.map(q => ({
                    question: q,
                    type: 'text',
                    options: [],
                    required: false,
                    weight: 1
                })),
                structuredRequirements: structuredRequirements.map(req => ({
                    ...req,
                    importance: 1 // Ensure numeric importance
                }))
            };
        }
        
        // If response is not valid, return a basic structure with original job data
        if (!response || typeof response !== 'string') {
            console.warn("No valid response received from text generation");
            return {
                // Return original job data
                ...jobData,
                // Add empty AI fields
                suggestedRequirements: [],
                improvements: [],
                additionalSkills: [],
                experienceSuggestion: '',
                screeningQuestions: [],
                structuredRequirements: []
            };
        }

        const enhancedPosting = {
            // Preserve original job data
            ...jobData,
            // Initialize AI enhancements
            suggestedRequirements: [],
            improvements: [],
            additionalSkills: [],
            experienceSuggestion: '',
            screeningQuestions: []
        };

        // Parse the response
        response.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            if (trimmedLine.startsWith('REQ:')) {
                const requirement = trimmedLine.replace('REQ:', '').trim();
                enhancedPosting.suggestedRequirements.push({
                    skill: requirement,
                    importance: requirement.toLowerCase().includes('(must)') ? 'must_have' : 'preferred'
                });
            } else if (trimmedLine.startsWith('IMP:')) {
                enhancedPosting.improvements.push(trimmedLine.replace('IMP:', '').trim());
            } else if (trimmedLine.startsWith('SKILL:')) {
                enhancedPosting.additionalSkills.push(trimmedLine.replace('SKILL:', '').trim());
            } else if (trimmedLine.startsWith('EXP:')) {
                enhancedPosting.experienceSuggestion = trimmedLine.replace('EXP:', '').trim();
            } else if (trimmedLine.startsWith('Q:')) {
                const question = trimmedLine.replace('Q:', '').trim();
                enhancedPosting.screeningQuestions.push({
                    question: question,
                    type: 'text',
                    options: [],
                    required: false,
                    weight: 1
                });
            }
        });

        // If no requirements were suggested, create at least one default requirement
        if (enhancedPosting.suggestedRequirements.length === 0) {
            enhancedPosting.suggestedRequirements.push({
                skill: "Related experience",
                importance: "preferred"
            });
        }

        // Format AI-suggested screening questions if they exist
        if (Array.isArray(enhancedPosting.screeningQuestions) && enhancedPosting.screeningQuestions.length > 0) {
            enhancedPosting.screeningQuestions = formatQuestions(enhancedPosting.screeningQuestions);
        }

        try {
            // Convert suggested requirements to structured format
            const structuredRequirements = await extractStructuredRequirements(
                enhancedPosting.suggestedRequirements.map(req => req.skill)
            );

            // Merge AI suggestions with structured requirements
            const finalRequirements = structuredRequirements.map((req, index) => ({
                ...req,
                importance: enhancedPosting.suggestedRequirements[index]?.importance || 'preferred'
            }));

            return {
                // Preserve all original job data
                title: jobData.title,
                description: jobData.description,
                requirements: jobData.requirements,
                type: jobData.type,
                location: jobData.location,
                salary: jobData.salary,
                experience: jobData.experience,
                screening_questions: jobData.screening_questions,
                // Add AI enhancement fields
                ...enhancedPosting,
                structuredRequirements: finalRequirements
            };
        } catch (structureError) {
            console.error("Error structuring requirements:", structureError);
            // Provide fallback structured requirements if there's an error
            const fallbackRequirements = enhancedPosting.suggestedRequirements.map(req => ({
                skill: req.skill,
                category: 'technical',
                level: 'intermediate',
                importance: req.importance === 'must_have' ? 1 : 0.5,
                weight: 1
            }));

            return {
                // Preserve all original job data
                title: jobData.title,
                description: jobData.description,
                requirements: jobData.requirements,
                type: jobData.type,
                location: jobData.location,
                salary: jobData.salary,
                experience: jobData.experience,
                screening_questions: jobData.screening_questions,
                // Add AI enhancement fields
                ...enhancedPosting,
                structuredRequirements: fallbackRequirements
            };
        }
    } catch (error) {
        console.error("Error enhancing job posting:", error);
        // In case of any error, return the original job data unmodified
        return { ...jobData };
    }
}; 