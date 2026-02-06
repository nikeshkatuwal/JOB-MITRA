import React from "react";
import { Badge } from "./ui/badge";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, Briefcase, Clock, TrendingUp } from 'lucide-react';

const LatestJobCards = ({ job }) => {
    const navigate = useNavigate();

    const truncateDescription = (description) => {
        if (!description) return '';
        return description.length > 100 ? `${description.slice(0, 97)}...` : description;
    };

    const getMatchColor = (similarity) => {
        const score = similarity * 100;
        if (score >= 70) return "text-green-700 bg-green-100";
        if (score >= 40) return "text-yellow-700 bg-yellow-100";
        return "text-blue-700 bg-blue-100";
    };

    return (
        <div
            onClick={() => navigate(`/description/${job._id}`)}
            className="flex flex-col border rounded-xl bg-white p-6 transition duration-300 ease-in-out hover:border-purple-400 hover:shadow-lg cursor-pointer my-4 mx-auto w-full"
        >
            <div className="flex flex-col gap-4">
                {/* Company and Location */}
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-gray-600" />
                            <h1 className="font-semibold text-lg text-gray-900">
                                {job?.company?.name}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <p className="text-sm">{job?.location}</p>
                        </div>
                    </div>
                    {job.similarity && (
                        <Badge className={`${getMatchColor(job.similarity)} text-sm font-semibold px-3 py-1`}>
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {(job.similarity * 100).toFixed(0)}% Match
                        </Badge>
                    )}
                </div>

                {/* Job Title and Description */}
                <div>
                    <h1 className="font-bold text-xl text-gray-900 mb-2">{job?.title}</h1>
                    <p className="text-gray-600 text-sm">
                        {truncateDescription(job?.description)}
                    </p>
                </div>

                {/* Job Details */}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                    <Badge variant="outline" className="flex items-center gap-1 text-red-700 border-red-200">
                        <Clock className="w-3 h-3" />
                        {job?.jobType || job?.type}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-200">
                        ₹{job?.salary} LPA
                    </Badge>
                </div>
            </div>
        </div>
    );
};

export default LatestJobCards;