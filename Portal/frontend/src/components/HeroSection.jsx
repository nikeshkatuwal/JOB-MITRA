import React, { useState } from 'react';
import { Button } from './ui/button';
import { Search, Briefcase, TrendingUp, Users } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchedQuery } from '@/redux/jobSlice';
import { useNavigate } from 'react-router-dom';
import Typewriter from 'typewriter-effect';
import heroImage from '../assets/herologo.png';

const HeroSection = () => {
    const [query, setQuery] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { darkMode } = useSelector((state) => state.theme);

    const searchJobHandler = () => {
        dispatch(setSearchedQuery(query));
        navigate("/browse");
    }

    const features = [
        {
            icon: <Briefcase className="w-6 h-6 text-purple-500" />,
            title: "Latest Jobs",
            description: "Access thousands of fresh job opportunities"
        },
        {
            icon: <TrendingUp className="w-6 h-6 text-purple-500" />,
            title: "Smart Matching",
            description: "AI-powered job recommendations based on your profile"
        },
        {
            icon: <Users className="w-6 h-6 text-purple-500" />,
            title: "Easy Apply",
            description: "One-click application process for faster results"
        }
    ];

    return (
        <div className={`min-h-[calc(100vh-4rem)] flex items-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-purple-50 to-white'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    {/* Left Content */}
                    <div className="space-y-8 text-center lg:text-left">
                        <div className="space-y-4">
                            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} leading-tight`}>
                                Find Your{' '}
                                <div className="inline-block h-[1.2em] bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                                    <Typewriter
                                        onInit={(typewriter) => {
                                            typewriter
                                                .typeString('Dream Job')
                                                .pauseFor(2000)
                                                .deleteAll()
                                                .typeString('Perfect Role')
                                                .pauseFor(2000)
                                                .deleteAll()
                                                .typeString('Next Career')
                                                .pauseFor(2000)
                                                .deleteAll()
                                                .start();
                                        }}
                                        options={{
                                            autoStart: true,
                                            loop: true,
                                            delay: 50,
                                            deleteSpeed: 30,
                                            cursor: '|',
                                            wrapperClassName: 'inline-block',
                                            cursorClassName: 'text-purple-600 animate-pulse',
                                        }}
                                    />
                                </div>
                            </h1>
                            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto lg:mx-0`}>
                                Discover opportunities that match your experience. Our AI-powered platform connects you with the perfect job opportunities tailored to your skills and preferences.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="flex w-full max-w-2xl mx-auto lg:mx-0">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search for jobs, skills, or companies"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && searchJobHandler()}
                                    className={`w-full px-6 py-3.5 rounded-l-full border-2 ${darkMode
                                            ? 'border-gray-700 bg-gray-800 text-gray-100'
                                            : 'border-purple-200 text-gray-900'
                                        } border-r-0 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition duration-200`}
                                />
                            </div>
                            <Button
                                onClick={searchJobHandler}
                                className="px-8 py-7 rounded-r-full bg-purple-600 hover:bg-purple-700 transition duration-200"
                            >
                                <Search className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className={`flex flex-col items-center sm:items-start p-4 rounded-lg ${darkMode
                                            ? 'bg-gray-800 text-gray-100'
                                            : 'bg-white text-gray-900'
                                        } shadow-sm hover:shadow-md transition duration-200 space-y-2`}
                                >
                                    {feature.icon}
                                    <h3 className="font-semibold">{feature.title}</h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} text-center sm:text-left`}>{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Image */}
                    <div className="relative order-first lg:order-last">
                        <div className="relative z-10">
                            <img
                                src={heroImage}
                                alt="Job Search"
                                className="w-full h-auto max-w-lg mx-auto rounded-2xl shadow-2xl"
                                style={darkMode ? { filter: 'brightness(0.9) contrast(1.1)' } : {}}
                            />
                        </div>
                        {/* Decorative Background Elements */}
                        <div className="absolute inset-0 -z-10">
                            <div className={`absolute right-1/4 top-0 w-72 h-72 ${darkMode ? 'bg-purple-900' : 'bg-purple-200'} rounded-full filter blur-3xl opacity-20 animate-blob`}></div>
                            <div className={`absolute left-1/4 bottom-0 w-72 h-72 ${darkMode ? 'bg-blue-900' : 'bg-blue-200'} rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000`}></div>
                            <div className={`absolute right-1/2 top-1/2 w-72 h-72 ${darkMode ? 'bg-pink-900' : 'bg-pink-200'} rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-4000`}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HeroSection;