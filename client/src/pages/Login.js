import React from 'react';
import './Login.css';

const Login = () => {
  const handleLogin = () => {
    window.location.href = 'http://localhost:3001/auth/github';
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
