import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDarkMode } from '../../redux/themeSlice';

const ThemeProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { darkMode } = useSelector((state) => state.theme);

  useEffect(() => {
    // Check for user's system preference on component mount
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Only set if we don't have a stored preference yet
    if (typeof darkMode !== 'boolean') {
      dispatch(setDarkMode(prefersDarkMode));
    }
    
    // Apply the current dark mode setting
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#0f172a';
      document.body.style.color = '#e2e8f0';
      
      // Force dark mode on all direct children of body
      document.querySelectorAll('body > div').forEach(el => {
        el.classList.add('dark');
        el.style.backgroundColor = '#0f172a';
      });
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
      
      // Remove dark mode from all direct children of body
      document.querySelectorAll('body > div').forEach(el => {
        el.classList.remove('dark');
        el.style.backgroundColor = '';
      });
    }
    
    // Add a MutationObserver to maintain dark mode when DOM changes
    const observer = new MutationObserver((mutations) => {
      if (darkMode) {
        mutations.forEach(mutation => {
          if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) { // Element node
                node.classList.add('dark');
              }
            });
          }
        });
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      observer.disconnect();
    };
  }, [darkMode, dispatch]);

  return <>{children}</>;
};

export default ThemeProvider; 