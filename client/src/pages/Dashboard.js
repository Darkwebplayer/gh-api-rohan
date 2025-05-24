import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import axios from 'axios';
import RepoSearchBar from '../components/RepoSearchBar';
import RepoCard from '../components/RepoCard';

const Dashboard = () => {
  const [repos, setRepos] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [user, setUser] = useState(null);
  useEffect(() => {
    const checkAuthAndFetchRepos = async () => {
      try {
        // Step 1: Check if user is authenticated
        const userResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user`, {
          withCredentials: true,  // CRITICAL for cross-domain cookies
        });
        console.log("User:", userResponse.data);
        setUser(userResponse.data);

        // Step 2: Fetch repositories
        const repoResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/repo`, {
          withCredentials: true,
        });
        setRepos(repoResponse.data);
      } catch (error) {
        console.error("Authentication or Repo Fetch Failed:", error);
        // Redirect to login if authentication fails
        if (error.response && error.response.status === 401) {
          window.location.href = '/';
        }
      }
    };

    checkAuthAndFetchRepos();
  }, []);

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
         <div>
          <button
            className="btn btn-outline-light border border-secondary text-white d-flex align-items-center gap-2 px-3 py-1"
            onClick={() => {
              window.location.href = `${process.env.REACT_APP_BACKEND_URL}/logout`;
            }}
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
          <a
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
