// AuthModal.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { X, User, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AuthModal = ({ initialTab = 'login', onClose }) => {
  const { user, login, register, logout, getUserInitial } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(formData.username, formData.password);
    setLoading(false);
    if (result.success) {
      onClose();
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    const result = await register(formData.username, formData.password);
    setLoading(false);
    if (result.success) {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (user) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Profile</h2>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="profile-content">
            <div className="profile-avatar-large">{getUserInitial()}</div>
            <h3 className="profile-username">{user.username}</h3>
            <p className="profile-info">You are logged in.</p>

            <button
              className="btn btn-danger"
              onClick={handleLogout}
              style={{ width: '100%' }}
            >
              Logout
            </button>
          </div>
        </div>
        <style jsx>{`
          /* --- Shared Modal Styles --- */
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
            animation: fadeIn 0.2s ease;
          }

          .auth-modal {
            background: var(--bg-secondary);
            border-radius: 16px;
            max-width: 400px;
            width: 100%;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-lg);
            animation: scaleIn 0.3s ease;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--border-color);
          }
          .modal-header h2 {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary);
          }
          .close-btn {
            background: none;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }
          .close-btn:hover {
            background: var(--bg-hover);
            color: var(--text-primary);
          }
          
          /* --- Profile View --- */
          .profile-content {
            padding: 2rem;
            text-align: center;
          }
          .profile-avatar-large {
            width: 80px;
            height: 80px;
            background: var(--accent);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            font-weight: 600;
            margin: 0 auto 1.25rem;
          }
          .profile-username {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.25rem;
          }
          .profile-info {
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{activeTab === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="auth-form">
            <InputGroup
              icon={<User size={18} />}
              label="Username"
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="Enter your username"
              required
            />
            <InputGroup
              icon={<Lock size={18} />}
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Enter your password"
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="auth-form">
            <InputGroup
              icon={<User size={18} />}
              label="Username"
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="Choose a username"
              required
            />
            <InputGroup
              icon={<Lock size={18} />}
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Create a password"
              required
            />
            <InputGroup
              icon={<Lock size={18} />}
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              placeholder="Confirm your password"
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }

        .auth-modal {
          background: var(--bg-secondary);
          border-radius: 16px;
          max-width: 400px;
          width: 100%;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
          animation: scaleIn 0.3s ease;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        .modal-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .close-btn {
          background: none;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .close-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .auth-tabs {
          display: flex;
          padding: 0.5rem;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
        }
        .auth-tab {
          flex: 1;
          padding: 0.75rem;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all 0.2s;
          border-radius: 8px;
        }
        .auth-tab.active {
          color: var(--text-primary);
          background: var(--bg-secondary);
        }
        .auth-tab:hover:not(.active) {
          color: var(--text-primary);
        }

        .auth-form {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
      `}</style>
    </div>
  );
};

// Modern Input Component
const InputGroup = ({ icon, label, ...props }) => (
  <div className="form-group">
    <label>{label}</label>
    <div className="input-wrapper">
      <span className="input-icon">{icon}</span>
      <input {...props} />
    </div>
    <style jsx>{`
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .form-group label {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.9rem;
      }
      .input-wrapper {
        position: relative;
      }
      .input-icon {
        position: absolute;
        left: 0.85rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-tertiary);
      }
      .form-group input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        color: var(--text-primary);
        font-family: inherit;
        font-size: 0.9rem;
        transition: all 0.2s;
      }
      .form-group input:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-light);
      }
    `}</style>
  </div>
);

export default AuthModal;