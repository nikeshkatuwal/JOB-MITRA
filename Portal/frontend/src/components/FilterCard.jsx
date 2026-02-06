import React, { useEffect, useState } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { useDispatch } from 'react-redux';
import { setSearchedQuery } from '@/redux/jobSlice';
import { MapPin, Building2, IndianRupee, X } from 'lucide-react';
import { Button } from './ui/button';

const filterData = [
    {
        filterType: "Location",
        icon: <MapPin className="w-4 h-4" />,
        array: ["Kathmandu", "Pokhara", "Itahari", "Dharan", "Biratnagar", "Damak", "Birgunj", "Hetauda", "Chitwan", "Butwal", 
            "Nepalgunj"]
    },
    {
        filterType: "Role",
        icon: <Building2 className="w-4 h-4" />,
        array: ["Frontend Developer", "Backend Developer", "Full Stack Developer", "DevOps Engineer", "Data Scientist", "UI/UX Designer",
            "Chartered Accountant", "Marketing Manager", "Sales Executive", "HR Manager", "Product Manager"]
    },
    
    {
        filterType: "Salary Range",
        icon: <IndianRupee className="w-4 h-4" />,
        array: ["1 LPA", "2 LPA", "1-3 LPA", "1-2 LPA", "1+ LPA"]
    },
];

const FilterCard = () => {
    const [selectedFilters, setSelectedFilters] = useState({
        Location: '',
        Role: '',
        'Salary Range': ''
    });
    const dispatch = useDispatch();

    const handleFilterChange = (value, filterType) => {
        setSelectedFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const clearFilter = (filterType) => {
        setSelectedFilters(prev => ({
            ...prev,
            [filterType]: ''
        }));
    };

    const clearAllFilters = () => {
        setSelectedFilters({
            Location: '',
            Role: '',
            'Salary Range': ''
        });
    };

    useEffect(() => {
        // Create a simple query string with all active filters
        const activeFilters = Object.entries(selectedFilters)
            .filter(([_, value]) => value) // Only include non-empty values
            .map(([type, value]) => {
                // For salary range, extract just the numbers
                if (type === 'Salary Range') {
                    return value.replace(' LPA', ''); // Remove "LPA" to make it cleaner
                }
                return value;
            });
        
        // Join with spaces and dispatch
        dispatch(setSearchedQuery(activeFilters.join(' ')));
    }, [selectedFilters, dispatch]);

    const hasActiveFilters = Object.values(selectedFilters).some(Boolean);

    return (
        <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
            <div className='p-4 border-b border-gray-100'>
                <div className='flex items-center justify-between'>
                    <h1 className='font-bold text-xl text-gray-900'>Filters</h1>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className='text-gray-500 hover:text-gray-700'
                        >
                            Clear All
                        </Button>
                    )}
                </div>
            </div>

            <div className='divide-y divide-gray-100'>
                {filterData.map((data, index) => (
                    <div key={index} className='p-4 space-y-3'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2 text-gray-900'>
                                {data.icon}
                                <h2 className='font-semibold'>{data.filterType}</h2>
                            </div>
                            {selectedFilters[data.filterType] && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => clearFilter(data.filterType)}
                                    className='text-gray-500 hover:text-gray-700 p-0 h-auto'
                                >
                                    <X className='w-4 h-4' />
                                </Button>
                            )}
                        </div>

                        <RadioGroup
                            value={selectedFilters[data.filterType]}
                            onValueChange={(value) => handleFilterChange(value, data.filterType)}
                            className='space-y-2'
                        >
                            {data.array.map((item, idx) => (
                                <div key={idx} className='flex items-center space-x-2 group'>
                                    <RadioGroupItem
                                        value={item}
                                        id={`${data.filterType}-${idx}`}
                                        className='text-purple-600'
                                    />
                                    <Label
                                        htmlFor={`${data.filterType}-${idx}`}
                                        className='text-sm text-gray-600 group-hover:text-gray-900 transition-colors cursor-pointer'
                                    >
                                        {item}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                ))}
            </div>

            {hasActiveFilters && (
                <div className='p-4 bg-purple-50 border-t border-purple-100'>
                    <div className='flex flex-wrap gap-2'>
                        {Object.entries(selectedFilters).map(([type, value]) => (
                            value && (
                                <div
                                    key={type}
                                    className='bg-white px-3 py-1 rounded-full text-sm font-medium text-purple-600 border border-purple-200 flex items-center gap-2'
                                >
                                    <span>{value}</span>
                                    <button
                                        onClick={() => clearFilter(type)}
                                        className='text-purple-400 hover:text-purple-600'
                                    >
                                        <X className='w-3 h-3' />
                                    </button>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterCard;