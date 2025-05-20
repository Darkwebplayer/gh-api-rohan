import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';
import axios from 'axios';
import RepoCard from '../components/RepoCard';

const SearchResults = () => {
  const location = useLocation();
  const { q: query } = queryString.parse(location.search);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:3001/api/search?query=${query}`, {
          withCredentials: true,
        });
        setResults(res.data);
      } catch (err) {
        console.error(err);
        setError('Search failed');
      } finally {
        setLoading(false);
      }
    };

    if (query) fetchSearchResults();
  }, [query]);

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" /></div>;
  if (error) return <div className="alert alert-danger mt-4 text-center">{error}</div>;
  if (!results) return <p className="text-center mt-4 text-dark">No search results found.</p>;

  return (
    <div className="container mt-4 bg-white p-4 rounded shadow-sm">
      <button
        className="btn btn-outline-dark mb-4 fw-semibold"
        onClick={() => window.history.back()}
      >
        ← Back to Dashboard
      </button>

      {results.source === 'user' ? (
        <>
          <h4 className="mb-3 text-dark fw-bold">Your Repository Result:</h4>
          <div className="row">
            <div className="col-md-6 col-lg-4">
              <RepoCard repo={results.repo} />
            </div>
          </div>
        </>
      ) : (
        <>
          <h4 className="mb-3 text-dark fw-bold">Global Search Results</h4>
          <ul className="list-group shadow-sm">
            {results.repos.map((repo) => (
              <li
                className="list-group-item d-flex justify-content-between align-items-start flex-column"
                key={repo.id}
              >
                <div className="w-100">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h6 d-block text-decoration-none text-primary"
                  >
                    {repo.full_name}
                  </a>
                  {repo.description && (
                    <p className="mb-1 text-muted">{repo.description}</p>
                  )}
                  <span className={`badge ${repo.source === 'user' ? 'bg-primary' : 'bg-secondary'}`}>
                    {repo.source === 'user' ? 'Your Repo' : 'Global'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default SearchResults;
