import React, { useEffect, useState } from 'react';
import Navbar from '../shared/Navbar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AdminJobsTable from './AdminJobsTable';
import useGetAllAdminJobs from '@/hooks/useGetAllAdminJobs';
import { setSearchJobByText } from '@/redux/jobSlice';

const AdminJobs = () => {
    useGetAllAdminJobs();
    const [input, setInput] = useState("");
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setSearchJobByText(input));
    }, [input, dispatch]);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
            <Navbar />
            <div className='max-w-6xl mx-auto my-10 p-5'>
                <div className='flex flex-col md:flex-row items-center justify-between my-5'>
                    <Input
                        className="flex-grow md:w-1/3 mr-2"
                        placeholder="Filter by name, role"
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <Button 
                        onClick={() => navigate("/admin/jobs/create")} 
                        className="mt-4 md:mt-0 md:w-auto">
                        New Jobs
                    </Button>
                </div>
                <AdminJobsTable />
            </div>
        </div>
    );
};

export default AdminJobs;
