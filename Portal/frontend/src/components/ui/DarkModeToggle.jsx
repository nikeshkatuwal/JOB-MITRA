import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Moon, Sun } from 'lucide-react';
import { toggleDarkMode } from '../../redux/themeSlice';
import { Button } from './button';

const DarkModeToggle = () => {
  const dispatch = useDispatch();
  const { darkMode } = useSelector((state) => state.theme);

  // Helper function to force dark mode on all elements
  const forceDarkMode = () => {
    // Target all divs and sections that might have inline styles
    const allDivs = document.querySelectorAll('div, section, main, article, aside');
    allDivs.forEach(el => {
      // Skip elements with certain classes that should maintain their styling
      if (el.classList.contains('dark-mode-toggle') || 
          el.getAttribute('aria-label') === 'Toggle dark mode') {
        return;
      }
      
      // If the element has a background color set, override it
      if (el.style.backgroundColor) {
        el.style.backgroundColor = '#0f172a';
      }
      
      // If the element has a light text color, override it
      if (el.style.color && 
          (el.style.color.includes('rgb(0,') || 
           el.style.color.includes('rgb(255,') ||
           el.style.color.includes('#fff') ||
           el.style.color.includes('#000'))) {
        el.style.color = '#e2e8f0';
      }
      
      // Add dark class to ensure our CSS rules apply
      el.classList.add('dark-mode');
    });
    
    // Specifically target elements in Home, Profile, Jobs, and Browse pages
    ['home', 'profile', 'jobs', 'browse'].forEach(page => {
      document.querySelectorAll(`[data-page="${page}"], .${page}, #${page}`).forEach(el => {
        el.style.backgroundColor = '#0f172a';
        el.style.color = '#e2e8f0';
      });
    });
  };

  useEffect(() => {
    // Apply dark mode class to document when component mounts or darkMode changes
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#0f172a';
      document.body.style.color = '#e2e8f0';
      
      // Force dark mode styles
      forceDarkMode();
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    }
  }, [darkMode]);

  const handleToggle = () => {
    dispatch(toggleDarkMode());
    // Force a repaint to ensure styles are immediately applied
    setTimeout(() => {
      if (!darkMode) {
        forceDarkMode();
      }
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label="Toggle dark mode"
      className={`rounded-full p-2 transition-all duration-300 hover:scale-110 ${
        darkMode 
          ? 'bg-slate-700 hover:bg-slate-600 text-yellow-300 border border-slate-600' 
          : 'bg-amber-100 hover:bg-amber-200 text-slate-800 border border-amber-200'
      }`}
      style={{
        boxShadow: darkMode ? '0 0 10px rgba(255, 255, 255, 0.1)' : '0 0 10px rgba(0, 0, 0, 0.1)'
      }}
    >
      {darkMode ? (
        <Sun className="h-5 w-5 transition-transform hover:rotate-90 duration-500" />
      ) : (
        <Moon className="h-5 w-5 transition-transform hover:-rotate-12 duration-300" />
      )}
      <span className="sr-only">{darkMode ? 'Switch to light mode' : 'Switch to dark mode'}</span>
    </Button>
  );
};

export default DarkModeToggle; 