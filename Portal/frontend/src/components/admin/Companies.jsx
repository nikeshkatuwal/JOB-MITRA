import React, { useEffect, useState } from 'react';
import Navbar from '../shared/Navbar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import CompaniesTable from './CompaniesTable';
import { useNavigate } from 'react-router-dom';
import useGetAllCompanies from '@/hooks/useGetAllCompanies';
import { useDispatch } from 'react-redux';
import { setSearchCompanyByText } from '@/redux/companySlice';

const Companies = () => {
    useGetAllCompanies();
    const [input, setInput] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setSearchCompanyByText(input));
    }, [input, dispatch]);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
            <Navbar />
            <div className="max-w-6xl mx-auto my-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between my-5">
                    <Input
                        className="flex-grow md:max-w-md"
                        placeholder="Filter by name"
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <Button
                        onClick={() => navigate('/admin/companies/create')}
                        className="mt-4 md:mt-0 md:ml-4"
                    >
                        New Company
                    </Button>
                </div>
                <CompaniesTable />
            </div>
        </div>
    );
};

export default Companies;
