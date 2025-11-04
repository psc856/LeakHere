import React, { useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Home, ChevronLeft } from 'lucide-react';

const Profile = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) navigate('/');
  }, [isAuthenticated, navigate]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  if (!user) return null;

  return (
    <div className="profile-page">
      <button className="close-btn" onClick={() => navigate(-1)} title="Go back">
        <ChevronLeft size={20} strokeWidth={3} />
      </button>

      <div className="container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-large">{user.username.charAt(0).toUpperCase()}</div>
            <h1 className="profile-username">{user.username}</h1>
            <p className="profile-id">User ID: {user.user_id}</p>
          </div>

          <div className="profile-info">
            <h3>Account Information</h3>
            <div className="info-item">
              <span className="info-label">Username</span>
              <span className="info-value">{user.username}</span>
            </div>
            <div className="info-item">
              <span className="info-label">User ID</span>
              <span className="info-value">{user.user_id}</span>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              <Home size={16} />Back to Home
            </button>
            <button className="btn btn-danger" onClick={handleLogout}>
              <LogOut size={16} />Logout
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-page { min-height: 100vh; padding: 6rem 0 3rem; background: var(--bg-primary); }
        .close-btn { position: fixed; left: 1.5rem; top: 1.5rem; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-secondary); cursor: pointer; width: 42px; height: 42px; border-radius: 50%; transition: all 0.2s; z-index: 1000; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-md); }
        .close-btn:hover { background: var(--bg-hover); color: var(--text-primary); transform: scale(1.05); }
        .profile-card { max-width: 500px; margin: 0 auto; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); }
        .profile-header { text-align: center; padding: 2.5rem 2rem 2rem; }
        .profile-avatar-large { width: 90px; height: 90px; background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 600; margin: 0 auto 1.25rem; box-shadow: 0 8px 24px rgba(var(--accent-rgb), 0.4); }
        .profile-username { font-size: 1.75rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem; }
        .profile-id { color: var(--text-secondary); font-size: 0.9375rem; }
        .profile-info { padding: 1.5rem; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.75rem; }
        .profile-info h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary); }
        .info-item { display: flex; justify-content: space-between; padding: 0.5rem 0; }
        .info-label { color: var(--text-secondary); font-weight: 500; font-size: 0.9375rem; }
        .info-value { color: var(--text-primary); font-weight: 500; font-size: 0.9375rem; }
        .profile-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1.5rem; }
        @media (max-width: 480px) { .profile-page { padding-top: 5rem; } .profile-card { border-radius: var(--radius-md); margin: 0 1rem; } .profile-header { padding: 2rem 1.5rem 1.5rem; } .profile-avatar-large { width: 80px; height: 80px; font-size: 2rem; } .profile-username { font-size: 1.5rem; } .profile-actions { grid-template-columns: 1fr; } .close-btn { left: 1rem; top: 1rem; width: 40px; height: 40px; } }
      `}</style>
    </div>
  );
};

export default memo(Profile);
