import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IssueList from './components/IssueList';
import PullList from './components/PullList';
import SearchResults from './pages/SearchResults';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/repo/:id/issues"
              element={
                <ProtectedRoute>
                  <IssueList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/repo/:id/pulls"
              element={
                <ProtectedRoute>
                  <PullList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <SearchResults />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
