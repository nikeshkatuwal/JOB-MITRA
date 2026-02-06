import React, { useEffect, useState } from 'react';
import Navbar from './shared/Navbar';
import Job from './Job';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import FilterCard from './FilterCard'

const Jobs = () => {
    const { allJobs, searchedQuery } = useSelector(store => store.job);
    const [filterJobs, setFilterJobs] = useState(allJobs);

    useEffect(() => {
        if (searchedQuery) {
            const filteredJobs = allJobs.filter((job) => {
                // Check if the query contains a salary range pattern like "0-3" or "15+"
                const salaryRangeMatch = searchedQuery.match(/(\d+)-(\d+)|\d+\+/);
                
                if (salaryRangeMatch) {
                    // Extract salary range values
                    const range = salaryRangeMatch[0];
                    const jobSalary = parseInt(job.salary);
                    
                    if (range.includes('-')) {
                        // Handle range like "0-3", "3-6", etc.
                        const [min, max] = range.split('-').map(Number);
                        if (!(jobSalary >= min && jobSalary <= max)) {
                            return false;
                        }
                    } else if (range.includes('+')) {
                        // Handle range like "15+"
                        const min = parseInt(range);
                        if (!(jobSalary >= min)) {
                            return false;
                        }
                    }
                    
                    // If we're filtering by salary, also check other fields
                    const otherTerms = searchedQuery.replace(range, '').trim();
                    if (otherTerms) {
                        return job.title.toLowerCase().includes(otherTerms.toLowerCase()) ||
                            job.description.toLowerCase().includes(otherTerms.toLowerCase()) ||
                            job.location.toLowerCase().includes(otherTerms.toLowerCase());
                    }
                    return true;
                }
                
                // Default search behavior if no salary range is detected
                return job.title.toLowerCase().includes(searchedQuery.toLowerCase()) ||
                    job.description.toLowerCase().includes(searchedQuery.toLowerCase()) ||
                    job.location.toLowerCase().includes(searchedQuery.toLowerCase());
            });
            setFilterJobs(filteredJobs);
        } else {
            setFilterJobs(allJobs);
        }
    }, [allJobs, searchedQuery]);

    return (
        <div>
            <Navbar />
            <div className='mx-auto mt-5 px-4'>
                <div className='flex flex-col lg:flex-row gap-5'>
                <div className=''>
                        <FilterCard />
                    </div>
                    {
                        filterJobs.length <= 0 ? (
                            <span className='text-center w-full'>Job not found</span>
                        ) : (
                            <div className='flex-1 h-[88vh] pb-5'>
                                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4'>
                                    {
                                        filterJobs.map((job) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: 100 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -100 }}
                                                transition={{ duration: 0.3 }}
                                                key={job?._id}>
                                                <Job job={job} />
                                            </motion.div>
                                        ))
                                    }
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    );
};

export default Jobs;
