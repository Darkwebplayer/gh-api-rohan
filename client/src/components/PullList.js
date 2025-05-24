import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, ListGroup, Button, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import 'bootstrap-icons/font/bootstrap-icons.css';

function IssueList() {
  const { id } = useParams();
  const { createAuthenticatedRequest } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repoInfo, setRepoInfo] = useState(null);

  useEffect(() => {
    const fetchIssuesAndRepoInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        const api = createAuthenticatedRequest();

        // Fetch both issues and repo info
        const [issuesResponse, repoResponse] = await Promise.all([
          api.get(`/api/repo/${id}/issues`),
          api.get(`/api/repo/${id}`)
        ]);

        setIssues(issuesResponse.data);
        setRepoInfo(repoResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch issues:', err);
        setError(err.response?.data?.error || 'Failed to fetch issues');
        setLoading(false);
      }
    };

    fetchIssuesAndRepoInfo();
  }, [id, createAuthenticatedRequest]);

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading issues...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  const actualIssues = issues.filter(issue => !issue.pull_request);

  return (
    <Container className="my-5 p-4 shadow rounded bg-white">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="text-primary fw-bold mb-1">
            <i className="bi bi-exclamation-circle me-2"></i>
            Open Issues
          </h3>
          {repoInfo && (
            <p className="text-muted mb-0">
              <i className="bi bi-github me-1"></i>
              {repoInfo.full_name}
            </p>
          )}
        </div>
        <Button variant="outline-primary" size="sm" as={Link} to="/dashboard">
          <i className="bi bi-arrow-left-circle me-2"></i>
          Back to Dashboard
        </Button>
      </div>

      {actualIssues.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-check-circle text-success" style={{ fontSize: '3rem' }}></i>
          <h4 className="mt-3 text-muted">No Open Issues</h4>
          <p className="text-muted">This repository has no open issues at the moment.</p>
        </div>
      ) : (
        <>
          <div className="mb-3 text-muted">
            <small>{actualIssues.length} open issue{actualIssues.length !== 1 ? 's' : ''}</small>
          </div>
          <ListGroup>
            {actualIssues.map(issue => (
              <ListGroup.Item
                key={issue.id}
                className="d-flex justify-content-between align-items-start"
              >
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center mb-1">
                    <i className="bi bi-dot text-success me-1" style={{ fontSize: '1.5rem' }}></i>
                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none fw-semibold"
                      style={{ color: '#0969da' }}
                    >
                      {issue.title}
                    </a>
                  </div>
                  <div className="text-muted small">
                    <span>#{issue.number}</span>
                    <span className="mx-2">•</span>
                    <span>opened by {issue.user.login}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                    {issue.labels.length > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        {issue.labels.map(label => (
                          <span
                            key={label.id}
                            className="badge rounded-pill me-1"
                            style={{
                              backgroundColor: `#${label.color}`,
                              color: getContrastColor(label.color)
                            }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>
                <div className="text-end">
                  <small className="text-muted">
                    <i className="bi bi-chat-left me-1"></i>
                    {issue.comments}
                  </small>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </>
      )}
    </Container>
  );
}

// Helper function to determine text color based on background
function getContrastColor(hexColor) {
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}

export default IssueList;
