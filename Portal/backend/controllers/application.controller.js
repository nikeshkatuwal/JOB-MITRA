import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { calculateCombinedSimilarity } from "../utils/similarityCalculator.js";
import { extractSkills, extractJobTitle, extractLocation } from "../utils/featureExtractor.js";
import { User } from "../models/user.model.js";

export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;
        const { screeningResponses } = req.body;

        if (!jobId) {
            return res.status(400).json({
                message: "Job id is required.",
                success: false
            });
        }

        // check if the user has already applied for the job
        const existingApplication = await Application.findOne({ job: jobId, applicant: userId });

        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied for this job",
                success: false
            });
        }

        // check if the jobs exists and get job details
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }

        // Get user profile for similarity calculation
        const user = await User.findById(userId).select('profile');
        if (!user?.profile) {
            return res.status(400).json({
                message: "User profile not found",
                success: false
            });
        }

        // Calculate similarity score
        const allUserSkills = [...new Set([
            ...(user.profile.skills || []),
            ...(user.profile.parsedResume?.skills || [])
        ])];

        const userProfile = {
            skills: allUserSkills,
            jobTitle: user.profile.bio || user.profile.parsedResume?.jobTitle || "",
            location: user.profile.location || user.profile.parsedResume?.location || "",
            experienceYears: user.profile.experience || 0,
            parsedResume: user.profile.parsedResume || {}
        };

        const jobData = {
            title: job.title,
            skills: job.requirements || [],
            location: job.location,
            postedDate: job.createdAt,
            experienceLevel: typeof job.experienceLevel === 'number' ? job.experienceLevel : 
                                (job.experience ? parseInt(job.experience.match(/\d+/)?.[0]) || 0 : 
                                job.title.toLowerCase().includes('senior') ? 5 : 
                                job.title.toLowerCase().includes('junior') ? 1 : 0)
        };

        // Log the inputs for debugging
        console.log('Calculating similarity for job application:', {
            userProfile,
            jobData
        });

        const similarity = await calculateCombinedSimilarity(userProfile, jobData);

        // Log the result
        console.log('Calculated similarity for job application:', similarity);

        // Process screening questions if provided
        let formattedScreeningResponses = [];
        let screeningScore = 0;

        if (screeningResponses && Array.isArray(screeningResponses) && screeningResponses.length > 0) {
            console.log('Processing screening responses:', screeningResponses);
            
            // Find the job's screening questions to match with responses
            const jobQuestions = job.screening_questions || [];
            
            // Process each response and calculate a score
            formattedScreeningResponses = screeningResponses.map(response => {
                // Find the matching question from the job
                const matchingQuestion = jobQuestions.find(q => 
                    q._id.toString() === response.questionId || 
                    q.question === response.question
                );
                
                // Calculate a score for this question (0-100)
                let score = 0;
                if (matchingQuestion) {
                    // Get the question weight (default to 1 if not specified)
                    const weight = matchingQuestion.weight || 1;
                    
                    // For text questions, use improved text analysis
                    if (matchingQuestion.type === 'text') {
                        if (response.answer) {
                            // Define keywords based on the question context
                            let keywords = [];
                            const questionLower = matchingQuestion.question.toLowerCase();
                            
                            // Extract potential keywords from the question
                            if (questionLower.includes('experience') || questionLower.includes('worked with')) {
                                // For experience questions, look for technical terms, platforms, languages
                                keywords = ['years', 'experience', 'worked', 'developed', 'built', 'created', 'managed',
                                           'aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes', 'react', 'angular', 'vue',
                                           'node', 'python', 'java', 'javascript', 'typescript', 'c#', 'go', 'rust',
                                           'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'oracle', 'database',
                                           'frontend', 'backend', 'fullstack', 'devops', 'ci/cd', 'agile', 'scrum'];
                            } else if (questionLower.includes('education') || questionLower.includes('degree')) {
                                // For education questions
                                keywords = ['degree', 'bachelor', 'master', 'phd', 'diploma', 'certificate',
                                           'computer science', 'engineering', 'information technology', 'bootcamp'];
                            } else if (questionLower.includes('project') || questionLower.includes('achievement')) {
                                // For project/achievement questions
                                keywords = ['project', 'developed', 'created', 'built', 'designed', 'implemented',
                                           'team', 'led', 'managed', 'achievement', 'award', 'recognition'];
                            }
                            
                            // Calculate score based on keyword presence and answer length
                            const answerLower = response.answer.toLowerCase();
                            const answerWords = answerLower.split(/\s+/);
                            
                            // Count matching keywords
                            const matchingKeywords = keywords.filter(keyword => 
                                answerLower.includes(keyword)
                            );
                            
                            // Base score on keyword matches (up to 60 points)
                            let keywordScore = 0;
                            if (keywords.length > 0) {
                                // Calculate percentage of matched keywords (max 5 keywords expected)
                                const matchPercentage = matchingKeywords.length / Math.min(5, keywords.length);
                                keywordScore = Math.round(matchPercentage * 60);
                            } else {
                                // If no specific keywords defined, base score on answer length only
                                keywordScore = Math.min(30, answerWords.length > 5 ? 30 : 0);
                            }
                                
                            // Add points for answer length/completeness (up to 40 points)
                            // Short answers (1-2 words) get minimal points
                            // Longer, more detailed answers get more points
                            let lengthScore = 0;
                            if (answerWords.length <= 2) {
                                lengthScore = 10; // Minimal score for very short answers
                            } else if (answerWords.length <= 5) {
                                lengthScore = 20; // Basic score for short answers
                            } else if (answerWords.length <= 15) {
                                lengthScore = 30; // Better score for medium answers
                            } else {
                                lengthScore = 40; // Full score for detailed answers
                            }
                            
                            // Combine scores
                            score = Math.min(100, keywordScore + lengthScore);
                            
                            console.log(`Scoring answer: "${response.answer}" - Keywords: ${keywordScore}, Length: ${lengthScore}, Total: ${score}`);
                        } else {
                            // No answer provided
                            score = 0;
                        }
                    } 
                    // For multiple choice questions
                    else if (matchingQuestion.type === 'multiple_choice') {
                        // Check if the answer is one of the provided options
                        if (response.answer && matchingQuestion.options && 
                            matchingQuestion.options.includes(response.answer)) {
                            // If there's a preferred option (first option is often the best answer)
                            // we can score based on which option was selected
                            const optionIndex = matchingQuestion.options.indexOf(response.answer);
                            // First option gets 100, second gets 80, third gets 60, etc.
                            score = Math.max(20, 100 - (optionIndex * 20));
                        } else {
                            score = 0; // Invalid or no answer
                        }
                    }
                    // For boolean questions
                    else if (matchingQuestion.type === 'boolean') {
                        // For boolean, we can check if the answer matches the expected value
                        // If no expected value is set, we default to 'true' being the preferred answer
                        const expectedBooleanAnswer = matchingQuestion.options && 
                                                    matchingQuestion.options[0] === 'false' ? 'false' : 'true';
                        score = response.answer === expectedBooleanAnswer ? 100 : 0;
                    }
                    // Apply question weight to the score
                    score = score * weight;
                }
                
                // Make sure to include both the question ID and the question text
                return {
                    question: matchingQuestion ? matchingQuestion._id : response.questionId,
                    questionText: response.question || (matchingQuestion ? matchingQuestion.question : 'Unknown Question'),
                    answer: response.answer,
                    score: Math.round(score)
                };
            });
            
            // Calculate overall screening score (weighted average of all question scores)
            if (formattedScreeningResponses.length > 0) {
                // Get total weights from the original questions
                const totalWeight = jobQuestions.reduce((sum, q) => sum + (q.weight || 1), 0);
                
                // Calculate weighted score
                let weightedScore = 0;
                let appliedWeightSum = 0;
                
                formattedScreeningResponses.forEach(resp => {
                    // Find the matching question to get its weight
                    const matchingQuestion = jobQuestions.find(q => 
                        q._id.toString() === resp.question.toString() || 
                        q.question === resp.questionText
                    );
                    
                    if (matchingQuestion) {
                        const weight = matchingQuestion.weight || 1;
                        weightedScore += (resp.score * weight);
                        appliedWeightSum += weight;
                    } else {
                        // If no matching question found, use default weight of 1
                        weightedScore += resp.score;
                        appliedWeightSum += 1;
                    }
                });
                
                // Normalize the score based on applied weights
                screeningScore = appliedWeightSum > 0 ? 
                    Math.round(weightedScore / appliedWeightSum) : 0;
                
                console.log('Calculated weighted screening score:', screeningScore);
            }
            
            console.log('Calculated screening score:', screeningScore);
        }

        // create a new application with the calculated similarity score and screening data
        const newApplication = await Application.create({
            job: jobId,
            applicant: userId,
            similarity: similarity,
            screeningResponses: formattedScreeningResponses,
            screeningScore: screeningScore
        });

        job.applications.push(newApplication._id);
        await job.save();

        return res.status(201).json({
            message: "Job applied successfully.",
            success: true
        });
    } catch (error) {
        console.error("Error in applyJob:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const getAppliedJobs = async (req, res) => {
    try {
        const userId = req.id;
        const application = await Application.find({ applicant: userId })
            .sort({ createdAt: -1 })
            .populate({
                path: 'job',
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: 'company',
                    options: { sort: { createdAt: -1 } },
                }
            });
        if (!application) {
            return res.status(404).json({
                message: "No Applications",
                success: false
            })
        };
        return res.status(200).json({
            application,
            success: true
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

// admin le dekhxa kati user le apply gareko xa
export const getApplicants = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path: 'applications',
            options: { sort: { createdAt: -1 } },
            select: 'applicant similarity status createdAt screeningResponses screeningScore',
            populate: {
                path: 'applicant',
                select: 'fullname email phoneNumber profile.resume profile.skills profile.bio profile.location profile.experience profile.parsedResume'
            }
        });

        if (!job) {
            return res.status(404).json({
                message: 'Job not found.',
                success: false
            });
        }

        // Transform requirements to include both structured and simplified formats
        const transformedJob = {
            ...job.toObject(),
            requirements: job.requirements.map(req => req.skill || req), // Simplified requirements for frontend
            structuredRequirements: job.requirements // Keep structured data for detailed views
        };

        // Sort applications by combined score (similarity and screening)
        const sortedApplications = transformedJob.applications.sort((a, b) => {
            // Get both scores, default to 0 if not present
            const aSimilarity = a.similarity || 0;
            const bSimilarity = b.similarity || 0;
            
            // Normalize screening scores to 0-1 scale
            const aScreening = a.screeningScore ? a.screeningScore / 100 : 0;
            const bScreening = b.screeningScore ? b.screeningScore / 100 : 0;
            
            // Calculate combined score (60% similarity, 40% screening)
            // If there are no screening questions, use 100% similarity score
            const hasScreeningQuestions = job.screening_questions && job.screening_questions.length > 0;
            
            let aCombined, bCombined;
            if (hasScreeningQuestions) {
                aCombined = (aSimilarity * 0.6) + (aScreening * 0.4);
                bCombined = (bSimilarity * 0.6) + (bScreening * 0.4);
            } else {
                aCombined = aSimilarity;
                bCombined = bSimilarity;
            }
            
            // Sort by combined score (highest first)
            return bCombined - aCombined;
        });

        // Return the job with sorted applications
        const jobWithScores = {
            ...transformedJob,
            applications: sortedApplications
        };

        return res.status(200).json({
            job: jobWithScores,
            success: true
        });
    } catch (error) {
        console.error("Error in getApplicants:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const applicationId = req.params.id;
        if (!status) {
            return res.status(400).json({
                message: 'status is required',
                success: false
            })
        };

        // find the application by applicantion id
        const application = await Application.findOne({ _id: applicationId });
        if (!application) {
            return res.status(404).json({
                message: "Application not found.",
                success: false
            })
        };

        // update the status
        application.status = status.toLowerCase();
        await application.save();

        return res.status(200).json({
            message: "Status updated successfully.",
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

// Add new function to recalculate similarity scores
// Add a new endpoint to check if a user has applied for a job
export const checkApplicationStatus = async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const userId = req.params.userId;
        
        if (!jobId || !userId) {
            return res.status(400).json({
                message: "Job ID and User ID are required.",
                success: false
            });
        }
        
        // Check if the user has already applied for the job
        const existingApplication = await Application.findOne({ job: jobId, applicant: userId });
        
        return res.status(200).json({
            hasApplied: !!existingApplication,
            success: true
        });
    } catch (error) {
        console.error("Error checking application status:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const recalculateMatchScores = async (req, res) => {
    try {
        const jobId = req.params.id;
        
        // Find the job and populate applications with applicant data
        const job = await Job.findById(jobId).populate({
            path: 'applications',
            populate: {
                path: 'applicant',
                select: 'profile'
            }
        });

        if (!job) {
            return res.status(404).json({
                message: 'Job not found.',
                success: false
            });
        }

        // Create job data for similarity calculation
        const jobData = {
            title: job.title,
            skills: job.requirements || [],
            location: job.location,
            postedDate: job.createdAt,
            experienceLevel: typeof job.experienceLevel === 'number' ? job.experienceLevel : 
                                (job.experience ? parseInt(job.experience.match(/\d+/)?.[0]) || 0 : 
                                job.title.toLowerCase().includes('senior') ? 5 : 
                                job.title.toLowerCase().includes('junior') ? 1 : 0)
        };

        // Get job screening questions for score recalculation
        const jobQuestions = job.screening_questions || [];

        // Update each application's similarity score and screening score
        const updatedApplications = await Promise.all(job.applications.map(async (application) => {
            const applicant = application.applicant;
            if (!applicant?.profile) return application;

            // Combine manual and parsed resume skills
            const allUserSkills = [...new Set([
                ...(applicant.profile.skills || []),
                ...(applicant.profile.parsedResume?.skills || [])
            ])];

            // Create user profile for similarity calculation
            const userProfile = {
                skills: allUserSkills,
                jobTitle: applicant.profile.bio || applicant.profile.parsedResume?.jobTitle || "",
                location: applicant.profile.location || applicant.profile.parsedResume?.location || "",
                experienceYears: applicant.profile.experience || 0,
                parsedResume: applicant.profile.parsedResume || {}
            };

            // Log the inputs for debugging
            console.log('Recalculating similarity for application:', {
                userProfile,
                jobData
            });

            // Calculate new similarity score
            const similarity = await calculateCombinedSimilarity(userProfile, jobData);
            
            // Log the result
            console.log('Recalculated similarity:', similarity);

            // Recalculate screening score if there are screening responses
            let screeningScore = application.screeningScore || 0;
            let updatedScreeningResponses = application.screeningResponses || [];
            
            if (jobQuestions.length > 0 && application.screeningResponses && application.screeningResponses.length > 0) {
                // Recalculate score for each screening response
                updatedScreeningResponses = application.screeningResponses.map(response => {
                    // Find the matching question from the job
                    const matchingQuestion = jobQuestions.find(q => 
                        q._id.toString() === response.question.toString() || 
                        q.question === response.questionText
                    );
                    
                    // Calculate a score for this question (0-100)
                    let score = 0;
                    if (matchingQuestion) {
                        // Get the question weight (default to 1 if not specified)
                        const weight = matchingQuestion.weight || 1;
                        
                        // For text questions, use improved text analysis
                        if (matchingQuestion.type === 'text') {
                            if (response.answer) {
                                // Define keywords based on the question context
                                let keywords = [];
                                const questionLower = matchingQuestion.question.toLowerCase();
                                
                                // Extract potential keywords from the question
                                if (questionLower.includes('experience') || questionLower.includes('worked with')) {
                                    // For experience questions, look for technical terms, platforms, languages
                                    keywords = ['years', 'experience', 'worked', 'developed', 'built', 'created', 'managed',
                                               'aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes', 'react', 'angular', 'vue',
                                               'node', 'python', 'java', 'javascript', 'typescript', 'c#', 'go', 'rust',
                                               'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'oracle', 'database',
                                               'frontend', 'backend', 'fullstack', 'devops', 'ci/cd', 'agile', 'scrum'];
                                } else if (questionLower.includes('education') || questionLower.includes('degree')) {
                                    // For education questions
                                    keywords = ['degree', 'bachelor', 'master', 'phd', 'diploma', 'certificate',
                                               'computer science', 'engineering', 'information technology', 'bootcamp'];
                                } else if (questionLower.includes('project') || questionLower.includes('achievement')) {
                                    // For project/achievement questions
                                    keywords = ['project', 'developed', 'created', 'built', 'designed', 'implemented',
                                               'team', 'led', 'managed', 'achievement', 'award', 'recognition'];
                                }
                                
                                // Calculate score based on keyword presence and answer length
                                const answerLower = response.answer.toLowerCase();
                                const answerWords = answerLower.split(/\s+/);
                                
                                // Count matching keywords
                                const matchingKeywords = keywords.filter(keyword => 
                                    answerLower.includes(keyword)
                                );
                                
                                // Base score on keyword matches (up to 60 points)
                                let keywordScore = 0;
                                if (keywords.length > 0) {
                                    // Calculate percentage of matched keywords (max 5 keywords expected)
                                    const matchPercentage = matchingKeywords.length / Math.min(5, keywords.length);
                                    keywordScore = Math.round(matchPercentage * 60);
                                } else {
                                    // If no specific keywords defined, base score on answer length only
                                    keywordScore = Math.min(30, answerWords.length > 5 ? 30 : 0);
                                }
                                    
                                // Add points for answer length/completeness (up to 40 points)
                                // Short answers (1-2 words) get minimal points
                                // Longer, more detailed answers get more points
                                let lengthScore = 0;
                                if (answerWords.length <= 2) {
                                    lengthScore = 10; // Minimal score for very short answers
                                } else if (answerWords.length <= 5) {
                                    lengthScore = 20; // Basic score for short answers
                                } else if (answerWords.length <= 15) {
                                    lengthScore = 30; // Better score for medium answers
                                } else {
                                    lengthScore = 40; // Full score for detailed answers
                                }
                                
                                // Combine scores
                                score = Math.min(100, keywordScore + lengthScore);
                            } else {
                                // No answer provided
                                score = 0;
                            }
                        } 
                        // For multiple choice questions
                        else if (matchingQuestion.type === 'multiple_choice') {
                            // Check if the answer is one of the provided options
                            if (response.answer && matchingQuestion.options && 
                                matchingQuestion.options.includes(response.answer)) {
                                // If there's a preferred option (first option is often the best answer)
                                // we can score based on which option was selected
                                const optionIndex = matchingQuestion.options.indexOf(response.answer);
                                // First option gets 100, second gets 80, third gets 60, etc.
                                score = Math.max(20, 100 - (optionIndex * 20));
                            } else {
                                score = 0; // Invalid or no answer
                            }
                        }
                        // For boolean questions
                        else if (matchingQuestion.type === 'boolean') {
                            // For boolean, we can check if the answer matches the expected value
                            // If no expected value is set, we default to 'true' being the preferred answer
                            const expectedBooleanAnswer = matchingQuestion.options && 
                                                        matchingQuestion.options[0] === 'false' ? 'false' : 'true';
                            score = response.answer === expectedBooleanAnswer ? 100 : 0;
                        }
                    }
                    
                    return {
                        ...response,
                        score: Math.round(score)
                    };
                });
                
                // Calculate overall screening score (weighted average of all question scores)
                if (updatedScreeningResponses.length > 0) {
                    // Calculate weighted score
                    let weightedScore = 0;
                    let appliedWeightSum = 0;
                    
                    updatedScreeningResponses.forEach(resp => {
                        // Find the matching question to get its weight
                        const matchingQuestion = jobQuestions.find(q => 
                            (q._id && resp.question && q._id.toString() === resp.question.toString()) || 
                            (q.question && resp.questionText && q.question === resp.questionText)
                        );
                        
                        if (matchingQuestion) {
                            const weight = matchingQuestion.weight || 1;
                            weightedScore += (resp.score * weight);
                            appliedWeightSum += weight;
                        } else {
                            // If no matching question found, use default weight of 1
                            weightedScore += resp.score;
                            appliedWeightSum += 1;
                        }
                    });
                    
                    // Normalize the score based on applied weights
                    screeningScore = appliedWeightSum > 0 ? 
                        Math.round(weightedScore / appliedWeightSum) : 0;
                    
                    console.log('Recalculated screening score:', screeningScore);
                }
            }

            // Update application with new scores
            await Application.findByIdAndUpdate(application._id, { 
                similarity,
                screeningScore,
                screeningResponses: updatedScreeningResponses
            });
            
            return { 
                ...application.toObject(), 
                similarity,
                screeningScore,
                screeningResponses: updatedScreeningResponses
            };
        }));

        return res.status(200).json({
            message: "Match scores and screening scores recalculated successfully.",
            applications: updatedApplications,
            success: true
        });
    } catch (error) {
        console.error("Error recalculating match scores:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};