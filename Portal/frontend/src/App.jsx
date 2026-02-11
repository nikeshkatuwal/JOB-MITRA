import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/shared/Navbar'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import ForgotPassword from './components/auth/ForgotPassword'
import ResetPassword from './components/auth/ResetPassword'
import Home from './components/Home'
import Jobs from './components/Jobs'
import Browse from './components/Browse'
import Profile from './components/Profile'
import RecruiterProfile from './components/RecruiterProfile'
import JobDescription from './components/JobDescription'
import Companies from './components/admin/Companies'
import CompanyCreate from './components/admin/CompanyCreate'
import CompanySetup from './components/admin/CompanySetup'
import AdminJobs from "./components/admin/AdminJobs";
import JobPost from './components/admin/JobPost'
import Applicants from './components/admin/Applicants'
import ProtectedRoute from './components/admin/ProtectedRoute'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'

// Protected Route component
const ProtectedRecruiterRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user || user.role !== 'recruiter') {
    return <Navigate to="/login" />;
  }

  return children;
};

const App = () => {
  const { darkMode } = useSelector((state) => state.theme);

  useEffect(() => {
    // Apply dark mode class to html and body elements
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#1c2844';
      document.body.style.color = '#b9c6d8';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    }
  }, [darkMode]);

  return (
    <div className={`app-wrapper ${darkMode ? 'dark' : ''}`}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/password/reset/:token" element={<ResetPassword />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/description/:id" element={<JobDescription />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/recruiter/profile" element={
            <ProtectedRecruiterRoute>
              <RecruiterProfile />
            </ProtectedRecruiterRoute>
          } />

          {/* Protected Admin Routes */}
          <Route path="/admin/companies" element={
            <ProtectedRecruiterRoute>
              <Companies />
            </ProtectedRecruiterRoute>
          } />
          <Route path="/admin/companies/create" element={
            <ProtectedRecruiterRoute>
              <CompanyCreate />
            </ProtectedRecruiterRoute>
          } />
          <Route path="/admin/companies/:id" element={
            <ProtectedRecruiterRoute>
              <CompanySetup />
            </ProtectedRecruiterRoute>
          } />
          <Route path="/admin/jobs" element={
            <ProtectedRecruiterRoute>
              <AdminJobs />
            </ProtectedRecruiterRoute>
          } />
          <Route path="/admin/jobs/create" element={
            <ProtectedRecruiterRoute>
              <JobPost />
            </ProtectedRecruiterRoute>
          } />
          <Route path="/admin/jobs/:id/applicants" element={
            <ProtectedRecruiterRoute>
              <Applicants />
            </ProtectedRecruiterRoute>
          } />
        </Routes>
      </Router>
    </div>
  )
}

export default App
