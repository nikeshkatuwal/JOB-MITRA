import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '@/redux/userSlice';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { User, LogOut, Settings, Briefcase, ChevronDown } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.user);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/login');
    };

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo and Navigation */}
                    <div className="flex">
                        <Link to="/" className="flex items-center">
                            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                                Job Mitra
                            </span>
                        </Link>
                        
                        <div className="hidden sm:ml-8 sm:flex sm:space-x-4 sm:items-center">
                            <Link
                                to="/"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                            >
                                Home
                            </Link>
                            <Link
                                to="/jobs"
                                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                            >
                                Jobs
                            </Link>
                            {user?.role === 'employer' && (
                                <Link
                                    to="/post-job"
                                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                                >
                                    Post a Job
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center">
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                            <span className="text-sm font-medium text-purple-600">
                                                {user.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="hidden sm:block text-sm font-medium text-gray-700">
                                            {user.name}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel className="text-gray-700">My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    {user.role === 'employer' && (
                                        <DropdownMenuItem onClick={() => navigate('/my-jobs')} className="cursor-pointer">
                                            <Briefcase className="mr-2 h-4 w-4" />
                                            <span>My Jobs</span>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => navigate('/login')}
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    Login
                                </Button>
                                <Button
                                    onClick={() => navigate('/register')}
                                    className="bg-purple-600 text-white hover:bg-purple-700"
                                >
                                    Register
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;