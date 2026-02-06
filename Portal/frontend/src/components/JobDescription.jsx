import React, { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { APPLICATION_API_END_POINT, JOB_API_END_POINT } from '@/utils/constant';
import { setSingleJob } from '@/redux/jobSlice';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { FileText, Building2, MapPin, Briefcase, Clock, Users, ChevronLeft, Percent, Trash2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const JobDescription = () => {
    const { singleJob } = useSelector(store => store.job);
    const { user } = useSelector(store => store.auth);
    const isInitiallyApplied = singleJob?.applications && singleJob?.applications?.some(application => 
        typeof application === 'object' ? application.applicant === user?._id : application === user?._id
    ) || false;
    const [isApplied, setIsApplied] = useState(isInitiallyApplied);
    const [applicants, setApplicants] = useState([]);
    const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [screeningDialogOpen, setScreeningDialogOpen] = useState(false);
    const [screeningResponses, setScreeningResponses] = useState([]);
    const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);

    const params = useParams();
    const jobId = params.id;
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const isRecruiter = user?.role === 'recruiter' || user?.role === 'admin';
    const isJobCreator = singleJob?.posted_by?._id === user?._id || singleJob?.created_by === user?._id;

    useEffect(() => {
        // Check for both possible field names (screeningQuestions or screening_questions)
        const questions = singleJob?.screeningQuestions || singleJob?.screening_questions;
        
        if (questions && questions.length > 0) {
            setScreeningResponses(
                questions.map(q => ({
                    questionId: q._id,
                    question: q.question,
                    answer: '',
                    type: q.type || 'text',
                    options: q.options || []
                }))
            );
        }
    }, [singleJob]);

    const startApplicationProcess = () => {
        if (!user) {
            toast.error("Please login to apply for jobs");
            navigate('/login');
            return;
        }

        if (!user.profile?.resume?.url && !user.profile?.resume?.path) {
            toast.error("Please upload your resume before applying");
            navigate('/profile');
            return;
        }

        // Check for both possible field names for screening questions
        const hasScreeningQuestions = (singleJob?.screeningQuestions && singleJob.screeningQuestions.length > 0) || 
                                    (singleJob?.screening_questions && singleJob.screening_questions.length > 0);

        if (hasScreeningQuestions) {
            setScreeningDialogOpen(true);
        } else {
            submitApplication();
        }
    };

    const handleScreeningAnswerChange = (index, value) => {
        const updatedResponses = [...screeningResponses];
        updatedResponses[index].answer = value;
        setScreeningResponses(updatedResponses);
    };

    const submitApplication = async (withResponses = false) => {
        setIsSubmittingApplication(true);
        try {
            const requestBody = {};
            
            if (withResponses && screeningResponses.length > 0) {
                requestBody.screeningResponses = screeningResponses;
            }

            const res = await axios.post(
                `${APPLICATION_API_END_POINT}/apply/${jobId}`, 
                requestBody, 
                { withCredentials: true }
            );

            if (res.data.success) {
                setIsApplied(true);
                const currentApplications = singleJob.applications || [];
                const updatedSingleJob = { 
                    ...singleJob, 
                    applications: [...currentApplications, { applicant: user?._id }] 
                };
                dispatch(setSingleJob(updatedSingleJob));
                toast.success(res.data.message);
                setScreeningDialogOpen(false);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Failed to apply for job");
        } finally {
            setIsSubmittingApplication(false);
        }
    };

    const applyJobHandler = async () => {
        startApplicationProcess();
    };

    const recalculateMatchScores = async () => {
        if (!isRecruiter || !isJobCreator) return;
        
        setIsRecalculating(true);
        try {
            const res = await axios.post(`${APPLICATION_API_END_POINT}/${jobId}/recalculate`, {}, { withCredentials: true });
            if (res.data.success) {
                setApplicants(res.data.applications);
                toast.success("Match scores recalculated successfully");
            }
        } catch (error) {
            console.error("Error recalculating match scores:", error);
            toast.error("Failed to recalculate match scores");
        } finally {
            setIsRecalculating(false);
        }
    };

    const deleteJobHandler = async () => {
        if (!isRecruiter || !isJobCreator) return;
        
        setIsDeleting(true);
        try {
            const res = await axios.delete(`${JOB_API_END_POINT}/delete/${jobId}`, { withCredentials: true });
            if (res.data.success) {
                toast.success("Job deleted successfully");
                navigate('/admin/jobs');
            }
        } catch (error) {
            console.error("Error deleting job:", error);
            toast.error(error.response?.data?.message || "Failed to delete job");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    useEffect(() => {
        const fetchSingleJob = async () => {
            try {
                if (!jobId) {
                    console.error("Job ID is undefined");
                    return;
                }

                const res = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, { withCredentials: true });
                
                if (res.data.success) {
                    const job = res.data.job;
                    
                    // Format requirements if they exist
                    if (job.requirements) {
                        job.formattedRequirements = Array.isArray(job.requirements) 
                            ? job.requirements.map(req => {
                                if (typeof req === 'object' && req !== null) {
                                    return req.skill || req.requirement || req.text || 
                                           req.name || req.title || req.description || 
                                           (req.toString && req.toString() !== '[object Object]' ? req.toString() : 'Requirement');
                                }
                                return req;
                            })
                            : [];
                    }
                    
                    dispatch(setSingleJob(job));
                    
                    // Check if the user has already applied for this job
                    // Handle both object applications and string/ID applications
                    console.log("DEBUG - Application Check:", {
                        userId: user?._id,
                        jobId: job._id,
                        applications: job.applications || [],
                        applicationsCount: job.applications?.length || 0
                    });
                    
                    // If user is not logged in, they haven't applied
                    if (!user?._id) {
                        setIsApplied(false);
                        return;
                    }
                    
                    // Check if the user has already applied for this job
                    let isAlreadyApplied = false;
                    
                    if (job.applications && job.applications.length > 0) {
                        // First check for object applications where we can directly check the applicant ID
                        isAlreadyApplied = job.applications.some(application => {
                            const isObjectApplication = typeof application === 'object' && application !== null;
                            
                            if (isObjectApplication) {
                                // Handle object applications - check applicant field
                                const applicantId = application.applicant?._id || application.applicant;
                                return applicantId === user?._id;
                            }
                            
                            // For string applications, we'll check in the next step
                            return false;
                        });
                        
                        // If not already found as applied, check if we need to make an API call to verify string applications
                        if (!isAlreadyApplied) {
                            // Check if there are any string applications that we need to verify
                            const stringApplications = job.applications.filter(app => typeof app === 'string');
                            
                            if (stringApplications.length > 0) {
                                try {
                                    // Make a single API call to check if the user has applied
                                    const checkRes = await axios.get(
                                        `${APPLICATION_API_END_POINT}/check/${jobId}/${user._id}`, 
                                        { withCredentials: true }
                                    );
                                    
                                    if (checkRes.data.success && checkRes.data.hasApplied) {
                                        isAlreadyApplied = true;
                                    }
                                } catch (error) {
                                    console.error("Error checking application status:", error);
                                    // If there's an error, we'll assume they haven't applied
                                }
                            }
                        }
                    }
                    
                    console.log("DEBUG - Is User Applied:", isAlreadyApplied);
                    setIsApplied(isAlreadyApplied);
                }
            } catch (error) {
                console.error("Error fetching job details:", error);
                toast.error("Failed to fetch job details.");
            }
        };
        fetchSingleJob();
    }, [jobId, dispatch, user?._id]);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('User and job details:', {
                userRole: user?.role,
                userId: user?._id,
                jobCreatorId: singleJob?.created_by,
                isRecruiter,
                isJobCreator
            });
        }
    }, [user?._id, user?.role, singleJob?.created_by, isRecruiter, isJobCreator]);

    useEffect(() => {
        const fetchApplicants = async () => {
            if (!isRecruiter || !isJobCreator) return;
            
            setIsLoadingApplicants(true);
            try {
                const res = await axios.get(`${APPLICATION_API_END_POINT}/${jobId}/applicants`, { withCredentials: true });
                if (res.data.success) {
                    console.log('Fetched applicants:', res.data.job.applications);
                    setApplicants(res.data.job.applications || []);
                }
            } catch (error) {
                console.error("Error fetching applicants:", error);
                toast.error("Failed to fetch applicants");
            } finally {
                setIsLoadingApplicants(false);
            }
        };

        if (singleJob?._id) {
            fetchApplicants();
        }
    }, [jobId, isRecruiter, isJobCreator, singleJob?._id]);

    const renderApplicantsList = () => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Rendering applicants list:', { isRecruiter, isJobCreator, user });
        }
        
        if (!isRecruiter || !isJobCreator) {
            if (process.env.NODE_ENV === 'development') {
                console.log('Not showing applicants list because:', { isRecruiter, isJobCreator });
            }
            return null;
        }

        return (
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-600" />
                            <h2 className="text-xl font-bold text-gray-900">Applicants</h2>
                        </div>
                        <Button
                            onClick={recalculateMatchScores}
                            disabled={isRecalculating}
                            className={`${isRecalculating ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'} text-white px-4 py-2 rounded-md flex items-center gap-2`}
                        >
                            {isRecalculating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Recalculating...
                                </>
                            ) : (
                                <>
                                    <Percent className="w-4 h-4" />
                                    Recalculate Scores
                                </>
                            )}
                        </Button>
                    </div>
                </div>
                <div className="divide-y divide-gray-100">
                    {isLoadingApplicants ? (
                        <div className="p-6 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        </div>
                    ) : applicants.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            No applications yet
                        </div>
                    ) : (
                        applicants.map((application) => {
                            const applicant = application.applicant || {};
                            return (
                                <div key={application._id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{applicant.fullname || 'N/A'}</h3>
                                            <p className="text-sm text-gray-600">{applicant.email || 'N/A'}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge className={`flex items-center gap-1 ${
                                                application.similarity >= 0.7 ? 'bg-green-100 text-green-700' :
                                                application.similarity >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                <Percent className="w-3 h-3" />
                                                {formatMatchScore(application.similarity)} Match
                                            </Badge>
                                            {applicant.profile?.resume?.url && (
                                                <a
                                                    href={applicant.profile.resume.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    View Resume
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    };

    const formatMatchScore = (score) => {
        if (!score && score !== 0) return "N/A";
        const percentage = score * 100;
        return `${Math.round(percentage)}%`;
    };

    // Update the AISuggestionsSection component to show different suggestions based on user role
    const AISuggestionsSection = ({ job }) => {
        // Check if the current user is the job creator or recruiter
        const canSeeAllSuggestions = isRecruiter && isJobCreator;
        
        // Determine which suggestions to show based on user role
        const improvements = canSeeAllSuggestions 
            ? (job?.aiImprovements || []) 
            : (job?.showAiSuggestionsToApplicants ? (job?.approvedAiImprovements || []) : []);
        
        const additionalSkills = canSeeAllSuggestions 
            ? (job?.aiAdditionalSkills || []) 
            : (job?.showAiSuggestionsToApplicants ? (job?.approvedAiAdditionalSkills || []) : []);
        
        const structuredRequirements = canSeeAllSuggestions 
            ? (job?.aiStructuredRequirements || []) 
            : (job?.showAiSuggestionsToApplicants ? (job?.approvedAiStructuredRequirements || []) : []);
        
        const hasAISuggestions = 
            improvements.length > 0 ||
            additionalSkills.length > 0 ||
            structuredRequirements.length > 0;
        
        // Don't display the section at all for non-recruiters if no suggestions or showAiSuggestions is false
        if (!canSeeAllSuggestions && (!job?.showAiSuggestionsToApplicants || !hasAISuggestions)) {
            return null;
        }
        
        return (
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h2 className="text-xl font-bold text-gray-900">
                            {canSeeAllSuggestions ? "AI Insights (All)" : "AI Insights"}
                        </h2>
                    </div>
                    {canSeeAllSuggestions && (
                        <p className="text-sm text-gray-500 mt-2">
                            As the job creator, you can see all AI suggestions. Applicants will only see approved suggestions.
                        </p>
                    )}
                </div>
                <div className="p-6 space-y-6">
                    {!hasAISuggestions && (
                        <div className="text-center py-6">
                            <p className="text-gray-500">No AI insights available for this job posting.</p>
                        </div>
                    )}
                    
                    {improvements.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-lg mb-2">
                                {canSeeAllSuggestions ? "Suggested Improvements" : "Improvements"}
                            </h3>
                            <ul className="list-disc pl-5 space-y-1">
                                {improvements.map((improvement, index) => (
                                    <li key={index} className="text-gray-700">{improvement}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {additionalSkills.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-lg mb-2">
                                {canSeeAllSuggestions ? "Additional Skills to Consider" : "Additional Skills"}
                            </h3>
                            <ul className="list-disc pl-5 space-y-1">
                                {additionalSkills.map((skill, index) => (
                                    <li key={index} className="text-gray-700">{skill}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {structuredRequirements.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-lg mb-2">
                                {canSeeAllSuggestions ? "Structured Requirements" : "Requirements"}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {structuredRequirements.map((req, index) => (
                                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                                        <p className="font-medium">{req.skill}</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {req.category && (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    {req.category}
                                                </Badge>
                                            )}
                                            {req.level && (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    {req.level}
                                                </Badge>
                                            )}
                                            {req.importance && (
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                    {req.importance}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className='max-w-7xl mx-auto my-10 px-4'>
            <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
                <ChevronLeft className="w-4 h-4" />
                Back
            </Button>

            <div className='flex flex-col sm:flex-row items-start justify-between bg-white shadow-md rounded-xl p-6 border border-gray-100'>
                <div className='flex-1'>
                    <div className="flex items-start gap-4 mb-4">
                        {singleJob?.company?.logo && (
                            <img 
                                src={singleJob.company.logo} 
                                alt={singleJob.company.name} 
                                className="w-16 h-16 rounded-lg object-cover"
                            />
                        )}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Building2 className="w-5 h-5 text-gray-600" />
                                <h2 className="text-lg font-semibold text-gray-900">{singleJob?.company?.name || 'Company Name Not Available'}</h2>
                            </div>
                            {singleJob?.company?.location && (
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{singleJob.company.location}</span>
                                </div>
                            )}
                            {singleJob?.company?.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {singleJob.company.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <h1 className='font-bold text-2xl text-gray-900 mb-4'>{singleJob?.title}</h1>
                    <div className='flex flex-wrap items-center gap-4'>
                        <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{singleJob?.location}</span>
                        </div>
                        {singleJob?.position && (
                            <Badge className='bg-blue-100 text-blue-700 hover:bg-blue-200'>
                                <Briefcase className="w-3 h-3 mr-1" />
                                {singleJob.position} Positions
                            </Badge>
                        )}
                        <Badge className='bg-red-100 text-red-700 hover:bg-red-200'>
                            <Clock className="w-3 h-3 mr-1" />
                            {singleJob?.type || "Full-time"}
                        </Badge>
                        <Badge className='bg-green-100 text-green-700 hover:bg-green-200'>
                            ₹{singleJob?.salary} LPA
                        </Badge>
                        {!isRecruiter && singleJob?.similarity !== undefined && (
                            <Badge className={`flex items-center gap-1 ${
                                singleJob.similarity >= 0.7 ? 'bg-green-100 text-green-700' :
                                singleJob.similarity >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                                <Percent className="w-3 h-3" />
                                {formatMatchScore(singleJob.similarity)} Match
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="mt-4 sm:mt-0 flex gap-2">
                    {isRecruiter && isJobCreator && (
                        <Button 
                            onClick={() => setDeleteDialogOpen(true)} 
                            variant="destructive"
                            className="flex items-center gap-1"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </Button>
                    )}
                    {!isRecruiter && (
                        <Button
                            onClick={applyJobHandler}
                            disabled={isApplied}
                            className={`${isApplied ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} transition duration-200`}
                        >
                            {isApplied ? 'Already Applied' : 'Apply Now'}
                        </Button>
                    )}
                </div>
            </div>

            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
                    <p className="text-gray-600 whitespace-pre-wrap">{singleJob?.description}</p>
                    
                    <div className="mt-6 space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-900">Experience Required</h3>
                            <p className="text-gray-600">
                                {singleJob?.experience ? `${singleJob.experience} years` : "5+ years"}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Requirements</h3>
                            <ul className="list-disc list-inside text-gray-600 mt-2">
                                {singleJob?.formattedRequirements && singleJob.formattedRequirements.length > 0 ? (
                                    singleJob.formattedRequirements.map((req, index) => (
                                        <li key={index}>{req}</li>
                                    ))
                                ) : Array.isArray(singleJob?.requirements) && singleJob.requirements.length > 0 ? (
                                    singleJob.requirements.map((req, index) => {
                                        if (typeof req === 'object' && req !== null) {
                                            return (
                                                <li key={index}>
                                                    {req.skill || req.requirement || req.text || 
                                                    req.name || req.title || req.description || 
                                                    (req.toString && req.toString() !== '[object Object]' ? req.toString() : 'Requirement')}
                                                </li>
                                            );
                                        }
                                        return <li key={index}>{req}</li>;
                                    })
                                ) : (
                                    <li>No specific requirements listed</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add the AI Suggestions section here */}
            <AISuggestionsSection job={singleJob} />

            {renderApplicantsList()}

            {/* Delete confirmation dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Job Posting</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this job posting? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={deleteJobHandler}
                            disabled={isDeleting}
                            className="flex items-center gap-1"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Delete Job
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Screening Questions Dialog */}
            <Dialog open={screeningDialogOpen} onOpenChange={setScreeningDialogOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Screening Questions</DialogTitle>
                        <DialogDescription>
                            Please answer the following questions to complete your application for {singleJob?.title}.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 my-4">
                        {screeningResponses.map((response, index) => (
                            <div key={index} className="space-y-2">
                                <Label htmlFor={`question-${index}`} className="font-medium">
                                    {response.question}
                                </Label>
                                
                                {response.type === 'text' && (
                                    <Textarea
                                        id={`question-${index}`}
                                        value={response.answer}
                                        onChange={(e) => handleScreeningAnswerChange(index, e.target.value)}
                                        placeholder="Type your answer here..."
                                        className="min-h-[80px]"
                                    />
                                )}
                                
                                {response.type === 'multiple_choice' && (
                                    <Select 
                                        value={response.answer}
                                        onValueChange={(value) => handleScreeningAnswerChange(index, value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an option" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {response.options.map((option, optIndex) => (
                                                <SelectItem key={optIndex} value={option}>{option}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                
                                {response.type === 'boolean' && (
                                    <Select 
                                        value={response.answer}
                                        onValueChange={(value) => handleScreeningAnswerChange(index, value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select yes or no" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="yes">Yes</SelectItem>
                                            <SelectItem value="no">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setScreeningDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => submitApplication(true)}
                            disabled={isSubmittingApplication || screeningResponses.some(r => !r.answer)}
                            className={isSubmittingApplication ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-700'}
                        >
                            {isSubmittingApplication ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Application'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default JobDescription;