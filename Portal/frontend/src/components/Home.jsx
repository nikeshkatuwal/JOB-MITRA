import React, { useEffect } from 'react'
import Navbar from './shared/Navbar'
import HeroSection from './HeroSection'
import CategoryCarousel from './CategoryCarousel'
import LatestJobs from './LatestJobs'
import Footer from './shared/Footer'
import useGetAllJobs from '@/hooks/useGetAllJobs'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const darkModeStyles = {
  homeContainer: {
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)'
  },
  heroSection: {
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)'
  },
  contentSection: {
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)'
  }
};

const Home = () => {
  useGetAllJobs();
  const { user } = useSelector(store => store.auth);
  const navigate = useNavigate();
  const { darkMode } = useSelector((state) => state.theme);
  useEffect(() => {
    if (user?.role === 'recruiter') {
      navigate("/admin/companies");
    }
  }, []);
  return (
    <div className='font-nody' style={darkMode ? darkModeStyles.homeContainer : {}}>
      <Navbar />
      <HeroSection />
      <LatestJobs />
      <Footer />
    </div>
  )
}

export default Home