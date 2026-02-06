import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AISuggestions from './AISuggestions';
import toast from 'react-hot-toast';
import axiosInstance from '@/utils/axios';
import { JOB_API_END_POINT, COMPANY_API_END_POINT } from '@/utils/constant';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Loader2, Sparkles } from "lucide-react";
import Navbar from '../shared/Navbar';

// Validation helper function
const validateJobData = (jobData) => {
    // Check required string fields
    const requiredStringFields = ['title', 'description', 'location', 'type', 'experience', 'salary'];
    for (const field of requiredStringFields) {
        if (!jobData[field] || typeof jobData[field] !== 'string' || !jobData[field].trim()) {
            return { valid: false, message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required` };
        }
    }
    
    // Check requirements
    if (!Array.isArray(jobData.requirements) || jobData.requirements.length === 0) {
        return { valid: false, message: 'At least one requirement is required' };
    }
    
    // Validate each requirement
    for (const req of jobData.requirements) {
        if (!req.skill || !req.category || !req.level) {
            return { valid: false, message: 'All requirements must have skill, category, and level fields' };
        }
    }
    
    // Check date
    if (!jobData.lastDate) {
        return { valid: false, message: 'Application deadline is required' };
    }
    
    // Check screening questions if they exist
    if (jobData.screening_questions && Array.isArray(jobData.screening_questions)) {
        for (const q of jobData.screening_questions) {
            if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
                return { valid: false, message: 'All screening questions must have a valid question field' };
            }
            if (q.type && !['text', 'multiple_choice', 'boolean'].includes(q.type)) {
                return { valid: false, message: 'Question type must be text, multiple_choice, or boolean' };
            }
        }
    }
    
    return { valid: true };
};

const JobPost = () => {
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [jobType, setJobType] = useState('Full-time');
    const [fullScreeningQuestions, setFullScreeningQuestions] = useState([]);
    const { register, handleSubmit, setValue, watch, getValues } = useForm({
        defaultValues: {
            type: 'Full-time'
        }
    });
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [companies, setCompanies] = useState([]);
    const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);
    
    // Add state to track selected/approved AI suggestions
    const [selectedAiSuggestions, setSelectedAiSuggestions] = useState({
        improvements: [],
        additionalSkills: [],
        structuredRequirements: [],
        screeningQuestions: []
    });
    const [showAiSuggestions, setShowAiSuggestions] = useState(false);
    const [showToApplicants, setShowToApplicants] = useState(false);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await axiosInstance.get('/company/get');
                if (res.data.success) {
                    setCompanies(res.data.companies);
                }
            } catch (error) {
                console.error('Error fetching companies:', error);
                toast.error('Failed to fetch companies');
            }
        };
        fetchCompanies();
        
        // Reset the selected AI suggestions when component mounts
        setSelectedAiSuggestions({
            improvements: [],
            additionalSkills: [],
            structuredRequirements: [],
            screeningQuestions: []
        });
        setShowAiSuggestions(false);
    }, []);

    const handleAISuggestion = (type, suggestion) => {
        // Make a copy of the current form data
        const updatedData = { ...getValues() };
        
        // Keep track of selected suggestions for backend
        const updateSelectedSuggestions = {...selectedAiSuggestions};
        
        // Handle different types of suggestions
        if (type === 'improvements') {
            // For description improvements
            updatedData.description = suggestion;
            // Track selected improvement
            if (!updateSelectedSuggestions.improvements.includes(suggestion)) {
                updateSelectedSuggestions.improvements.push(suggestion);
            }
        } else if (type === 'additionalSkills') {
            // For additional skills
            const currentRequirements = updatedData.requirements || '';
            updatedData.requirements = currentRequirements 
                ? `${currentRequirements}\n${suggestion}`
                : suggestion;
            // Track selected additional skill
            if (!updateSelectedSuggestions.additionalSkills.includes(suggestion)) {
                updateSelectedSuggestions.additionalSkills.push(suggestion);
            }
        } else if (type === 'structuredRequirements') {
            // For structured requirements
            const formattedRequirement = `${suggestion.skill} (${suggestion.level}) - ${suggestion.category}`;
            const currentRequirements = updatedData.requirements || '';
            updatedData.requirements = currentRequirements 
                ? `${currentRequirements}\n${formattedRequirement}`
                : formattedRequirement;
            // Track selected structured requirement
            updateSelectedSuggestions.structuredRequirements.push(suggestion);
        } else if (type === 'screeningQuestions') {
            // For screening questions
            const newQuestion = typeof suggestion === 'string' 
                ? suggestion 
                : suggestion.question;
                
            // Update the fullScreeningQuestions state
            const currentFullQuestions = [...(fullScreeningQuestions || [])];
            currentFullQuestions.push(typeof suggestion === 'string' 
                ? { question: suggestion, type: 'text', options: [], weight: 1 } 
                : suggestion);
            setFullScreeningQuestions(currentFullQuestions);
            
            // Update the display text in the form
            const currentQuestions = updatedData.screeningQuestions || '';
            updatedData.screeningQuestions = currentQuestions 
                ? `${currentQuestions}\n${newQuestion}`
                : newQuestion;
                
            // Track selected screening question
            updateSelectedSuggestions.screeningQuestions.push(
                typeof suggestion === 'string' 
                ? { question: suggestion, type: 'text', options: [], weight: 1 } 
                : suggestion
            );
        }
        
        // Update the form with the new values
        Object.keys(updatedData).forEach(key => {
            setValue(key, updatedData[key]);
        });
        
        // Update the selected suggestions state
        setSelectedAiSuggestions(updateSelectedSuggestions);
        
        // Enable showing AI suggestions to applicants
        setShowAiSuggestions(true);
        
        // Show notification
        toast.success(`Applied ${type} suggestion successfully!`);
    };

    const onSubmit = async (data) => {
        try {
            setIsLoading(true);
            
            // Format requirements as structured objects
            let formattedRequirements = [];
            if (data.requirements) {
                // Split requirements by commas or new lines
                const reqArray = data.requirements.split(/[,\n]/).filter(req => req.trim());
                
                formattedRequirements = reqArray.map(req => {
                    const trimmedSkill = req.trim();
                    // Create a properly structured requirement object
                    return {
                        skill: trimmedSkill,
                        category: 'technical', // Default category
                        level: 'intermediate', // Default level
                        importance: 1, // Default importance
                        weight: 1 // Default weight
                    };
                });
            }
            
            // Format screening questions if they exist as string
            let formattedScreeningQuestions = [];
            if (fullScreeningQuestions && fullScreeningQuestions.length > 0) {
                // If we have fullScreeningQuestions from AI suggestions, use those directly
                formattedScreeningQuestions = fullScreeningQuestions;
            } else if (data.screeningQuestions) {
                if (typeof data.screeningQuestions === 'string') {
                    // Split by lines and filter out empty questions
                    const questionLines = data.screeningQuestions
                        .split('\n')
                        .filter(q => q.trim());
                    
                    // Format each question to match the schema
                    formattedScreeningQuestions = questionLines.map(q => ({
                        question: q.trim(), // Required field
                        expectedAnswer: "",
                        type: "text", // Must be one of the enum values: 'text', 'multiple_choice', 'boolean'
                        options: [], // Array of strings for multiple choice options
                        weight: 1
                    }));
                } else if (Array.isArray(data.screeningQuestions)) {
                    // Handle array of questions
                    formattedScreeningQuestions = data.screeningQuestions
                        .filter(q => q && (typeof q === 'string' ? q.trim() : q.question))
                        .map(q => {
                            if (typeof q === 'object' && q !== null && q.question) {
                                // Ensure object has all required fields with valid values
                                return {
                                    ...q,
                                    question: q.question.trim(), // Required field
                                    type: q.type && ['text', 'multiple_choice', 'boolean'].includes(q.type) 
                                        ? q.type : 'text',
                                    expectedAnswer: q.expectedAnswer || "",
                                    options: Array.isArray(q.options) ? q.options : [],
                                    weight: typeof q.weight === 'number' ? q.weight : 1
                                };
                            }
                            // Convert string to properly formatted object
                            return {
                                question: typeof q === 'string' ? q.trim() : String(q).trim(),
                                expectedAnswer: "",
                                type: "text",
                                options: [],
                                weight: 1
                            };
                        });
                }
            }
            
            // Replace the requirements and screeningQuestions in the data with our formatted versions
            const formData = {
                ...data,
                requirements: formattedRequirements,
                screeningQuestions: formattedScreeningQuestions
            };
            
            // Get AI suggestions first without posting the job
            const response = await axiosInstance.post('/job/analyze', formData);
            
            console.log("AI suggestions response:", response.data);
            
            if (response.data && response.data.aiSuggestions) {
                const suggestions = response.data.aiSuggestions;
                console.log("AI suggestions object:", suggestions);
                
                // Check if any suggestions exist
                const hasSuggestions = 
                    (suggestions.improvement && suggestions.improvement.length > 0) ||
                    (suggestions.additionalSkills && suggestions.additionalSkills.length > 0) ||
                    (suggestions.structuredRequirements && suggestions.structuredRequirements.length > 0) ||
                    (suggestions.screeningQuestions && suggestions.screeningQuestions.length > 0);
                    
                if (hasSuggestions) {
                    // Store suggestions and show modal
                    setAiSuggestions(suggestions);
                    setAiSuggestionsOpen(true);
                    // Show notification that suggestions are available
                    toast.success('AI suggestions are available! Review them before posting.');
                    
                    // Store the form data to post later
                    setFormDataToPost(formData);
                    setIsLoading(false);
                    return;
                }
            }
            
            // If no suggestions or analyze endpoint not available, post the job directly
            await postJobToServer(formData);
            
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error analyzing/posting job');
            setIsLoading(false);
        }
    };
    
    // New state to store form data between analyze and post
    const [formDataToPost, setFormDataToPost] = useState(null);
    
    // Function to post job after reviewing suggestions
    const postJobToServer = async (formData, showToApplicantsFlag) => {
        try {
            setIsLoading(true);
            const submitData = formData || formDataToPost;
            
            if (!submitData) {
                toast.error('No form data available to submit');
                setIsLoading(false);
                return;
            }
            
            // Debug selected suggestions before sending
            console.log('Selected AI suggestions before posting:', selectedAiSuggestions);
            console.log('Show AI suggestions flag:', showAiSuggestions);
            
            // Map the selected suggestions to the format expected by the backend
            const finalSubmitData = {
                ...submitData,
                // Include approved/selected AI suggestions
                approvedAiImprovements: selectedAiSuggestions.improvements,
                approvedAiAdditionalSkills: selectedAiSuggestions.additionalSkills,
                approvedAiStructuredRequirements: selectedAiSuggestions.structuredRequirements,
                // Include approved AI screening questions
                approvedAiScreeningQuestions: selectedAiSuggestions.screeningQuestions,
                // Include flag to control visibility of suggestions to applicants
                showAiSuggestionsToApplicants: showToApplicantsFlag,
            };
            
            // Debug the final data being sent to the server
            console.log('Final data being sent to server:', finalSubmitData);
            
            const response = await axiosInstance.post('/job/post', finalSubmitData);
            console.log('Server response after posting job:', response.data);
            toast.success('Job posted successfully!');
            
            // Navigate to jobs page after successful post
            navigate('/admin/jobs');
            
        } catch (error) {
            console.error('Error posting job:', error);
            toast.error(error.response?.data?.message || 'Error posting job');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Post a New Job</h1>
                    
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <Label>Select Company *</Label>
                            <Select
                                name="company"
                                onValueChange={(value) => setValue('company', value)}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a company" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((company) => (
                                        <SelectItem key={company._id} value={company._id}>
                                            <div className="flex items-center gap-2">
                                                {company.logo && (
                                                    <img
                                                        src={company.logo}
                                                        alt={company.name}
                                                        className="w-6 h-6 rounded-full object-cover"
                                                    />
                                                )}
                                                {company.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Job Title *</Label>
                            <Input
                                type="text"
                                name="title"
                                {...register('title')}
                                required
                                placeholder="e.g., Senior Software Engineer"
                            />
                        </div>

                        <div>
                            <Label>Description *</Label>
                            <Textarea
                                name="description"
                                {...register('description')}
                                required
                                placeholder="Detailed job description..."
                                rows={5}
                            />
                            {aiSuggestions && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mt-2 flex items-center text-blue-600"
                                    onClick={() => setAiSuggestionsOpen(true)}
                                >
                                    <Sparkles className="h-4 w-4 mr-1" />
                                    View AI Suggestions
                                </Button>
                            )}
                        </div>

                        <div>
                            <Label>Requirements * (comma-separated)</Label>
                            <Textarea
                                name="requirements"
                                {...register('requirements')}
                                required
                                placeholder="e.g., React, Node.js, 5 years experience"
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label>Screening Questions</Label>
                            <Textarea
                                name="screeningQuestions"
                                {...register('screeningQuestions')}
                                placeholder="Add screening questions for candidates, one per line..."
                                className="min-h-[100px]"
                            />
                            <p className="text-sm text-gray-500">Optional: Add questions to screen candidates. Put each question on a new line.</p>
                        </div>

                        <div>
                            <Label>Location *</Label>
                            <Input
                                type="text"
                                name="location"
                                {...register('location')}
                                required
                                placeholder="e.g., New York, Remote"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Experience Required *</Label>
                                <Input
                                    type="text"
                                    name="experience"
                                    {...register('experience')}
                                    required
                                    placeholder="e.g., 3-5 years"
                                />
                            </div>

                            <div>
                                <Label>Salary *</Label>
                                <Input
                                    type="text"
                                    name="salary"
                                    {...register('salary')}
                                    required
                                    placeholder="e.g., $100,000 - $150,000"
                                />
                            </div>

                            <div>
                                <Label>Job Type *</Label>
                                <Select
                                    name="type"
                                    value={jobType}
                                    onValueChange={setJobType}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select job type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Full-time">Full-time</SelectItem>
                                        <SelectItem value="Part-time">Part-time</SelectItem>
                                        <SelectItem value="Contract">Contract</SelectItem>
                                        <SelectItem value="Internship">Internship</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Application Deadline *</Label>
                                <Input
                                    type="date"
                                    name="lastDate"
                                    {...register('lastDate')}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/admin/jobs')}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-blue-500 hover:bg-blue-600"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Posting Job...
                                    </>
                                ) : (
                                    'Post Job'
                                )}
                            </Button>
                        </div>
                    </form>

                    {aiSuggestionsOpen && aiSuggestions && (
                        <AISuggestions 
                            suggestions={aiSuggestions} 
                            onClose={() => setAiSuggestionsOpen(false)} 
                            onApplySuggestion={handleAISuggestion}
                            onPostJob={(showToApplicantsFlag) => {
                                console.log('Post job with showToApplicants flag:', showToApplicantsFlag);
                                setShowToApplicants(showToApplicantsFlag);
                                setAiSuggestionsOpen(false);
                                postJobToServer(null, showToApplicantsFlag);
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobPost; 