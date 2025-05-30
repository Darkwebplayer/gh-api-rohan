import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated() && user) {
      navigate('/dashboard');
    }

    // Check for error in URL params
    const error = searchParams.get('error');
    if (error === 'auth_failed') {
      alert('Authentication failed. Please try again.');
    }
  }, [isAuthenticated, user, navigate, searchParams]);

  const handleLogin = () => {
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/auth/github`;
  };

  return (
    <div className="login-page d-flex align-items-center justify-content-center">
      <div className="login-card p-5 rounded shadow">
        <img
          src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
          alt="GitHub Logo"
          width="60"
          className="mb-3"
        />
        <h2 className="text-white mb-4">Sign in with GitHub</h2>
        <button onClick={handleLogin} className="btn btn-outline-light w-100">
          <i className="bi bi-github me-2"></i> Authenticate with GitHub
        </button>
      </div>
    </div>
  );
};

export default Login;
