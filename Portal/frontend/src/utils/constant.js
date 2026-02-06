// Determine the base URL based on the environment
const isDevelopment = process.env.NODE_ENV === 'development';

// In development, use localhost. In production, use relative URL
export const BASE_API_URL = isDevelopment 
  ? "http://localhost:8001/api/v1" 
  : "/api/v1";

export const USER_API_END_POINT = `${BASE_API_URL}/user`;
export const JOB_API_END_POINT = `${BASE_API_URL}/job`;
export const APPLICATION_API_END_POINT = `${BASE_API_URL}/application`;
export const COMPANY_API_END_POINT = `${BASE_API_URL}/company`;
