import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IssueList from './components/IssueList';
import PullList from './components/PullList';
import SearchResults from './pages/SearchResults';

function App() {
  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/repo/:id/issues" element={<IssueList />} />
          <Route path="/repo/:id/pulls" element={<PullList />} />
          <Route path="/search" element={<SearchResults />} />

          {/* Add this route to handle the GitHub callback */}
          <Route
            path="/auth/github/callback"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
