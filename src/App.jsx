// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom'; // Import useLocation
import { AuthProvider } from './hooks/useAuth';
// Import all components and pages
import Header from './components/Header'; // Note: Header is now passed as a prop
import Home from './pages/Home';
import Profile from './pages/Profile';
import Media from './pages/Media';
import UploadModal from './components/UploadModal';
import AuthModal from './components/AuthModal';
// Import styles
import './styles/index.css';
import 'react-toastify/dist/ReactToastify.css'; // Make sure this is here

function AppContent() {
  
  const [theme, setTheme] = useState('dark');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const location = useLocation(); // Hook to detect route changes


  

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };


  // Modal handlers
  const openUploadModal = () => setShowUploadModal(true);
  const closeUploadModal = () => setShowUploadModal(false);
  const openAuthModal = (tab = 'login') => {
    setAuthTab(tab);
    setShowAuthModal(true);
  };
  const closeAuthModal = () => setShowAuthModal(false);

  // Close modals on route change
  useEffect(() => {
    closeUploadModal();
    closeAuthModal();
  }, [location.pathname]); // Dependency on pathname

  // Props to pass to pages that need the Header & modal functions
  const pageProps = {
    theme,
    toggleTheme,
    openUploadModal,
    openAuthModal,
  };

  return (
    <div className="app">
      {/* The Header is no longer global here. 
        It's passed into Home and Media to be rendered *within* those pages.
      */}
      <Routes>
        <Route path="/" element={<Home {...pageProps} />} />
        <Route path="/profile" element={<Profile />} />
        {/*
          --- THIS IS THE FIX ---
          Pass the pageProps to the Media route as well.
        */}
        <Route path="/media/:id" element={<Media {...pageProps} />} />
      </Routes>

      {/* Modals remain global */}
      {showUploadModal && <UploadModal onClose={closeUploadModal} />}
      {showAuthModal && (
        <AuthModal initialTab={authTab} onClose={closeAuthModal} />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;