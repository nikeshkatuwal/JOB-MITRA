import React, { useState } from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { MoreHorizontal, FileText, Phone, Percent, CheckCircle2, XCircle, AlertCircle, MessageSquare, HelpCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { APPLICATION_API_END_POINT, BASE_API_URL } from '@/utils/constant';
import axios from 'axios';
import { Button } from '../ui/button';
import { useParams } from 'react-router-dom';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../ui/dialog';

const shortlistingStatus = ["Accepted", "Rejected"];

const ApplicantsTable = () => {
    const { applicants } = useSelector(store => store.application);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [screeningDialogOpen, setScreeningDialogOpen] = useState(false);
    const params = useParams();

    const recalculateMatchScores = async () => {
        setIsRecalculating(true);
        try {
            const res = await axios.post(
                `${APPLICATION_API_END_POINT}/${params.id}/recalculate`,
                {},
                { withCredentials: true }
            );
            if (res.data.success) {
                toast.success("Match scores recalculated successfully");
                // Refresh the page to show updated scores
                window.location.reload();
            }
        } catch (error) {
            console.error("Error recalculating match scores:", error);
            toast.error("Failed to recalculate match scores");
        } finally {
            setIsRecalculating(false);
        }
    };

    const statusHandler = async (status, id) => {
        console.log('called');
        try {
            axios.defaults.withCredentials = true;
            const res = await axios.put(`${APPLICATION_API_END_POINT}/update/${id}`, { status });
            console.log(res);
            if (res.data.success) {
                toast.success(res.data.message);
                // Refresh the page to show updated status
                window.location.reload();
            }
        } catch (error) {
            toast.error(error.response.data.message);
        }
    }

    // Helper function to format date safely
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return dateString.split("T")[0];
    }

    // Helper function to format match score as percentage
    const formatMatchScore = (score) => {
        if (!score && score !== 0) return "N/A";
        // Convert decimal to percentage
        const percentage = score * 100;
        return `${Math.round(percentage)}%`;
    }

    // Helper function to get resume URL
    const getResumeUrl = (resumeData) => {
        // Log the exact structure for debugging
        console.log("Resume data:", JSON.stringify(resumeData, null, 2));
        
        // If resumeData is a string
        if (typeof resumeData === 'string') {
            // If it looks like a filename (not a full URL)
            if (!resumeData.startsWith('http')) {
                // Extract just the filename if it contains a path
                const filename = resumeData.includes('/') 
                    ? resumeData.split('/').pop()
                    : resumeData;
                
                // Construct absolute URL
                return `${BASE_API_URL}/uploads/resumes/${filename}`;
            }
            return resumeData; // Already a full URL
        }
        
        // If resumeData is an object
        if (resumeData && typeof resumeData === 'object') {
            // For cloudinary or external storage
            if (resumeData.secure_url) return resumeData.secure_url;
            if (resumeData.url) return resumeData.url;
            
            // Extract filename from object
            let filename = null;
            
            // Check various possible properties
            if (resumeData.filename) {
                filename = resumeData.filename;
            } else if (resumeData.originalname) {
                filename = resumeData.originalname;
            } else if (resumeData.name) {
                filename = resumeData.name;
            } else if (resumeData.path) {
                // Extract filename from path
                filename = resumeData.path.split('/').pop();
            }
            
            // If we found a filename, construct the absolute URL
            if (filename) {
                return `${BASE_API_URL}/uploads/resumes/${filename}`;
            }
        }
        
        // Return empty string if no valid URL found
        return '';
    }

    const getSkillMatchStatus = (applicantSkills, jobRequirements) => {
        if (!applicantSkills || !jobRequirements) return { matched: [], partial: [], missing: [] };
        
        // Combine skills from both profile and parsed resume
        const allApplicantSkills = [...new Set([
            ...(Array.isArray(applicantSkills) ? applicantSkills : []),
            ...(applicantSkills?.parsedResume?.skills || [])
        ])].map(skill => skill.toLowerCase());
        
        const matched = [];
        const partial = [];
        const missing = [];
        
        jobRequirements.forEach(requirement => {
            // Handle both structured and simple requirements
            const requirementSkill = (typeof requirement === 'object' && requirement !== null)
                ? requirement.skill?.toLowerCase()
                : (typeof requirement === 'string' ? requirement.toLowerCase() : '');
                
            if (!requirementSkill) return; // Skip invalid requirements
            
            const exactMatch = allApplicantSkills.some(
                skill => skill === requirementSkill
            );
            
            const partialMatch = !exactMatch && allApplicantSkills.some(
                skill => skill.includes(requirementSkill) || requirementSkill.includes(skill)
            );
            
            if (exactMatch) {
                matched.push(requirement.skill || requirement);
            } else if (partialMatch) {
                partial.push(requirement.skill || requirement);
            } else {
                missing.push(requirement.skill || requirement);
            }
        });
        
        return { matched, partial, missing };
    };

    // Helper function to format screening score as percentage
    const formatScreeningScore = (score) => {
        if (score === undefined || score === null) return "N/A";
        return `${score}%`;
    };

    // Helper function to get the appropriate color for a screening score
    const getScreeningScoreColor = (score) => {
        if (score === undefined || score === null) return "text-gray-500";
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    const calculateScreeningScore = (responses, jobQuestions) => {
        if (!responses || !jobQuestions || responses.length === 0) return 0;
        
        let totalScore = 0;
        let totalWeight = 0;
        
        responses.forEach(response => {
            const originalQuestion = jobQuestions.find(q => 
                q._id === response.question || 
                (q.question && response.question && q.question === response.question)
            );
            
            if (originalQuestion) {
                const weight = originalQuestion.weight || 1;
                totalWeight += weight;
                
                // Calculate similarity score between answer and expected answer
                let answerScore = 0;
                if (originalQuestion.type === 'boolean' || originalQuestion.type === 'multiple_choice') {
                    // Exact match for boolean and multiple choice
                    answerScore = response.answer.toLowerCase() === originalQuestion.expectedAnswer.toLowerCase() ? 100 : 0;
                } else {
                    // For text answers, use basic string similarity
                    const similarity = calculateTextSimilarity(response.answer, originalQuestion.expectedAnswer);
                    answerScore = similarity * 100;
                }
                
                totalScore += (answerScore * weight);
            }
        });
        
        return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    };

    const calculateTextSimilarity = (str1, str2) => {
        if (!str1 || !str2) return 0;
        
        // Convert to lowercase and split into words
        const words1 = str1.toLowerCase().split(/\s+/);
        const words2 = str2.toLowerCase().split(/\s+/);
        
        // Count matching words
        const matches = words1.filter(word => words2.includes(word));
        
        // Calculate similarity score
        const similarity = (2.0 * matches.length) / (words1.length + words2.length);
        return similarity;
    };

    // Update the viewScreeningResponses function
    const viewScreeningResponses = (applicant) => {
        if (applicant && applicant.screeningResponses) {
            // Recalculate scores for each response
            const updatedResponses = applicant.screeningResponses.map(response => {
                const originalQuestion = applicants?.screeningQuestions?.find(q => 
                    q._id === response.question || 
                    (q.question && response.question && q.question === response.question)
                );
                
                if (originalQuestion) {
                    // Use the score from the response if available, otherwise calculate it
                    const score = response.score || calculateScreeningScore([response], [originalQuestion]);
                    return { ...response, score };
                }
                return response;
            });
            
            setSelectedApplicant({
                ...applicant,
                screeningResponses: updatedResponses,
                // Use the original screeningScore from the applicant object instead of recalculating
                screeningScore: applicant.screeningScore
            });
        } else {
            setSelectedApplicant(applicant);
        }
        setScreeningDialogOpen(true);
    };

    // Log the full structure for debugging
    if (applicants && applicants.applications && applicants.applications.length > 0) {
        console.log("First applicant sample:", JSON.stringify(applicants.applications[0], null, 2));
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Applicants List</h2>
                <Button
                    onClick={recalculateMatchScores}
                    disabled={isRecalculating}
                    className={`${isRecalculating ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'} text-white px-4 py-2 rounded-md flex items-center gap-2`}
                >
                    {isRecalculating ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Recalculating...</span>
                        </>
                    ) : (
                        <>
                            <Percent className="w-4 h-4" />
                            <span>Recalculate Scores</span>
                        </>
                    )}
                </Button>
            </div>
            <Table>
                <TableCaption>A list of your recent applied user</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>FullName</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Resume</TableHead>
                        <TableHead>Match Score</TableHead>
                        <TableHead>Screening Score</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        applicants && applicants?.applications?.map((item) => {
                            const resumeUrl = getResumeUrl(item?.applicant?.profile?.resume);
                            const normalizedSimilarity = parseFloat(item.similarity);
                            const hasScreeningResponses = item.screeningResponses && item.screeningResponses.length > 0;
                            
                            // Get all skills from both profile and parsed resume
                            const applicantSkills = [...new Set([
                                ...(item?.applicant?.profile?.skills || []),
                                ...(item?.applicant?.profile?.parsedResume?.skills || [])
                            ])];
                            
                            // Get job requirements from the parent job
                            const jobRequirements = applicants?.requirements || [];
                            
                            // Analyze skills match
                            const skillsAnalysis = getSkillMatchStatus(applicantSkills, jobRequirements);
                            
                            return (
                                <TableRow key={item._id}>
                                    <TableCell>{item?.applicant?.fullname || "Applicant"}</TableCell>
                                    <TableCell>{item?.applicant?.email || "N/A"}</TableCell>
                                    <TableCell>
                                        {item?.applicant?.phoneNumber || 
                                        (item?.applicant?.profile?.phoneNumber ? 
                                            item.applicant.profile.phoneNumber : "N/A")}
                                    </TableCell>
                                    <TableCell>
                                        {
                                            resumeUrl ? 
                                            <a 
                                                className="text-blue-600 cursor-pointer flex items-center gap-1" 
                                                href={resumeUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                            >
                                                <FileText className="h-4 w-4" />
                                                View Resume
                                            </a> : 
                                            <span className="text-gray-400">No Resume</span>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <Popover>
                                            <PopoverTrigger>
                                                <div className="flex items-center gap-1 cursor-pointer">
                                                    <Percent className="h-4 w-4" />
                                                    <span className={`font-medium ${
                                                        normalizedSimilarity >= 0.7 ? 'text-green-600' :
                                                        normalizedSimilarity >= 0.5 ? 'text-yellow-600' :
                                                        'text-red-600'
                                                    }`}>
                                                        {formatMatchScore(normalizedSimilarity)}
                                                    </span>
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent>
                                                <div className="space-y-4">
                                                    <div>
                                                        <h3 className="font-medium text-sm mb-1">Skills Match Analysis</h3>
                                                        <Progress 
                                                            value={normalizedSimilarity * 100} 
                                                            className="h-2 w-full"
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        {skillsAnalysis.matched.length > 0 && (
                                                            <div>
                                                                <h4 className="text-xs font-medium flex items-center text-green-600">
                                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                    Matched Skills ({skillsAnalysis.matched.length})
                                                                </h4>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {skillsAnalysis.matched.map((skill, i) => (
                                                                        <Badge key={i} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                                            {skill}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {skillsAnalysis.partial.length > 0 && (
                                                            <div>
                                                                <h4 className="text-xs font-medium flex items-center text-yellow-600">
                                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                                    Partial Matches ({skillsAnalysis.partial.length})
                                                                </h4>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {skillsAnalysis.partial.map((skill, i) => (
                                                                        <Badge key={i} variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                                                            {skill}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {skillsAnalysis.missing.length > 0 && (
                                                            <div>
                                                                <h4 className="text-xs font-medium flex items-center text-red-600">
                                                                    <XCircle className="h-3 w-3 mr-1" />
                                                                    Missing Skills ({skillsAnalysis.missing.length})
                                                                </h4>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {skillsAnalysis.missing.map((skill, i) => (
                                                                        <Badge key={i} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                                                            {skill}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>

                                    {/* Screening Score Column */}
                                    <TableCell>
                                        {hasScreeningResponses ? (
                                            <Button
                                                variant="ghost"
                                                className="flex items-center gap-1 cursor-pointer p-0 h-auto"
                                                onClick={() => viewScreeningResponses(item)}
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                                <Badge className={`px-2 py-0.5 ${item.screeningScore >= 80 ? 'bg-green-100 text-green-700' : 
                                                    item.screeningScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 
                                                    'bg-red-100 text-red-700'}`}>
                                                    {formatScreeningScore(item.screeningScore)}
                                                </Badge>
                                            </Button>
                                        ) : (
                                            <span className="text-gray-400 flex items-center gap-1">
                                                <HelpCircle className="h-4 w-4" />
                                                No responses
                                            </span>
                                        )}
                                    </TableCell>

                                    <TableCell>{formatDate(item?.createdAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <Popover>
                                            <PopoverTrigger>
                                                <MoreHorizontal className="cursor-pointer" />
                                            </PopoverTrigger>
                                            <PopoverContent className="p-0" side="left">
                                                <div className="flex flex-col">
                                                    {shortlistingStatus.map((status) => (
                                                        <Button 
                                                            key={status} 
                                                            className="justify-start rounded-none text-black"
                                                            variant="ghost" 
                                                            onClick={() => statusHandler(status, item._id)}>
                                                            {status}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    }
                </TableBody>
            </Table>

            {/* Screening Responses Dialog */}
            <Dialog open={screeningDialogOpen} onOpenChange={setScreeningDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Screening Responses</DialogTitle>
                        <DialogDescription>
                            Applicant's responses to your screening questions
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 my-4">
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                            <div>
                                <h3 className="font-medium">Overall Score</h3>
                                <p className="text-sm text-gray-500">Based on answer quality and question weights</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <Badge className={`text-lg px-3 py-1 ${
                                    selectedApplicant?.screeningScore >= 80 ? 'bg-green-100 text-green-700' : 
                                    selectedApplicant?.screeningScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {selectedApplicant?.screeningScore || 0}%
                                </Badge>
                                <span className="text-xs mt-1 text-gray-500">
                                    {selectedApplicant?.screeningScore >= 80 ? 'Excellent' : 
                                    selectedApplicant?.screeningScore >= 60 ? 'Good' : 
                                    'Needs Improvement'}
                                </span>
                            </div>
                        </div>

                        <div className="divide-y">
                            {selectedApplicant?.screeningResponses?.map((response, index) => {
                                const originalQuestion = applicants?.screeningQuestions?.find(q => 
                                    q._id === response.question
                                );
                                
                                return (
                                    <div key={index} className="py-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h3 className="font-medium">Question {index + 1}</h3>
                                                <p className="text-sm text-gray-500">
                                                    Weight: {originalQuestion?.weight || 1}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <Badge className={`${
                                                    response.score >= 80 ? 'bg-green-100 text-green-700' : 
                                                    response.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    Score: {response.score}%
                                                </Badge>
                                                <Progress 
                                                    value={response.score} 
                                                    className="h-1 w-16 mt-1"
                                                    indicatorClassName={`${
                                                        response.score >= 80 ? 'bg-green-600' : 
                                                        response.score >= 60 ? 'bg-yellow-600' : 
                                                        'bg-red-600'
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                        
                                        <p className="text-gray-700 mb-3">
                                            {response.questionText || originalQuestion?.question || 'Question not found'}
                                        </p>
                                        
                                        <div className="space-y-3">
                                            <div className="bg-gray-50 p-3 rounded-md">
                                                <p className="text-sm font-medium text-gray-500 mb-1">Applicant's Answer:</p>
                                                <p className="text-gray-900">{response.answer}</p>
                                            </div>
                                            
                                            {originalQuestion?.expectedAnswer && (
                                                <div className="bg-blue-50 p-3 rounded-md">
                                                    <p className="text-sm font-medium text-blue-500 mb-1">Expected Answer:</p>
                                                    <p className="text-gray-900">{originalQuestion.expectedAnswer}</p>
                                                    {originalQuestion.type === 'multiple_choice' && originalQuestion.options?.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="text-sm font-medium text-blue-500">Available Options:</p>
                                                            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                                                                {originalQuestion.options.map((option, i) => (
                                                                    <li key={i} className={option === originalQuestion.expectedAnswer ? 'font-medium' : ''}>
                                                                        {option}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ApplicantsTable