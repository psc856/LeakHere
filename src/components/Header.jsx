import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Upload, Search, Sun, Moon, User } from 'lucide-react';

const Header = memo(({ theme, toggleTheme, openUploadModal, openAuthModal }) => {
  const { user, isAuthenticated, getUserInitial } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get('search') || '');
  }, [location.search]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  }, [searchQuery, navigate]);

  const handleAuthClick = useCallback(() => {
    if (isAuthenticated()) {
      navigate('/profile');
    } else {
      openAuthModal?.();
    }
  }, [isAuthenticated, navigate, openAuthModal]);

  const handleLogoClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <header className="header">
      <div className="header-content">
        <div
          className="logo"
          onClick={handleLogoClick}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleLogoClick()}
          aria-label="Go to homepage"
        >
          <div className="logo-icon">💧</div>
          <span className="logo-text">LeakHere</span>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <Search size={18} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Search"
          />
        </form>

        <div className="header-actions">
          <button
            onClick={openUploadModal}
            className="btn btn-primary upload-btn"
            title="Upload File"
            aria-label="Upload File"
          >
            <Upload size={16} />
            <span className="btn-text">Upload</span>
          </button>
          <button
            onClick={toggleTheme}
            className="btn btn-secondary icon-btn"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={handleAuthClick}
            className="btn btn-secondary user-btn"
            title={isAuthenticated() ? 'Profile' : 'Login / Register'}
            aria-label={isAuthenticated() ? 'View Profile' : 'Login or Register'}
          >
            {isAuthenticated() ? getUserInitial() : <User size={18} />}
          </button>
        </div>
      </div>

      <style jsx>{`
        .header {
          padding: 1rem 0;
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--header-border);
          background: var(--header-bg);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 100;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.25rem;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          flex-shrink: 0;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .logo:hover {
          transform: scale(1.02);
        }

        .logo-icon {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(var(--accent-rgb), 0.3);
        }

        .logo-text {
          color: var(--text-primary);
          font-size: 1.375rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .search-form {
          position: relative;
          flex-grow: 1;
          max-width: 500px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          background: var(--bg-hover);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 0.9375rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent);
          background: var(--bg-secondary);
          box-shadow: 0 0 0 3px var(--accent-light);
        }

        .search-input::placeholder {
          color: var(--text-tertiary);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          flex-shrink: 0;
        }

        .upload-btn .btn-text {
          margin-left: 0.25rem;
        }

        .icon-btn,
        .user-btn {
          width: 42px;
          height: 42px;
          padding: 0;
          font-size: 1rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        @media (max-width: 1024px) {
          .header-content {
            padding: 0 1.5rem;
          }

          .search-form {
            max-width: 400px;
          }
        }

        @media (max-width: 768px) {
          .header-content {
            padding: 0 1rem;
            gap: 0.75rem;
          }

          .logo-icon {
            width: 36px;
            height: 36px;
            font-size: 1.25rem;
          }

          .logo-text {
            font-size: 1.125rem;
          }

          .search-form {
            max-width: 300px;
          }

          .search-input {
            padding: 0.625rem 0.875rem 0.625rem 2.5rem;
            font-size: 0.875rem;
          }

          .search-icon {
            left: 0.875rem;
          }

          .upload-btn {
            padding: 0;
            width: 42px;
            height: 42px;
          }

          .upload-btn .btn-text {
            display: none;
          }

          .icon-btn,
          .user-btn {
            width: 40px;
            height: 40px;
          }
        }

        @media (max-width: 640px) {
          .header {
            padding: 0.75rem 0;
            margin-bottom: 1.25rem;
          }

          .header-content {
            gap: 0.5rem;
          }

          .logo-icon {
            display: none;
          }

          .logo-text {
            font-size: 1rem;
          }

          .search-form {
            flex: 1;
            max-width: none;
          }

          .search-input {
            padding: 0.5rem 0.75rem 0.5rem 2.25rem;
            font-size: 0.8125rem;
          }

          .search-icon {
            left: 0.75rem;
            width: 16px;
            height: 16px;
          }

          .header-actions {
            gap: 0.375rem;
          }

          .upload-btn,
          .icon-btn,
          .user-btn {
            width: 38px;
            height: 38px;
          }
        }

        @media (max-width: 480px) {
          .header-content {
            padding: 0 0.875rem;
          }

          .search-input {
            padding: 0.5rem 0.625rem 0.5rem 2rem;
          }

          .search-icon {
            left: 0.625rem;
          }
        }

        @media (hover: none) and (pointer: coarse) {
          .logo:hover {
            transform: none;
          }

          .logo:active {
            transform: scale(0.98);
          }
        }
      `}</style>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
