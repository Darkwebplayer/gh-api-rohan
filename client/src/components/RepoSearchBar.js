// components/RepoSearchBar.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RepoSearchBar = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim()) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const fetchSuggestions = async (query) => {
    try {
      const res = await axios.get(`http://localhost:3001/api/suggest?query=${query}`, {
        withCredentials: true,
      });
      setSuggestions(res.data);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Suggestion error:', err);
      setSuggestions([]);
    }
  };

  const handleSelect = (repoFullName) => {
    navigate(`/search?q=${encodeURIComponent(repoFullName)}`);
    setShowSuggestions(false);
  };

  const handleManualSearch = () => {
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setShowSuggestions(false);
  };

  return (
    <div className="mb-4 position-relative">
      <div className="input-group">
        <input
          type="text"
          placeholder="Search Repositories..."
          className="form-control"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleManualSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="list-group position-absolute w-100 zindex-dropdown mt-1">
          {suggestions.map((repo) => (
            <li
              key={repo.id}
              className="list-group-item list-group-item-action"
              onClick={() => handleSelect(repo.full_name)}
              style={{ cursor: 'pointer' }}
            >
              <strong>{repo.full_name}</strong>
              <span className={`badge ms-2 ${repo.source === 'user' ? 'bg-primary' : 'bg-secondary'}`}>
                {repo.source === 'user' ? 'Your Repo' : 'Global'}
              </span>
              <br />
              <small className="text-muted">{repo.description}</small>
            </li>
          ))}
        </ul>
      )}

      {error && <div className="text-danger mt-2">{error}</div>}
    </div>
  );
};

export default RepoSearchBar;
