import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, IndianRupee, Users, Clock, Briefcase, Percent } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const JobCard = ({ job }) => {
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    };

    // Helper function to format match score as percentage
    const formatMatchScore = (score) => {
        if (!score && score !== 0) return "N/A";
        // Convert decimal to percentage
        const percentage = score * 100;
        return `${Math.round(percentage)}%`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-purple-100 hover:shadow-md transition-all duration-300">
            <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold text-gray-900 hover:text-purple-600 cursor-pointer"
                            onClick={() => navigate(`/job/${job._id}`)}>
                            {job.title}
                        </h2>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Building2 className="w-4 h-4" />
                                <span className="text-sm font-medium">{job.company?.name || 'Company Name Not Available'}</span>
                            </div>
                            {job.company?.location && (
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <MapPin className="w-4 h-4" />
                                    <span>{job.company.location}</span>
                                </div>
                            )}
                            {job.company?.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                    {job.company.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                            {job.type}
                        </Badge>
                        {job.similarity !== undefined && (
                            <div className="flex items-center gap-1 text-sm">
                                <Percent className="w-4 h-4" />
                                <span className={`font-medium ${
                                    job.similarity >= 0.7 ? 'text-green-600' :
                                    job.similarity >= 0.5 ? 'text-yellow-600' :
                                    'text-red-600'
                                }`}>
                                    {formatMatchScore(job.similarity)} Match
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <IndianRupee className="w-4 h-4" />
                        <span className="text-sm">{job.salary} LPA</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{job.position} positions</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Posted {formatDate(job.createdAt)}</span>
                    </div>
                </div>

                {/* Skills */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-900">
                        <Briefcase className="w-4 h-4" />
                        <h3 className="font-medium">Required Skills</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {job.requirements?.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700">
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                    <Button
                        variant="outline"
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        onClick={() => navigate(`/job/${job._id}`)}
                    >
                        View Details
                    </Button>
                    <div className="text-sm text-gray-500">
                        {job.applications?.length || 0} applications
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobCard; 