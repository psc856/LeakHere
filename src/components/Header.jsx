import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import real hooks
import { useAuth } from '../hooks/useAuth'; // Import real hook
import { Upload, Search, Sun, Moon, User } from 'lucide-react';

// --- REMOVED MOCK NAVIGATION ---
// --- REMOVED MOCK useAuth HOOK ---

const Header = ({ theme, toggleTheme, openUploadModal, openAuthModal }) => {
  const { user, isAuthenticated, getUserInitial } = useAuth(); // Using real hook
  const navigate = useNavigate(); // Using real hook
  const location = useLocation(); // Using real hook
  const [searchQuery, setSearchQuery] = useState('');

  // Sync search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get('search') || '');
  }, [location.search]);

  // Handle Search (no changes needed)
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  // Handle Auth Click (no changes needed, uses real navigate now)
  const handleAuthClick = () => {
    if (isAuthenticated()) {
      console.log('Profile button clicked: Navigating to profile...'); // Keep log for confirmation
      navigate('/profile'); // This will now work
    } else {
      if (openAuthModal) openAuthModal();
      else console.log("Open Auth Modal triggered");
    }
  };

   // Use props directly, handle potential undefined props
   const currentTheme = theme || 'dark'; // Default to dark if theme prop is missing
   const effectiveToggleTheme = toggleTheme || (() => console.log("Toggle Theme (prop missing)"));
   const effectiveOpenUploadModal = openUploadModal || (() => console.log("Open Upload Modal (prop missing)"));
   const effectiveOpenAuthModal = openAuthModal || (() => console.log("Open Auth Modal (prop missing)"));


  return (
    <header className="header">
      <div className="header-content">
        {/* Logo */}
        <div
          className="logo"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
          aria-label="Go to homepage"
        >
          <div className="logo-icon">💧</div>
          <span className="logo-text">LeakHere</span>
        </div>

        {/* Search Form (Desktop) */}
        <form onSubmit={handleSearch} className="search-form desktop-only">
          <Search size={18} className="search-icon" />
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Search"
          />
        </form>

        {/* Search Form (Mobile) */}
        <form onSubmit={handleSearch} className="search-form mobile-only">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Search"
          />
        </form>

        {/* Actions */}
        <div className="header-actions">
          <button
            onClick={effectiveOpenUploadModal}
            className="btn btn-primary upload-btn"
            title="Upload File"
            aria-label="Upload File"
          >
            <Upload size={16} />
            <span className="desktop-only btn-text">Upload</span>
          </button>
          <button
            onClick={effectiveToggleTheme}
            className="btn btn-secondary theme-toggle-btn"
            title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={handleAuthClick}
            className="user-btn btn btn-secondary"
            title={isAuthenticated() ? 'Profile' : 'Login / Register'}
            aria-label={isAuthenticated() ? 'View Profile' : 'Login or Register'}
          >
            {isAuthenticated() ? getUserInitial() : <User size={18} />}
          </button>
        </div>
      </div>

      <style jsx>{`
        .header {
          padding: 0.75rem 0;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--header-border, var(--border-color));
          background: var(--header-bg, var(--bg-secondary));
          position: sticky; top: 0; z-index: 100;
        }
        .header-content {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          max-width: 1200px; margin: 0 auto; padding: 0 1.5rem;
        }
        .logo { display: flex; align-items: center; gap: 0.6rem; text-decoration: none; flex-shrink: 0; cursor: pointer; }
        .logo-icon { width: 36px; height: 36px; background: var(--accent); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: white; flex-shrink: 0; }
        .logo-text { color: var(--text-primary); font-size: 1.25rem; font-weight: 700; }

        /* --- Desktop Search --- */
        .search-form.desktop-only { position: relative; flex-grow: 1; max-width: 450px; margin: 0 1rem; }
        .search-form.desktop-only .search-icon { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); z-index: 1; pointer-events: none; }
        .search-form.desktop-only .search-input { width: 100%; padding: 0.6rem 1rem 0.6rem 2.5rem; background: var(--bg-hover); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary); font-size: 0.9rem; transition: all 0.2s ease; }
        .search-form.desktop-only .search-input:focus { outline: none; border-color: var(--accent); background: var(--bg-secondary); box-shadow: 0 0 0 3px var(--accent-light); }

        /* --- Mobile Search (NEW) --- */
        .search-form.mobile-only { display: none; /* Hidden by default */ position: relative; flex-grow: 1; margin: 0 0.5rem; max-width: 250px; }
        .search-form.mobile-only .search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); z-index: 1; pointer-events: none; }
        .search-form.mobile-only .search-input { width: 100%; padding: 0.5rem 0.75rem 0.5rem 2.25rem; background: var(--bg-hover); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 0.85rem; }
        .search-form.mobile-only .search-input:focus { outline: none; border-color: var(--accent); background: var(--bg-secondary); }

        /* Common Search Input Clear Button */
        input[type="search"]::-webkit-search-cancel-button { appearance: none; height: 16px; width: 16px; margin-right: 0.5rem; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0a0a5'><path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/></svg>"); cursor: pointer; }


        .header-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
        /* Desktop Upload Button Text */
        .upload-btn .btn-text { margin-left: 0.35rem; }

        /* Base size for icon buttons (Theme, User) */
        .theme-toggle-btn, .user-btn {
          width: 38px;
          height: 38px;
          padding: 0;
          font-size: 1rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* --- Mobile Styles --- */
        @media (max-width: 768px) {
          .header-content { padding: 0 1rem; gap: 0.5rem; }
          .logo-icon { display: none; }
          .logo { gap: 0; }
          .search-form.desktop-only { display: none; }
          .search-form.mobile-only { display: flex; }
          .upload-btn { padding: 0; width: 38px; height: 38px; }
          .upload-btn .btn-text { display: none; }
          .user-btn.desktop-only { display: none; } /* Ensure this rule exists */
        }

        /* Further adjustments for very small screens */
        @media (max-width: 480px) {
           .logo-text { font-size: 1.1rem; }
           .search-form.mobile-only { margin: 0 0.25rem; max-width: 180px; }
           .search-form.mobile-only .search-input { font-size: 0.8rem; padding: 0.4rem 0.5rem 0.4rem 2rem; }
           .search-form.mobile-only .search-icon { left: 0.5rem; }
           .header-actions { gap: 0.25rem; }
        }
      `}</style>
    </header>
  );
};

export default Header;