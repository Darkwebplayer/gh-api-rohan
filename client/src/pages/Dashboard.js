import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import RepoSearchBar from '../components/RepoSearchBar';
import RepoCard from '../components/RepoCard';

const Dashboard = () => {
  const { user, logout, handleAuthToken, createAuthenticatedRequest } = useAuth();
  const [repos, setRepos] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Handle token from OAuth callback
        const token = searchParams.get('token');
        if (token) {
          handleAuthToken(token);
          // Clean up URL
          window.history.replaceState({}, document.title, '/dashboard');
          return; // Return early, let the auth context handle the rest
        }

        // Fetch repositories
        const api = createAuthenticatedRequest();
        const repoResponse = await api.get('/api/repo');
        setRepos(repoResponse.data);
        setLoading(false);

      } catch (error) {
        console.error("Repo Fetch Failed:", error);
        setError(error);
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, searchParams, handleAuthToken, createAuthenticatedRequest]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-3">
        <h4>Error</h4>
        <p>{error.message}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard container-fluid bg-light text-dark min-vh-100">
      <header className="dashboard-header bg-dark text-white p-3 d-flex align-items-center justify-content-between border-bottom border-secondary">
        <div className="d-flex align-items-center">
          <img
            src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
            alt="GitHub Logo"
            width="40"
            className="me-3"
          />
          <h2 className="m-0">GitHub Dashboard</h2>
        </div>
        <div className="d-flex align-items-center gap-3">
          {user && (
            <div className="d-flex align-items-center gap-2">
              <img
                src={user.avatar}
                alt="Avatar"
                width="32"
                height="32"
                className="rounded-circle"
              />
              <span>{user.displayName || user.username}</span>
            </div>
          )}
          <button
            className="btn btn-outline-light border border-secondary text-white d-flex align-items-center gap-2 px-3 py-1"
            onClick={logout}
            style={{
              backgroundColor: '#24292e',
              borderRadius: '6px',
              fontWeight: '500',
            }}
          >
            <i className="bi bi-box-arrow-right"></i>
            Logout
          </button>
        </div>
      </header>

      <div className="container mt-5">
        <h1 className="mb-4 fw-bold">Repositories</h1>

        <RepoSearchBar onResult={setSearchResult} />

        {searchResult ? (
          <div className="mt-3">
            <button
              className="btn btn-outline-dark d-inline-flex align-items-center gap-2 mb-3"
              onClick={() => setSearchResult(null)}
            >
              <i className="bi bi-arrow-left-circle"></i>
              Back to All Repositories
            </button>

            {searchResult.source === 'user' ? (
              <div className="row mt-3">
                <div className="col-md-4">
                  <RepoCard repo={searchResult.repo} />
                </div>
              </div>
            ) : (
              <div className="card border-dark mb-4">
                <div className="card-header bg-dark text-white">
                  <h5 className="mb-0">Global Search Results</h5>
                </div>
                <ul className="list-group list-group-flush">
                  {searchResult.repos.map((repo) => (
                    <li className="list-group-item" key={repo.id}>
                      <h6 className="mb-1">

                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-decoration-none text-primary fw-semibold"
                        >
                          <i className="bi bi-box-arrow-up-right me-2"></i>{repo.full_name}
                        </a>
                      </h6>
                      <p className="text-muted mb-0">{repo.description || 'No description available.'}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="row">
            {repos.map((repo) => (
              <div className="col-md-4" key={repo.id}>
                <RepoCard repo={repo} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
