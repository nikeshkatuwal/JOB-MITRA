import React from 'react';
import { Button } from './ui/button';
import { Bookmark } from 'lucide-react';
import { Avatar, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useNavigate } from 'react-router-dom';

const Job = ({ job }) => {
    const navigate = useNavigate();

    const daysAgoFunction = (mongodbTime) => {
        const createdAt = new Date(mongodbTime);
        const currentTime = new Date();
        const timeDifference = currentTime - createdAt;
        return Math.floor(timeDifference / (1000 * 24 * 60 * 60));
    }

    const truncateDescription = (description, charLimit) => {
        if (!description) return "";
        if (description.length > charLimit) {
            return description.slice(0, charLimit) + '...';
        }
        return description;
    }

    return (
        <div className='hover:animate-background rounded-xl bg-gradient-to-r from-green-300 via-blue-500 to-purple-600 p-[0.2rem] shadow-xl transition hover:bg-[length:400%_400%] hover:shadow-sm hover:[animation-duration:_4s]'>
            <div className='p-4 shadow-xl bg-white border border-gray-100 h-[420px] lg:max-w-[450px] rounded-[10px] sm:p-6 lg:p-8 overflow-hidden'>
                <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center md:gap-8 sm:flex-row items-start sm:items-center'>
                    <p className='text-xs sm:text-sm lg:text-base text-gray-500'>
                        {daysAgoFunction(job?.createdAt) === 0 ? "Today" : `${daysAgoFunction(job?.createdAt)} days ago`}
                    </p>
                    <Button variant="outline" className="rounded-full mt-2 sm:mt-0" size="icon">
                        <Bookmark />
                    </Button>
                </div>

                <div className='flex items-center gap-3 my-3'>
                    <Button className="p-2 sm:p-6 lg:p-8" variant="outline" size="icon">
                        <Avatar>
                            <AvatarImage src={job?.company?.logo} />
                        </Avatar>
                    </Button>
                    <div>
                        <h1 className='font-medium text-base sm:text-lg lg:text-xl'>{job?.company?.name}</h1>
                        <p className='text-xs sm:text-sm lg:text-base text-gray-500'>Nepal</p>
                    </div>
                </div>

                <div>
                    <h1 className='font-bold text-base sm:text-lg lg:text-xl my-2'>{job?.title}</h1>
                    <p className='text-xs sm:text-sm lg:text-base text-gray-600'>
                        {truncateDescription(job?.description, 94)}
                    </p>
                </div>

                <div className='flex flex-wrap items-center gap-2 mt-4'>
                    <Badge className='text-blue-700 font-bold text-xs sm:text-sm lg:text-base' variant="ghost">
                        {job?.jobType || job?.type}
                    </Badge>
                    <Badge className='text-[#F83002] font-bold text-xs sm:text-sm lg:text-base' variant="ghost">
                        {job?.location}
                    </Badge>
                    <Badge className='text-[#7209b7] font-bold text-xs sm:text-sm lg:text-base' variant="ghost">
                        {job?.salary} LPA
                    </Badge>
                </div>

                <div className='flex flex-col sm:flex-row lg:flex-row items-start sm:items-center gap-2 sm:gap-4 lg:gap-6 mt-4'>
                    <Button onClick={() => navigate(`/description/${job?._id}`)} variant="outline" className='w-full sm:w-auto'>
                        Details
                    </Button>

                </div>
            </div>
        </div>
    );
}

export default Job;
