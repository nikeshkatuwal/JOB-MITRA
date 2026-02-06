import axios from 'axios';
import { BASE_API_URL } from './constant';

// Create custom axios instance
const axiosInstance = axios.create({
    baseURL: BASE_API_URL,
    timeout: 30000, // Increase timeout to 30 seconds
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
    config => {
        console.log(`Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, config.data);
        return config;
    },
    error => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
    response => {
        console.log(`Response: ${response.status}`, response.data);
        return response;
    },
    error => {
        console.error('Response error:', error);
        // Check if error has response
        if (error.response) {
            console.error(`Error ${error.response.status}: ${error.response.statusText}`, error.response.data);
        } else if (error.request) {
            console.error('Error: No response received from server');
        }
        return Promise.reject(error);
    }
);

export default axiosInstance; 