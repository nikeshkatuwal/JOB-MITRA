import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { BriefcaseBusiness } from 'lucide-react';

const Logo = ({ size = 'default', linkTo = '/' }) => {
  const { darkMode } = useSelector((state) => state.theme);
  
  const sizeClasses = {
    small: 'text-xl',
    default: 'text-2xl md:text-3xl',
    large: 'text-3xl md:text-4xl lg:text-5xl'
  };
  
  const logoClass = sizeClasses[size] || sizeClasses.default;

  return (
    <Link to={linkTo} className="flex items-center gap-2 transition-transform hover:scale-[1.02]">
      <div className="relative">
        <BriefcaseBusiness 
          className={`h-7 w-7 ${size === 'large' ? 'h-8 w-8' : size === 'small' ? 'h-5 w-5' : 'h-7 w-7'} 
            text-purple-600 dark:text-purple-400`} 
        />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
      </div>
      <span className={`font-bold ${logoClass} bg-clip-text ${darkMode ? 'text-transparent bg-gradient-to-r from-purple-400 to-blue-400' : 'text-transparent bg-gradient-to-r from-purple-600 to-blue-600'}`}>
        Job<span className="font-extrabold">Mitra</span>
      </span>
    </Link>
  );
};

export default Logo; 