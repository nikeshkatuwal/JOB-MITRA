import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AISuggestions from './AISuggestions';
import toast from 'react-hot-toast';
import axiosInstance from '@/utils/axios';
import { JOB_API_END_POINT } from '@/utils/constant';
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
import { Loader2 } from "lucide-react";

const PostJob = () => {
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [jobType, setJobType] = useState('full-time');
    const { register, handleSubmit, setValue, watch } = useForm({
        defaultValues: {
            type: 'full-time'
        }
    });
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const handleAISuggestion = (type, suggestion) => {
        const currentDescription = watch('description') || '';
        const currentRequirements = watch('requirements') || '';

        switch (type) {
            case 'requirement':
                const newReq = suggestion.skill;
                setValue('requirements', currentRequirements ? `${currentRequirements}, ${newReq}` : newReq);
                break;
            case 'improvement':
                setValue('description', `${currentDescription}\n\n${suggestion}`);
                break;
            case 'skill':
                setValue('requirements', currentRequirements ? `${currentRequirements}, ${suggestion}` : suggestion);
                break;
            case 'question':
                const currentQuestions = watch('screeningQuestions') || [];
                setValue('screeningQuestions', [...currentQuestions, suggestion]);
                break;
            default:
                break;
        }
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            // Validate required fields
            if (!data.title || !data.description || !data.requirements || !data.location || 
                !data.experienceLevel || !data.salary || !data.lastDate) {
                toast.error('Please fill in all required fields');
                return;
            }

            // Format requirements as an array of structured objects
            const formattedRequirements = data.requirements.split('\n').flatMap(line => 
                line.split(',').map(req => ({
                    skill: req.trim(),
                    category: 'technical',
                    level: 'intermediate',
                    importance: 'must_have',
                    weight: 1
                })).filter(req => req.skill) // Filter out empty skills
            );

            if (formattedRequirements.length === 0) {
                toast.error('Please add at least one requirement');
                return;
            }

            // Format the data
            const jobData = {
                title: data.title.trim(),
                description: data.description.trim(),
                requirements: formattedRequirements,
                location: data.location.trim(),
                experienceLevel: Math.max(0, parseInt(data.experienceLevel) || 0),
                salary: Math.max(0, parseInt(data.salary) || 0),
                type: jobType,
                lastDate: new Date(data.lastDate).toISOString(),
                company: user._id,
                created_by: user._id
            };

            console.log('Submitting job data:', jobData);

            // Send the job posting request using our configured axios instance
            const response = await axiosInstance.post('/job/post', jobData);

            console.log('Job posting response:', response.data);

            if (response.data.success) {
                if (response.data.job?.aiSuggestions) {
                    setAiSuggestions(response.data.job.aiSuggestions);
                    toast.success('Job posted! Review AI suggestions to enhance your posting.');
                } else {
                    toast.success('Job posted successfully!');
                    navigate('/admin/jobs');
                }
            } else {
                toast.error(response.data.message || 'Failed to post job');
            }
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'Error posting job. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">Post a New Job</CardTitle>
                            <CardDescription>
                                Fill in the details below to create a new job posting. Our AI will help optimize your listing.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Job Title</Label>
                                    <Input
                                        id="title"
                                        {...register('title')}
                                        placeholder="e.g. Senior Software Engineer"
                                        className="w-full"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Job Description</Label>
                                    <Textarea
                                        id="description"
                                        {...register('description')}
                                        placeholder="Describe the role, responsibilities, and ideal candidate..."
                                        className="min-h-[150px]"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="requirements">Requirements</Label>
                                    <Textarea
                                        id="requirements"
                                        {...register('requirements')}
                                        placeholder="List key skills and requirements, separated by commas..."
                                        className="min-h-[100px]"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        {...register('location')}
                                        placeholder="e.g. New York, NY or Remote"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="experienceLevel">Experience (years)</Label>
                                        <Input
                                            id="experienceLevel"
                                            type="number"
                                            {...register('experienceLevel')}
                                            min="0"
                                            placeholder="0"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="salary">Annual Salary</Label>
                                        <Input
                                            id="salary"
                                            type="number"
                                            {...register('salary')}
                                            placeholder="60000"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Job Type</Label>
                                    <Select value={jobType} onValueChange={setJobType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select job type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="full-time">Full Time</SelectItem>
                                            <SelectItem value="part-time">Part Time</SelectItem>
                                            <SelectItem value="contract">Contract</SelectItem>
                                            <SelectItem value="internship">Internship</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lastDate">Application Deadline</Label>
                                    <Input
                                        id="lastDate"
                                        type="date"
                                        {...register('lastDate')}
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
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
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:sticky lg:top-6 space-y-6 h-fit">
                    {aiSuggestions && (
                        <AISuggestions
                            suggestions={aiSuggestions}
                            onApplySuggestion={handleAISuggestion}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostJob;
