import React, { useEffect, useState } from 'react';
import LatestJobCards from './LatestJobCards';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { JOB_API_END_POINT } from '@/utils/constant';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { FileText, LogIn } from 'lucide-react';

const LatestJobs = () => {
    const { user } = useSelector(store => store.auth);
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecommendedJobs = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const res = await axios.get(`${JOB_API_END_POINT}/recommendations`, {
                    withCredentials: true
                });
                
                if (res.data.success) {
                    const jobs = res.data.recommendations || [];
                    console.log("Received jobs:", jobs.length);
                    setRecommendedJobs(jobs);
                } else {
                    throw new Error(res.data.error || 'Failed to fetch recommendations');
                }
            } catch (error) {
                console.error("Error fetching recommendations:", error);
                setError(error.message || 'Failed to fetch job recommendations');
                setRecommendedJobs([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchRecommendedJobs();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const renderLoginPrompt = () => (
        <div className="col-span-full bg-white rounded-xl shadow-sm border border-purple-100 p-8 text-center">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="p-4 bg-purple-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                    <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Get Personalized Job Recommendations</h2>
                <p className="text-gray-600">
                    Login and upload your resume to receive AI-powered job recommendations tailored to your skills and experience.
                </p>
                <div className="flex justify-center gap-4">
                    <Button 
                        onClick={() => navigate('/login')}
                        className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                    >
                        <LogIn className="w-4 h-4" />
                        Login to Continue
                    </Button>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        if (!user) {
            return renderLoginPrompt();
        }

        if (isLoading) {
            return (
                <div className='col-span-full flex justify-center items-center py-10'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#6A38C2]'></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className='col-span-full text-center text-lg font-medium text-red-600'>
                    {error}
                </div>
            );
        }

        if (recommendedJobs.length === 0) {
            return (
                <div className='col-span-full text-center text-lg font-medium text-gray-600'>
                    No jobs available at the moment
                </div>
            );
        }

        return recommendedJobs.map((job) => (
            <LatestJobCards key={job._id} job={job} />
        ));
    };

    return (
        <div className='max-w-7xl mx-auto my-20 px-4'>
            <h1 className='text-4xl font-bold text-center'>
                <span className='text-[#6A38C2]'>Recommended Jobs </span> for You
            </h1>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-8'>
                {renderContent()}
            </div>
        </div>
    );
};

export default LatestJobs;