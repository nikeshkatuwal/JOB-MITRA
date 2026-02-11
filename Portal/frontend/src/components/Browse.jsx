import React, { useEffect, useState } from 'react';
import Navbar from './shared/Navbar';
import Job from './Job';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchedQuery } from '@/redux/jobSlice';
import useGetAllJobs from '@/hooks/useGetAllJobs';

const Browse = () => {
    useGetAllJobs();
    const { allJobs, searchedQuery } = useSelector(store => store.job);
    const [filterJobs, setFilterJobs] = useState([]);
    const dispatch = useDispatch();

    useEffect(() => {
        if (searchedQuery) {
            const filteredJobs = (allJobs || []).filter((job) => {
                const query = searchedQuery.toLowerCase();
                return (
                    (job?.title?.toLowerCase() || "").includes(query) ||
                    (job?.description?.toLowerCase() || "").includes(query) ||
                    (job?.location?.toLowerCase() || "").includes(query) ||
                    (job?.company?.name?.toLowerCase() || "").includes(query) ||
                    (job?.requirements && Array.isArray(job.requirements) && job.requirements.some(req =>
                        (typeof req === 'string' ? req.toLowerCase() : "").includes(query)
                    ))
                );
            });
            setFilterJobs(filteredJobs);
        } else {
            setFilterJobs(allJobs || []);
        }
    }, [allJobs, searchedQuery]);



    return (
        <div>
            <Navbar />
            <div className='max-w-7xl mx-auto my-10 px-4'>
                <h1 className='font-bold text-xl my-10'>Search Results ({filterJobs.length})</h1>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {
                        filterJobs.length > 0 ? filterJobs.map((job) => {
                            return (
                                <Job key={job._id} job={job} />
                            )
                        }) : <span className='text-center w-full'>No jobs found matching your search</span>
                    }
                </div>
            </div>
        </div>
    )
}

export default Browse;
